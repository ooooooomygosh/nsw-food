import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// --- ⚠️ 重要：这里填入你的 Firebase 配置 ---
// 1. 去 https://console.firebase.google.com/ 创建一个新项目
// 2. 点击 "Web" (</> 图标) 创建应用
// 3. 复制生成的 config 对象替换下面的内容
// 4. 在 Firebase Console -> Build -> Firestore Database -> Create Database (选 Test Mode)
const firebaseConfig = {
  apiKey: "AIzaSyBShub1Mr3TIp1168MjSm9yQBbr-qP-GOY",
  authDomain: "nsw-food.firebaseapp.com",
  projectId: "nsw-food",
  storageBucket: "nsw-food.firebasestorage.app",
  messagingSenderId: "452809553170",
  appId: "1:452809553170:web:cd07234bfbdef850e56fcb",
  measurementId: "G-6RYF2P0LMX"
};

// 检测是否配置了 Firebase
const isFirebaseConfigured = !!firebaseConfig.apiKey;

let db: any = null;
let auth: any = null;

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  // 自动匿名登录，确保有权限读写数据库
  signInAnonymously(auth).catch((error) => {
    console.error("Auth Error", error);
  });
}

export { db, auth, isFirebaseConfigured };