import { useState, useEffect, useMemo, useRef } from 'react';
// FIX 1: 将 Map 重命名为 MapIcon，避免与 JS 全局 Map 对象冲突
import { Search, MapPin, CheckCircle, Utensils, DollarSign, Star, X, ChevronRight, Award, ExternalLink, Map as MapIcon, Filter, Camera, Share2, Image as ImageIcon, Heart, Trash2, SortAsc, Download, Upload, Zap, RefreshCw, Plus, Globe } from 'lucide-react';
import { db, auth, isFirebaseConfigured } from './lib/firebase';
// FIX 2: 添加 updateDoc 导入
import { collection, onSnapshot, doc, setDoc, getDocs, updateDoc } from 'firebase/firestore';

// --- 1. 类型定义 (升级版) ---
interface Restaurant {
  id: number;
  name: string;
  location: string;
  suburb?: string;
  region: string;
  cuisine: string;
  priceTier: string;
  imageCategory: string;
  imageUrl?: string;
  sourceUrl?: string;

  // 用户数据
  visited: boolean;
  userRating: number;
  userPrice: string | number;
  userNotes: string;
  userDishes: string;
  userPhotos: string[];
  visitedDate: string | null;
  
  isCustom?: boolean; // 标记是否为手动添加
}

interface Stats {
  visited: number;
  total: number;
  percentage: number;
  totalSpent: number;
  averageRating: string;
  topCuisines: [string, number][];
}

// --- 2. 扩充数据源 (每次你想加新餐厅，就在这里加，会自动同步) ---
const BASE_DATA: Partial<Restaurant>[] = [
  // --- Sydney Icons ---
  { id: 1, name: "Bennelong", location: "Sydney Opera House", suburb: "Sydney", region: "Sydney CBD", cuisine: "Modern Australian", priceTier: "$$$$", imageCategory: "Modern Australian" },
  { id: 2, name: "Quay", location: "The Rocks", suburb: "The Rocks", region: "Sydney CBD", cuisine: "Modern Australian", priceTier: "$$$$", imageCategory: "Modern Australian" },
  { id: 3, name: "Firedoor", location: "Surry Hills", suburb: "Surry Hills", region: "Inner Sydney", cuisine: "Steakhouse", priceTier: "$$$$", imageCategory: "Steakhouse" },
  { id: 4, name: "Aria", location: "Circular Quay", suburb: "Sydney", region: "Sydney CBD", cuisine: "Fine Dining", priceTier: "$$$$", imageCategory: "Modern Australian" },
  { id: 5, name: "Mr. Wong", location: "Sydney CBD", suburb: "Sydney", region: "Sydney CBD", cuisine: "Cantonese", priceTier: "$$$", imageCategory: "Asian" },
  { id: 6, name: "Totti's", location: "Bondi", suburb: "Bondi", region: "Eastern Suburbs", cuisine: "Italian", priceTier: "$$$", imageCategory: "Italian" },
  { id: 48, name: "Oncore by Clare Smyth", location: "Barangaroo", suburb: "Barangaroo", region: "Sydney CBD", cuisine: "Fine Dining", priceTier: "$$$$", imageCategory: "French" },
  { id: 49, name: "Sixpenny", location: "Stanmore", suburb: "Stanmore", region: "Inner West", cuisine: "Modern Australian", priceTier: "$$$$", imageCategory: "Modern Australian" },
  { id: 50, name: "LuMi", location: "Pyrmont", suburb: "Pyrmont", region: "Sydney CBD", cuisine: "Italian/Japanese", priceTier: "$$$$", imageCategory: "Italian" },
  
  // --- Inner Sydney Cool ---
  { id: 15, name: "Annata", location: "Crows Nest", suburb: "Crows Nest", region: "North Shore", cuisine: "Contemporary", priceTier: "$$$", imageCategory: "Modern Australian" },
  { id: 24, name: "Chin Chin", location: "Surry Hills", suburb: "Surry Hills", region: "Inner Sydney", cuisine: "South East Asian", priceTier: "$$$", imageCategory: "Asian" },
  { id: 25, name: "Hubert", location: "Sydney CBD", suburb: "Sydney", region: "Sydney CBD", cuisine: "French", priceTier: "$$$", imageCategory: "French" },
  { id: 26, name: "Ester", location: "Chippendale", suburb: "Chippendale", region: "Inner Sydney", cuisine: "Contemporary", priceTier: "$$$", imageCategory: "Modern Australian" },
  { id: 27, name: "Poly", location: "Surry Hills", suburb: "Surry Hills", region: "Inner Sydney", cuisine: "Wine Bar", priceTier: "$$", imageCategory: "Wine" },
  { id: 29, name: "Saint Peter", location: "Paddington", suburb: "Paddington", region: "Eastern Suburbs", cuisine: "Seafood", priceTier: "$$$$", imageCategory: "Seafood" },
  { id: 30, name: "Cafe Paci", location: "Newtown", suburb: "Newtown", region: "Inner West", cuisine: "European", priceTier: "$$$", imageCategory: "French" },
  { id: 40, name: "Kiln", location: "Sydney CBD", suburb: "Sydney", region: "Sydney CBD", cuisine: "Contemporary", priceTier: "$$$", imageCategory: "Modern Australian" },
  { id: 41, name: "Ante", location: "Newtown", suburb: "Newtown", region: "Inner West", cuisine: "Japanese", priceTier: "$$", imageCategory: "Asian" },
  { id: 101, name: "Porcine", location: "Paddington", suburb: "Paddington", region: "Eastern Suburbs", cuisine: "French", priceTier: "$$$", imageCategory: "French" },
  { id: 102, name: "Ursula's", location: "Paddington", suburb: "Paddington", region: "Eastern Suburbs", cuisine: "Modern Australian", priceTier: "$$$", imageCategory: "Modern Australian" },
  
  // --- Regional NSW ---
  { id: 61, name: "Muse Restaurant", location: "Pokolbin", suburb: "Pokolbin", region: "Hunter Valley", cuisine: "Modern Australian", priceTier: "$$$$", imageCategory: "Modern Australian" },
  { id: 63, name: "Raes on Wategos", location: "Byron Bay", suburb: "Byron Bay", region: "North Coast", cuisine: "Mediterranean", priceTier: "$$$$", imageCategory: "Seafood" },
  { id: 64, name: "Three Blue Ducks", location: "Byron Bay", suburb: "Byron Bay", region: "North Coast", cuisine: "Farm-to-table", priceTier: "$$$", imageCategory: "Modern Australian" },
  { id: 67, name: "Rick Stein at Bannisters", location: "Mollymook", suburb: "Mollymook", region: "South Coast", cuisine: "Seafood", priceTier: "$$$$", imageCategory: "Seafood" },
  { id: 68, name: "Darley's", location: "Katoomba", suburb: "Katoomba", region: "Blue Mountains", cuisine: "Fine Dining", priceTier: "$$$$", imageCategory: "French" },
  
  // --- Casual & Cult Favourites ---
  { id: 19, name: "Mamak", location: "Haymarket", suburb: "Haymarket", region: "Sydney CBD", cuisine: "Malaysian", priceTier: "$", imageCategory: "Asian" },
  { id: 39, name: "Porkfat", location: "Haymarket", suburb: "Haymarket", region: "Sydney CBD", cuisine: "Thai", priceTier: "$$", imageCategory: "Asian" },
  { id: 57, name: "Bella Brutta", location: "Newtown", suburb: "Newtown", region: "Inner West", cuisine: "Pizza", priceTier: "$$", imageCategory: "Italian" },
  { id: 58, name: "Chat Thai", location: "Haymarket", suburb: "Haymarket", region: "Sydney CBD", cuisine: "Thai", priceTier: "$", imageCategory: "Asian" },
  { id: 71, name: "Sunday", location: "Potts Point", suburb: "Potts Point", region: "Inner Sydney", cuisine: "Comfort Food", priceTier: "$$", imageCategory: "Steakhouse" },
  { id: 72, name: "AP Bakery", location: "Surry Hills", suburb: "Surry Hills", region: "Inner Sydney", cuisine: "Bakery", priceTier: "$", imageCategory: "Default" },
  { id: 75, name: "Ho Jiak", location: "Haymarket", suburb: "Haymarket", region: "Sydney CBD", cuisine: "Malaysian", priceTier: "$$", imageCategory: "Asian" },
  { id: 76, name: "10 William St", location: "Paddington", suburb: "Paddington", region: "Eastern Suburbs", cuisine: "Italian/Wine Bar", priceTier: "$$", imageCategory: "Wine" },
  { id: 77, name: "Ragazzi", location: "Sydney CBD", suburb: "Sydney", region: "Sydney CBD", cuisine: "Italian", priceTier: "$$", imageCategory: "Italian" },
  { id: 78, name: "Lankan Filling Station", location: "Darlinghurst", suburb: "Darlinghurst", region: "Inner Sydney", cuisine: "Sri Lankan", priceTier: "$$", imageCategory: "Asian" },
];

// --- 3. 工具函数 ---
const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
      };
    };
    reader.onerror = error => reject(error);
  });
};

const getCuisineImage = (category: string, id: number) => {
  const images: Record<string, string[]> = {
    'Modern Australian': ['https://images.unsplash.com/photo-1544148103-0773bf10d330?w=600', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600'],
    'Italian': ['https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=600', 'https://images.unsplash.com/photo-1574868235945-060fadb398d4?w=600'],
    'Asian': ['https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600', 'https://images.unsplash.com/photo-1580651315530-69c8e0026377?w=600'],
    'Steakhouse': ['https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=600', 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600'],
    'French': ['https://images.unsplash.com/photo-1550966871-3ed3c6221741?w=600', 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600'],
    'Seafood': ['https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=600', 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600'],
    'Middle Eastern': ['https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600'],
    'Wine': ['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600'],
    'Default': ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600']
  };
  const categoryImages = images[category] || images['Default'];
  return categoryImages[id % categoryImages.length];
}

const getRestaurantCoverImage = (r: Restaurant): string => {
  if (r.userPhotos && r.userPhotos.length > 0) return r.userPhotos[0];
  if (r.imageUrl) return r.imageUrl; 
  return getCuisineImage(r.imageCategory, r.id);
};

// --- 子组件 ---
const StarRating = ({ rating, setRating, readonly = false, size = 'md' }: { rating: number, setRating: (r: number) => void, readonly?: boolean, size?: 'sm'|'md'|'lg' }) => {
  const starSize = size === 'sm' ? 14 : size === 'lg' ? 32 : 24;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => { e.stopPropagation(); !readonly && setRating(star); }}
          disabled={readonly}
          type="button"
          className={`focus:outline-none transition-all ${!readonly ? 'hover:scale-110 active:scale-95' : 'cursor-default'}`}
        >
          <Star
            size={starSize}
            className={`${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'}`}
          />
        </button>
      ))}
    </div>
  );
};

// --- 新增：手动添加餐厅 Modal ---
const AddRestaurantModal = ({ onClose, onAdd }: { onClose: () => void, onAdd: (r: Partial<Restaurant>) => void }) => {
    const [formData, setFormData] = useState({ name: '', location: '', cuisine: 'Modern Australian', priceTier: '$$' });
    
    const handleSubmit = () => {
        if(!formData.name) return alert("请输入餐厅名称");
        onAdd({
            ...formData,
            region: 'Custom Added', // 默认区域
            imageCategory: formData.cuisine,
            id: Date.now(), // 生成唯一ID
            visited: false,
            isCustom: true
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus size={24} className="text-amber-500"/> 添加新餐厅</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">餐厅名称</label>
                        <input type="text" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-400 outline-none" placeholder="例如: Sunday Kitchen" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">地点 / 区域</label>
                        <input type="text" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-400 outline-none" placeholder="例如: Potts Point" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase mb-1">菜系</label>
                             <select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" value={formData.cuisine} onChange={e => setFormData({...formData, cuisine: e.target.value})}>
                                 <option value="Modern Australian">澳洲现代菜</option>
                                 <option value="Asian">亚洲菜 (中/泰/日)</option>
                                 <option value="Italian">意大利菜</option>
                                 <option value="French">法餐</option>
                                 <option value="Seafood">海鲜</option>
                                 <option value="Steakhouse">牛排/烧烤</option>
                             </select>
                        </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase mb-1">价格等级</label>
                             <select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" value={formData.priceTier} onChange={e => setFormData({...formData, priceTier: e.target.value})}>
                                 <option value="$">$ (便宜)</option>
                                 <option value="$$">$$ (适中)</option>
                                 <option value="$$$">$$$ (小贵)</option>
                                 <option value="$$$$">$$$$ (奢华)</option>
                             </select>
                        </div>
                    </div>
                    <button onClick={handleSubmit} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold mt-4 hover:bg-slate-800 transition-colors">确认添加</button>
                    <button onClick={onClose} className="w-full py-3 text-slate-400 font-medium text-sm hover:text-slate-600">取消</button>
                </div>
            </div>
        </div>
    )
}


// --- Modal 组件 (增加了 小红书 和 TripAdvisor) ---
const RestaurantModal = ({ 
  r, 
  onClose, 
  onUpdate 
}: { 
  r: Restaurant, 
  onClose: () => void, 
  onUpdate: (id: number, data: Partial<Restaurant>) => void 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(r.userNotes || '');
  const [dishes, setDishes] = useState(r.userDishes || '');
  const [price, setPrice] = useState<string | number>(r.userPrice || '');
  const [rating, setRating] = useState(r.userRating || 0);
  const [photos, setPhotos] = useState<string[]>(r.userPhotos || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.location + ' NSW')}`;
  // 新增：小红书搜索链接
  const xhsUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent('悉尼 ' + r.name)}`;
  // 新增：TripAdvisor 搜索链接
  const tripAdvisorUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(r.name + ' ' + r.location)}&geo=1&ssrc=e`;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        if (photos.length >= 3) {
          alert("为了保证运行流畅，每家餐厅最多上传3张照片哦！");
          return;
        }
        const base64 = await convertImageToBase64(e.target.files[0]);
        setPhotos([...photos, base64]);
      } catch (error) {
        console.error("Upload failed", error);
        alert("图片上传失败，请重试");
      }
    }
  };

  const handleSave = () => {
    onUpdate(r.id, { 
      userRating: rating, 
      userPrice: price, 
      userNotes: notes, 
      userDishes: dishes,
      userPhotos: photos 
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-slate-50 w-full sm:max-w-2xl h-[90vh] sm:h-[85vh] sm:rounded-2xl sm:shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-md transition-colors"><X size={20} /></button>

        <div className="flex-1 overflow-y-auto">
          <div className="h-56 sm:h-64 relative">
            <img 
              src={photos.length > 0 ? photos[0] : getRestaurantCoverImage(r)} 
              alt={r.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-2">
                <span className="bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">{r.region}</span>
                <span>{r.cuisine}</span>
                <span>{r.priceTier}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold leading-none mb-2 shadow-black drop-shadow-md">{r.name}</h2>
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white/90 hover:text-white hover:underline text-sm">
                <MapPin size={14} /> {r.location} <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div className="p-6 space-y-6">
             {/* Action Buttons */}
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="bg-white border border-slate-200 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50">
                  <MapIcon size={18} className="text-blue-500"/> 导航
                </a>
                <button onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(r.name + ' menu')}`, '_blank')} className="bg-white border border-slate-200 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50">
                  <Utensils size={18} className="text-amber-600"/> 菜单
                </button>
                {/* 小红书按钮 */}
                <a href={xhsUrl} target="_blank" rel="noopener noreferrer" className="bg-red-50 border border-red-100 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-bold text-red-600 shadow-sm hover:bg-red-100">
                  <Heart size={18} className="fill-red-600"/> 小红书搜菜
                </a>
                {/* TripAdvisor 按钮 */}
                <a href={tripAdvisorUrl} target="_blank" rel="noopener noreferrer" className="bg-green-50 border border-green-100 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-bold text-green-700 shadow-sm hover:bg-green-100">
                  <Globe size={18} className="text-green-600"/> 查评分
                </a>
             </div>

             {!r.visited && !isEditing ? (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><Camera className="text-slate-400" size={28} /></div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">记录你的美食时刻</h3>
                  <p className="text-slate-500 mb-6">这家店怎么样？好吃吗？快来打卡吧！</p>
                  <button onClick={() => setIsEditing(true)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"><CheckCircle size={20} /> 标记为已打卡</button>
                </div>
             ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-sm font-bold text-slate-400 uppercase">综合评分</label>
                      <div className="text-2xl font-bold text-amber-500">{rating}/5</div>
                    </div>
                    <div className="flex justify-center py-2 bg-slate-50 rounded-xl">
                      <StarRating rating={rating} setRating={setRating} readonly={!isEditing} size="lg" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                     <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3"><Heart size={16} className="text-red-400 fill-red-400" /> 必吃推荐</label>
                        {isEditing ? <input type="text" value={dishes} onChange={(e) => setDishes(e.target.value)} placeholder="例如：松露意面..." className="w-full p-3 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-amber-400" /> : <div className="text-slate-600 italic">{dishes || "暂无推荐菜"}</div>}
                     </div>
                     <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3"><DollarSign size={16} className="text-green-600" /> 人均消费</label>
                         {isEditing ? <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="w-full p-3 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-amber-400" /> : <div className="text-slate-900 font-bold text-lg">${price || "0"}</div>}
                     </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                      <label className="text-sm font-bold text-slate-400 uppercase mb-3 block">用餐笔记</label>
                      {isEditing ? <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="写点什么..." className="w-full p-3 bg-slate-50 rounded-xl border-0 h-32 focus:ring-2 focus:ring-amber-400 resize-none" /> : <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{notes || "暂无笔记"}</p>}
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                     <div className="flex justify-between items-center mb-4">
                        <label className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2"><ImageIcon size={16} /> 美食相册</label>
                        {isEditing && <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-full font-bold hover:bg-slate-700">+ 上传照片</button>}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                     </div>
                     {photos.length > 0 ? (
                       <div className="grid grid-cols-3 gap-2">
                         {photos.map((p, idx) => (
                           <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                             <img src={p} className="w-full h-full object-cover" />
                             {isEditing && <button onClick={() => setPhotos(photos.filter((_, i) => i !== idx))} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"><Trash2 size={20} /></button>}
                           </div>
                         ))}
                       </div>
                     ) : <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300"><p className="text-slate-400 text-sm">还没有上传照片</p></div>}
                  </div>

                  <div className="pt-4 pb-8">
                    {isEditing ? <button onClick={handleSave} className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-all active:scale-[0.98]">保存所有修改</button> : <button onClick={() => setIsEditing(true)} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">编辑记录</button>}
                  </div>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 主应用 ---
export default function NSWFoodTracker() {
  // 初始化逻辑：优先使用 Firebase，否则使用 LocalStorage
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // --- 智能同步逻辑 (Smart Sync) ---
  const checkForNewCodeData = async (existingData: Restaurant[]) => {
     if (!db || !isFirebaseConfigured) return;
     
     const existingIds = new Set(existingData.map(r => r.id));
     const missingRestaurants = BASE_DATA.filter(r => r.id && !existingIds.has(r.id));

     if (missingRestaurants.length > 0) {
         console.log(`Found ${missingRestaurants.length} new restaurants in code. Syncing to Cloud...`);
         const batchPromises = missingRestaurants.map(r => {
             const completeData = {
                ...r,
                visited: false, userRating: 0, userPrice: '', userNotes: '', userDishes: '', userPhotos: [], visitedDate: null
             };
             // 写入云端
             return setDoc(doc(db, "restaurants", String(r.id)), completeData);
         });
         await Promise.all(batchPromises);
         console.log("Sync Complete!");
     }
  };

  // 监听数据源
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      // Cloud Mode: 监听 Firestore
      const unsubscribe = onSnapshot(collection(db, "restaurants"), (snapshot) => {
        if (snapshot.empty) {
          // 如果数据库是空的，把本地的基础数据灌进去
          initFirebaseData();
        } else {
          const cloudData = snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) } as Restaurant));
          setRestaurants(cloudData);
          setLoading(false);
          
          // 每次数据加载完，顺便检查一下有没有代码里新加的餐厅需要补进去
          checkForNewCodeData(cloudData);
        }
      });
      return () => unsubscribe();
    } else {
      // Local Mode: 使用 LocalStorage
      const saved = localStorage.getItem('nsw_food_list_v5');
      let data: Restaurant[] = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(parsed.map((r: Restaurant) => r.id));
        const newItems = BASE_DATA.filter(r => !existingIds.has(r!.id!)).map(r => ({
          ...r, visited: false, userRating: 0, userPrice: '', userNotes: '', userDishes: '', userPhotos: [], visitedDate: null
        } as Restaurant));
        data = [...parsed, ...newItems];
      } else {
        data = BASE_DATA.map(r => ({
          ...r, visited: false, userRating: 0, userPrice: '', userNotes: '', userDishes: '', userPhotos: [], visitedDate: null
        } as Restaurant));
      }
      setRestaurants(data);
      setLoading(false);
    }
  }, []);

  // LocalStorage 同步 (仅在非 Firebase 模式下)
  useEffect(() => {
    if (!isFirebaseConfigured) {
      localStorage.setItem('nsw_food_list_v5', JSON.stringify(restaurants));
    }
  }, [restaurants]);

  const initFirebaseData = async () => {
    console.log("Initializing Firebase Data...");
    if (!db) return;
    const batchPromises = BASE_DATA.map(r => {
      const completeData = {
        ...r,
        visited: false, userRating: 0, userPrice: '', userNotes: '', userDishes: '', userPhotos: [], visitedDate: null
      };
      return setDoc(doc(db, "restaurants", String(r.id)), completeData);
    });
    await Promise.all(batchPromises);
    console.log("Firebase Data Initialized!");
  };

  // UI State
  const [view, setView] = useState<'list' | 'stats'>('list');
  const [filter, setFilter] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [sortBy, setSortBy] = useState<'default' | 'rating' | 'price'>('default');
  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant | null>(null);
  const [showVisitedOnly, setShowVisitedOnly] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  // 统计数据
  const stats = useMemo<Stats>(() => {
    const visited = restaurants.filter(r => r.visited);
    const total = restaurants.length;
    const percentage = total > 0 ? Math.round((visited.length / total) * 100) : 0;
    const totalSpent = visited.reduce((acc, curr) => acc + (Number(curr.userPrice) || 0), 0);
    const avgRating = visited.length > 0 ? (visited.reduce((acc, curr) => acc + curr.userRating, 0) / visited.length).toFixed(1) : "0.0";
    const cuisineCounts = visited.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.cuisine] = (acc[curr.cuisine] || 0) + 1;
      return acc;
    }, {});
    const topCuisines = Object.entries(cuisineCounts).sort(([,a], [,b]) => b - a).slice(0, 3);
    return { visited: visited.length, total, percentage, totalSpent, topCuisines, averageRating: avgRating };
  }, [restaurants]);

  // 区域统计
  const regionStats = useMemo(() => {
    // FIX 1: 现在 Map 引用的是 JS 全局 Map 对象，不再是图标组件
    const map = new Map<string, { total: number; visited: number }>();
    restaurants.forEach((r) => {
      const key = r.region || 'Other';
      if (!map.has(key)) map.set(key, { total: 0, visited: 0 });
      const rec = map.get(key)!;
      rec.total += 1;
      if (r.visited) rec.visited += 1;
    });
    return Array.from(map.entries()).map(([region, { total, visited }]) => ({
      region, total, visited, percentage: total > 0 ? Math.round((visited / total) * 100) : 0,
    })).sort((a, b) => a.region.localeCompare(b.region));
  }, [restaurants]);

  const regions = ['All', ...new Set(restaurants.map(r => r.region))].sort();
  const cuisines = ['All', ...new Set(restaurants.map(r => r.cuisine))].sort();
  
  const filteredList = useMemo(() => {
    let res = restaurants.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(filter.toLowerCase()) || r.location.toLowerCase().includes(filter.toLowerCase());
      const matchesRegion = selectedRegion === 'All' || r.region === selectedRegion;
      const matchesCuisine = selectedCuisine === 'All' || r.cuisine === selectedCuisine;
      const matchesVisited = showVisitedOnly ? r.visited : true;
      return matchesSearch && matchesRegion && matchesCuisine && matchesVisited;
    });
    if (sortBy === 'rating') res.sort((a, b) => b.userRating - a.userRating);
    else if (sortBy === 'price') res.sort((a, b) => (Number(b.userPrice) || 0) - (Number(a.userPrice) || 0));
    return res;
  }, [restaurants, filter, selectedRegion, selectedCuisine, showVisitedOnly, sortBy]);

  const handleUpdateRestaurant = async (id: number, data: Partial<Restaurant>) => {
    const newData = { ...data, visited: true, visitedDate: new Date().toISOString().split('T')[0] };
    
    if (isFirebaseConfigured && db) {
      // Cloud Save
      const rRef = doc(db, "restaurants", String(id));
      await updateDoc(rRef, newData);
    } else {
      // Local Save
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, ...newData } : r));
    }
    
    setActiveRestaurant(prev => prev && prev.id === id ? { ...prev, ...newData, visited: true } : prev);
  };
  
  // 新增：处理手动添加餐厅
  const handleAddCustomRestaurant = async (newR: Partial<Restaurant>) => {
      const completeR = {
          ...newR,
          userRating: 0, userPrice: '', userNotes: '', userDishes: '', userPhotos: [], visitedDate: null
      } as Restaurant;
      
      if (isFirebaseConfigured && db) {
          await setDoc(doc(db, "restaurants", String(completeR.id)), completeR);
      } else {
          setRestaurants([...restaurants, completeR]);
      }
  }

  const handleSurpriseMe = () => {
    const pool = filteredList.filter(r => !r.visited);
    if (pool.length === 0) { alert("太棒了！当前筛选下所有餐厅你都吃过了！"); return; }
    const random = pool[Math.floor(Math.random() * pool.length)];
    setActiveRestaurant(random);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(restaurants, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nsw-food-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(String(e.target?.result || ''));
        if (Array.isArray(parsed)) {
            if (isFirebaseConfigured && db) {
                alert("云端模式下暂不支持批量导入，请在本地模式整理好数据后由管理员上传。");
            } else {
                setRestaurants(parsed);
                alert(`成功导入 ${parsed.length} 条数据！`);
            }
        }
      } catch (err) { alert("文件格式错误"); }
    };
    reader.readAsText(file);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><div className="animate-spin"><RefreshCw size={32} className="text-amber-500"/></div></div>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-amber-200 pb-24">
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('list')}>
              <div className="bg-amber-400 text-slate-900 p-1.5 rounded-lg"><Utensils size={20} strokeWidth={2.5} /></div>
              <div>
                <h1 className="text-lg font-bold leading-none tracking-tight text-amber-50">NSW 美食摘星</h1>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-amber-400/80 font-bold tracking-wider uppercase">The Ultimate List</p>
                    {isFirebaseConfigured ? <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-px rounded border border-green-500/30 flex items-center gap-1"><Zap size={8}/> Cloud Sync</span> : <span className="text-[8px] bg-slate-700 text-slate-400 px-1.5 py-px rounded">Local Mode</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
               {view === 'stats' && <div className="flex gap-2"><button onClick={handleExport} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-slate-300"><Download size={18} /></button><button onClick={() => importInputRef.current?.click()} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-slate-300"><Upload size={18} /></button><input type="file" ref={importInputRef} className="hidden" onChange={handleImport} /></div>}
               <div className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors rounded-full pl-4 pr-2 py-1.5 cursor-pointer border border-white/5" onClick={() => setView('stats')}>
                <div className="text-xs font-medium text-slate-300">已摘星</div>
                <div className="bg-amber-500 px-2.5 py-0.5 rounded-full text-sm font-bold text-white shadow-sm">{stats.visited}</div>
              </div>
            </div>
        </div>
        <div className="h-1 bg-slate-800 w-full relative overflow-hidden"><div className="h-full bg-amber-400 absolute left-0 top-0 transition-all duration-1000 ease-out" style={{ width: `${stats.percentage}%` }} /></div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {view === 'list' ? (
          <>
            <div className="sticky top-[68px] z-30 bg-slate-100/95 backdrop-blur-sm pb-4 space-y-3 pt-2">
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
                  <input type="text" placeholder="搜餐厅、菜系..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all" value={filter} onChange={(e) => setFilter(e.target.value)} />
                </div>
                {/* 添加餐厅按钮 */}
                <button onClick={() => setShowAddModal(true)} className="px-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all border shadow-sm bg-slate-900 text-white border-slate-900 hover:bg-slate-800"><Plus size={18} /><span className="hidden sm:inline">添加餐厅</span></button>
                
                <button onClick={handleSurpriseMe} className="px-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all border shadow-sm bg-white text-slate-600 border-slate-200 hover:bg-slate-50">🎲</button>
                <button onClick={() => setSortBy(prev => prev === 'default' ? 'rating' : prev === 'rating' ? 'price' : 'default')} className={`px-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all border shadow-sm ${sortBy !== 'default' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}><SortAsc size={18} /></button>
                <button onClick={() => setShowVisitedOnly(!showVisitedOnly)} className={`px-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all border shadow-sm ${showVisitedOnly ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200'}`}><CheckCircle size={18} /></button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                 {/* 菜系过滤器 */}
                {cuisines.map(c => (
                  <button key={c} onClick={() => setSelectedCuisine(c)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedCuisine === c ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>{c}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredList.length === 0 ? (
                <div className="col-span-full text-center py-20"><div className="bg-white p-6 rounded-full shadow-sm inline-block mb-4"><Search size={48} className="text-slate-200" /></div><p className="text-slate-400 font-medium">没有找到餐厅</p></div>
              ) : (
                filteredList.map(r => (
                  <div key={r.id} onClick={() => setActiveRestaurant(r)} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-slate-200 flex flex-col relative">
                    <div className="h-48 overflow-hidden relative bg-slate-100">
                      <img src={getRestaurantCoverImage(r)} alt={r.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                      <div className="absolute top-3 left-3 flex gap-2"><div className="bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/10">{r.region}</div></div>
                      <div className="absolute top-3 right-3">{r.visited && <div className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1"><CheckCircle size={12} className="fill-white text-amber-500" /> 已打卡</div>}</div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="font-serif font-bold text-xl leading-tight mb-1 text-shadow-sm truncate">{r.name}</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium"><span>{r.cuisine}</span><span className="w-1 h-1 rounded-full bg-slate-400"/><span>{r.priceTier}</span></div>
                          {r.userRating > 0 && <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full"><Star size={12} className="fill-amber-400 text-amber-400" /><span className="text-xs font-bold text-amber-400">{r.userRating}</span></div>}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-white flex flex-col gap-2 border-t border-slate-100">
                       <div className="flex items-center gap-1.5 text-slate-500 text-xs"><MapPin size={12} className="shrink-0 text-slate-400" /><span className="truncate">{r.location}</span></div>
                       {r.userDishes && <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-1.5 rounded-md truncate"><Heart size={10} className="text-red-400 fill-red-400 shrink-0" /><span className="truncate">推荐: {r.userDishes}</span></div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300 pt-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
                  <div className="absolute -right-6 -top-6 bg-amber-100 w-24 h-24 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                  <div className="text-slate-400 mb-2"><CheckCircle size={24} /></div>
                  <div className="text-3xl font-black text-slate-900">{stats.visited}</div>
                  <div className="text-sm font-bold text-slate-500">已探索餐厅</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
                  <div className="absolute -right-6 -top-6 bg-emerald-100 w-24 h-24 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                  <div className="text-slate-400 mb-2"><DollarSign size={24} /></div>
                  <div className="text-3xl font-black text-slate-900">${stats.totalSpent}</div>
                  <div className="text-sm font-bold text-slate-500">美食总投入</div>
                </div>
             </div>

             {/* 区域统计进度 */}
             <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg">
                    {/* FIX 3: 使用重命名后的 MapIcon */}
                    <MapIcon size={20} className="text-emerald-500" /> 按区域打卡进度
                </h3>
                <div className="space-y-4">
                    {regionStats.map(r => (
                        <div key={r.region} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-slate-600"><span>{r.region}</span><span>{r.visited}/{r.total} ({r.percentage}%)</span></div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 rounded-full" style={{ width: `${r.percentage}%` }} /></div>
                        </div>
                    ))}
                </div>
             </div>

             <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
               <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg"><Award className="text-amber-500" size={20}/> 最爱菜系 Top 3</h3>
               {stats.topCuisines.length > 0 ? (
                 <div className="space-y-6">
                   {stats.topCuisines.map(([cuisine, count], idx) => (
                     <div key={cuisine} className="flex items-center gap-4">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400'}`}>{idx + 1}</div>
                       <div className="flex-1"><div className="flex justify-between text-sm mb-2"><span className="font-bold text-slate-800">{cuisine}</span><span className="text-slate-400 font-medium">{count} 家</span></div><div className="h-2.5 bg-slate-50 rounded-full overflow-hidden"><div className={`h-full rounded-full ${idx === 0 ? 'bg-amber-400' : 'bg-slate-300'}`} style={{ width: `${(count / stats.visited) * 100}%` }} /></div></div>
                     </div>
                   ))}
                 </div>
               ) : <div className="text-center py-8 text-slate-400"><p>还没开始打卡？快去吃第一顿吧！</p></div>}
             </div>
          </div>
        )}
      </main>
      {activeRestaurant && <RestaurantModal r={activeRestaurant} onClose={() => setActiveRestaurant(null)} onUpdate={handleUpdateRestaurant} />}
      {showAddModal && <AddRestaurantModal onClose={() => setShowAddModal(false)} onAdd={handleAddCustomRestaurant} />}
    </div>
  );
}