import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, CheckCircle, Utensils, DollarSign, Star, X, ChevronRight, Award } from 'lucide-react';

// --- 类型定义 ---
interface Restaurant {
  id: number;
  name: string;
  location: string;
  cuisine: string;
  priceTier: string;
  visited?: boolean;
  userRating?: number;
  userPrice?: string | number;
  userNotes?: string;
  visitedDate?: string | null;
}

interface Stats {
  visited: number;
  total: number;
  percentage: number;
  totalSpent: number;
  topCuisines: [string, number][];
}

interface StarRatingProps {
  rating: number;
  setRating: (rating: number) => void;
  readonly?: boolean;
}

// --- 预置数据：基于 Good Food Gift Card NSW 搜索结果 ---
const INITIAL_RESTAURANTS: Restaurant[] = [
  { id: 1, name: "Bennelong", location: "Sydney Opera House", cuisine: "Modern Australian", priceTier: "$$$$" },
  { id: 2, name: "Quay", location: "The Rocks", cuisine: "Modern Australian", priceTier: "$$$$" },
  { id: 3, name: "Firedoor", location: "Surry Hills", cuisine: "Steak/Grill", priceTier: "$$$$" },
  { id: 4, name: "Aria", location: "Circular Quay", cuisine: "Fine Dining", priceTier: "$$$$" },
  { id: 5, name: "Mr. Wong", location: "Sydney CBD", cuisine: "Cantonese", priceTier: "$$$" },
  { id: 6, name: "Totti's", location: "Bondi", cuisine: "Italian", priceTier: "$$$" },
  { id: 7, name: "10 William St", location: "Paddington", cuisine: "Italian/Wine Bar", priceTier: "$$" },
  { id: 8, name: "6 Head", location: "The Rocks", cuisine: "Steakhouse", priceTier: "$$$$" },
  { id: 9, name: "AALIA", location: "Sydney CBD", cuisine: "Middle Eastern", priceTier: "$$$" },
  { id: 10, name: "Abhi's", location: "North Strathfield", cuisine: "Indian", priceTier: "$$" },
  { id: 11, name: "Alfie's", location: "Sydney CBD", cuisine: "Steak", priceTier: "$$$" },
  { id: 12, name: "Alpha", location: "Sydney CBD", cuisine: "Greek", priceTier: "$$$" },
  { id: 13, name: "Alphabet Street", location: "Cronulla", cuisine: "Thai", priceTier: "$$" },
  { id: 14, name: "Ho Jiak", location: "Haymarket", cuisine: "Malaysian", priceTier: "$$" },
  { id: 15, name: "Annata", location: "Crows Nest", cuisine: "Contemporary", priceTier: "$$$" },
  { id: 16, name: "Bistro Moncur", location: "Woollahra", cuisine: "French", priceTier: "$$$" },
  { id: 17, name: "Bopp and Tone", location: "Sydney CBD", cuisine: "Australian", priceTier: "$$$" },
  { id: 18, name: "Cho Cho San", location: "Potts Point", cuisine: "Japanese", priceTier: "$$$" },
  { id: 19, name: "Mamak", location: "Haymarket", cuisine: "Malaysian", priceTier: "$" },
  { id: 20, name: "Ormeggio at The Spit", location: "Mosman", cuisine: "Italian/Seafood", priceTier: "$$$$" },
  { id: 21, name: "Rockpool Bar & Grill", location: "Sydney CBD", cuisine: "Steakhouse", priceTier: "$$$$" },
  { id: 22, name: "Spice Temple", location: "Sydney CBD", cuisine: "Chinese", priceTier: "$$$" },
  { id: 23, name: "The Meat & Wine Co", location: "Barangaroo", cuisine: "Steakhouse", priceTier: "$$$" },
  { id: 24, name: "Chin Chin", location: "Surry Hills", cuisine: "South East Asian", priceTier: "$$$" },
  { id: 25, name: "Hubert", location: "Sydney CBD", cuisine: "French", priceTier: "$$$" },
  { id: 26, name: "Ester", location: "Chippendale", cuisine: "Contemporary", priceTier: "$$$" },
  { id: 27, name: "Poly", location: "Surry Hills", cuisine: "Wine Bar", priceTier: "$$" },
  { id: 28, name: "Lankan Filling Station", location: "Darlinghurst", cuisine: "Sri Lankan", priceTier: "$$" },
  { id: 29, name: "Saint Peter", location: "Paddington", cuisine: "Seafood", priceTier: "$$$$" },
  { id: 30, name: "Cafe Paci", location: "Newtown", cuisine: "European", priceTier: "$$$" },
  { id: 31, name: "Icebergs Dining Room", location: "Bondi Beach", cuisine: "Italian", priceTier: "$$$$" },
  { id: 32, name: "Pilu at Freshwater", location: "Freshwater", cuisine: "Italian", priceTier: "$$$$" },
  { id: 33, name: "Catalina", location: "Rose Bay", cuisine: "Seafood", priceTier: "$$$$" },
  { id: 34, name: "Margaret", location: "Double Bay", cuisine: "Modern Australian", priceTier: "$$$$" },
  { id: 35, name: "Mimi's", location: "Coogee", cuisine: "Mediterranean", priceTier: "$$$$" },
  { id: 36, name: "Nomad", location: "Surry Hills", cuisine: "Middle Eastern", priceTier: "$$$" },
  { id: 37, name: "Ragazzi", location: "Sydney CBD", cuisine: "Italian", priceTier: "$$" },
  { id: 38, name: "Alberto's Lounge", location: "Sydney CBD", cuisine: "Italian", priceTier: "$$$" },
  { id: 39, name: "Porkfat", location: "Haymarket", cuisine: "Thai", priceTier: "$$" },
  { id: 40, name: "Kiln", location: "Sydney CBD", cuisine: "Contemporary", priceTier: "$$$" }
];

// --- 组件：星星评分 ---
const StarRating: React.FC<StarRatingProps> = ({ rating, setRating, readonly = false }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !readonly && setRating(star)}
          disabled={readonly}
          type="button"
          className={`focus:outline-none transition-transform ${!readonly && 'active:scale-125 hover:scale-110'}`}
        >
          <Star
            size={readonly ? 16 : 28}
            className={`${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// --- 主应用 ---
export default function NSWFoodTracker() {
  // 状态管理
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    const saved = localStorage.getItem('nsw_food_list');
    return saved ? JSON.parse(saved) : INITIAL_RESTAURANTS.map(r => ({
      ...r,
      visited: false,
      userRating: 0,
      userPrice: '',
      userNotes: '',
      visitedDate: null
    }));
  });
  
  const [view, setView] = useState<'list' | 'stats'>('list');
  const [filter, setFilter] = useState<string>('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // 持久化存储
  useEffect(() => {
    localStorage.setItem('nsw_food_list', JSON.stringify(restaurants));
  }, [restaurants]);

  // 统计数据
  const stats = useMemo<Stats>(() => {
    const visited = restaurants.filter(r => r.visited);
    const total = restaurants.length;
    const percentage = total > 0 ? Math.round((visited.length / total) * 100) : 0;
    const totalSpent = visited.reduce((acc, curr) => acc + (Number(curr.userPrice) || 0), 0);
    
    const cuisineCounts = visited.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.cuisine] = (acc[curr.cuisine] || 0) + 1;
      return acc;
    }, {});
    
    // sort cuisines by popularity
    const topCuisines = Object.entries(cuisineCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return { visited: visited.length, total, percentage, totalSpent, topCuisines };
  }, [restaurants]);

  // 过滤逻辑
  const cuisines = ['All', ...new Set(restaurants.map(r => r.cuisine))];
  
  const filteredList = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(filter.toLowerCase()) || 
                          r.location.toLowerCase().includes(filter.toLowerCase());
    const matchesCuisine = selectedCuisine === 'All' || r.cuisine === selectedCuisine;
    return matchesSearch && matchesCuisine;
  });

  // 处理打卡/更新
  const handleUpdateRestaurant = (id: number, data: Partial<Restaurant>) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, ...data, visited: true, visitedDate: r.visitedDate || new Date().toISOString().split('T')[0] };
      }
      return r;
    }));
    setActiveRestaurant(null);
    setIsEditing(false);
  };

  // 模态框组件
  const RestaurantModal = () => {
    if (!activeRestaurant) return null;
    const r = activeRestaurant;
    
    // Form state (inner component hooks need to be at top level of component)
    // We are rendering this conditionally, which is generally okay if the condition is stable,
    // but ideally Modal should be a separate component or always rendered but hidden.
    // For this simple file, we will invoke hooks inside this sub-function component.
    
    const [notes, setNotes] = useState<string>(r.userNotes || '');
    const [price, setPrice] = useState<string | number>(r.userPrice || '');
    const [rating, setRating] = useState<number>(r.userRating || 0);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Modal Header */}
          <div className="bg-slate-900 p-6 text-white relative">
            <button 
              onClick={() => setActiveRestaurant(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-1 rounded-full"
              type="button"
            >
              <X size={20} />
            </button>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">{r.cuisine}</div>
            <h2 className="text-3xl font-serif font-bold leading-tight mb-2">{r.name}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin size={14} />
              {r.location}
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto">
            {!r.visited && !isEditing ? (
              <div className="text-center py-8">
                <div className="bg-slate-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Utensils className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">还没吃过这家店？</h3>
                <p className="text-slate-500 mb-6">准备好去品尝了吗？点击下方按钮开始记录你的体验。</p>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                  type="button"
                >
                  <CheckCircle size={18} />
                  打卡这家店
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">味道评分</label>
                  <div className="flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <StarRating rating={rating} setRating={setRating} readonly={!isEditing && !!r.visited} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">人均消费 ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input 
                      type="number" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      readOnly={!isEditing && !!r.visited}
                      placeholder="例如: 80"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">美食笔记</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    readOnly={!isEditing && !!r.visited}
                    placeholder="必点菜是什么？环境怎么样？"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  />
                </div>

                {(isEditing || !r.visited) && (
                  <button 
                    onClick={() => handleUpdateRestaurant(r.id, { userRating: rating, userPrice: price, userNotes: notes })}
                    className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-all"
                    type="button"
                  >
                    保存记录
                  </button>
                )}
                
                {!isEditing && r.visited && (
                   <button 
                   onClick={() => setIsEditing(true)}
                   className="w-full py-2 text-slate-500 text-sm hover:text-slate-800 underline decoration-dotted"
                   type="button"
                 >
                   修改记录
                 </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-900">NSW 美食摘星</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">THE GOOD FOOD CHALLENGE</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-500">{stats.visited}<span className="text-slate-300 text-lg">/</span><span className="text-slate-400 text-lg">{stats.total}</span></div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 ease-out"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-200 p-1 rounded-xl">
          <button 
            onClick={() => setView('list')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${view === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            type="button"
          >
            餐厅清单
          </button>
          <button 
            onClick={() => setView('stats')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${view === 'stats' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            type="button"
          >
            我的战绩
          </button>
        </div>

        {view === 'list' ? (
          <>
            {/* Search & Filter */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="搜索餐厅名称或地点..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {cuisines.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCuisine(c)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedCuisine === c 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                    type="button"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Restaurant List */}
            <div className="space-y-3">
              {filteredList.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Utensils size={48} className="mx-auto mb-3 opacity-20" />
                  <p>没有找到相关餐厅</p>
                </div>
              ) : (
                filteredList.map(r => (
                  <div 
                    key={r.id}
                    onClick={() => setActiveRestaurant(r)}
                    className={`bg-white p-4 rounded-xl border transition-all cursor-pointer active:scale-[0.98] flex items-center justify-between ${
                      r.visited ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold truncate ${r.visited ? 'text-slate-800' : 'text-slate-900'}`}>
                          {r.name}
                        </h3>
                        {r.visited && <CheckCircle size={14} className="text-amber-500 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center text-xs text-slate-500 gap-3">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {r.location}</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">{r.cuisine}</span>
                        <span>{r.priceTier}</span>
                      </div>
                    </div>
                    
                    <div className="pl-4 flex flex-col items-end gap-1">
                      {r.visited ? (
                         (r.userRating || 0) > 0 ? (
                           <div className="flex text-amber-400">
                             {[...Array(r.userRating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                           </div>
                         ) : <span className="text-xs text-amber-600 font-medium">已打卡</span>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                           <ChevronRight size={18} />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Stats View */
          <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
             {/* Summary Cards */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-slate-400 mb-2"><CheckCircle size={20} /></div>
                  <div className="text-2xl font-bold text-slate-900">{stats.visited}</div>
                  <div className="text-xs text-slate-500">已探索餐厅</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-slate-400 mb-2"><DollarSign size={20} /></div>
                  <div className="text-2xl font-bold text-slate-900">${stats.totalSpent}</div>
                  <div className="text-xs text-slate-500">总美食投入</div>
                </div>
             </div>

             {/* Top Cuisines */}
             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
               <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <Award className="text-amber-500" size={18}/>
                 最爱菜系
               </h3>
               {stats.topCuisines.length > 0 ? (
                 <div className="space-y-4">
                   {stats.topCuisines.map(([cuisine, count], idx) => (
                     <div key={cuisine} className="flex items-center gap-3">
                       <div className="w-6 text-center font-bold text-slate-300 text-sm">#{idx + 1}</div>
                       <div className="flex-1">
                         <div className="flex justify-between text-sm mb-1">
                           <span className="font-medium text-slate-700">{cuisine}</span>
                           <span className="text-slate-400">{count} 家</span>
                         </div>
                         <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-slate-800 rounded-full"
                             style={{ width: `${(count / stats.visited) * 100}%` }}
                           />
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="text-sm text-slate-400 italic text-center py-4">快去打卡你的第一家餐厅吧！</p>
               )}
             </div>

             {/* Badge Section (Fun) */}
             <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-lg">
               <h3 className="font-bold mb-2">美食家等级</h3>
               <p className="text-sm text-slate-300 mb-4">
                 {stats.visited < 5 ? "新手美食家 - 旅程才刚刚开始！" : 
                  stats.visited < 20 ? "资深吃货 - 你的味蕾正在觉醒。" : 
                  "悉尼食神 - 你是这里的美食传说！"}
               </p>
               <div className="flex gap-2">
                 {[1, 5, 10, 20, 50].map(milestone => (
                   <div 
                     key={milestone}
                     className={`h-8 flex-1 rounded-lg flex items-center justify-center text-xs font-bold border ${
                       stats.visited >= milestone 
                         ? 'bg-amber-400 border-amber-400 text-slate-900' 
                         : 'bg-transparent border-slate-600 text-slate-600'
                     }`}
                   >
                     {milestone}
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}
      </main>

      <RestaurantModal />
    </div>
  );
}
