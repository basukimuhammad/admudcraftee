
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update } from "firebase/database";
import { AppData } from '../types.ts';
import { DEFAULT_DATA } from '../constants.ts';
import { firebaseConfig, isFirebaseConfigured } from '../firebaseConfig.ts';

const STORAGE_KEY = 'admudcraft_data';

let db: any = null;
if (isFirebaseConfigured()) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  } catch (err) {
    console.error("Firebase init error:", err);
  }
}

const loadLocalData = (): AppData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...DEFAULT_DATA, 
        ...parsed,
        stats: { ...DEFAULT_DATA.stats, ...(parsed.stats || {}) },
        profile: { ...DEFAULT_DATA.profile, ...(parsed.profile || {}) },
        content: { ...DEFAULT_DATA.content, ...(parsed.content || {}) }
      };
    }
  } catch (e) {
    console.error("Local load failed", e);
  }
  return DEFAULT_DATA;
};

export const subscribeToData = (onDataReceived: (data: AppData) => void) => {
  const safetyTimer = setTimeout(() => {
    onDataReceived(loadLocalData());
  }, 3000);

  if (db) {
    const dataRef = ref(db, 'portfolioData');
    const unsubscribe = onValue(dataRef, (snapshot) => {
      clearTimeout(safetyTimer); 
      const val = snapshot.val();
      if (val) {
        const mergedData: AppData = {
          _lastUpdated: val._lastUpdated || Date.now(),
          profile: { ...DEFAULT_DATA.profile, ...(val.profile || {}) },
          stats: { ...DEFAULT_DATA.stats, ...(val.stats || {}) },
          content: { ...DEFAULT_DATA.content, ...(val.content || {}) },
          schedule: val.schedule || DEFAULT_DATA.schedule,

rank: (val.rank || DEFAULT_DATA.rank).map((m: any, i: number) => ({
  ...DEFAULT_DATA.rank[i],
  ...m
})),

moderators: (val.moderators || DEFAULT_DATA.moderators).map((m: any, i: number) => ({
  ...DEFAULT_DATA.moderators[i],
  ...m
})),

gallery: val.gallery || DEFAULT_DATA.gallery,
        };
        onDataReceived(mergedData);
      } else {
        onDataReceived(DEFAULT_DATA);
      }
    }, () => {
      clearTimeout(safetyTimer);
      onDataReceived(loadLocalData());
    });
    return unsubscribe;
  } else {
    clearTimeout(safetyTimer);
    onDataReceived(loadLocalData());
    return () => {}; 
  }
};

export const saveData = async (data: AppData): Promise<void> => {
  const dataToSave = { ...data, _lastUpdated: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  if (db) {
  await update(ref(db, 'portfolioData'), {
    profile: data.profile,
    content: data.content,
    stats: data.stats,
    schedule: data.schedule,
    rank: data.rank,
    moderators: data.moderators,
    gallery: data.gallery,
    _lastUpdated: Date.now()
  });
}
};

export const resetData = (): AppData => {
  if(db) set(ref(db, 'portfolioData'), DEFAULT_DATA);
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_DATA;
};

export const formatNumber = (num: number): string => {
  if (isNaN(num)) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};
