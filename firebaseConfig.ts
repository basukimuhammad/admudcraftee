// ============================================================================
// KONFIGURASI DATABASE (FIREBASE)
// ============================================================================
// STATUS: Database aktif (Mode Test 30 Hari secara default)
//
// AGAR AKTIF SELAMANYA (PERMANEN):
// 1. Buka Firebase Console -> Realtime Database -> Rules
// 2. Ubah kodenya menjadi seperti di bawah ini:
//
// {
//   "rules": {
//     ".read": true,
//     ".write": true
//   }
// }
//
// 3. Klik Publish.
// ============================================================================

export const firebaseConfig = {
  apiKey: "AIzaSyBIAvCd0d12dohdWg_q97Ud3ASVY7bPw5g",
  authDomain: "admudcraft-db.firebaseapp.com",
  
  // URL Database kamu
  databaseURL: "https://admudcraft-db-default-rtdb.firebaseio.com", 
  
  projectId: "admudcraft-db",
  storageBucket: "admudcraft-db.firebasestorage.app",
  messagingSenderId: "674675995676",
  appId: "1:674675995676:web:918fc17673fa48f9ea9bd9",
  measurementId: "G-E205XW3KFN"
};

// Cek apakah user sudah setting atau belum
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "ISI_API_KEY_DISINI";
};