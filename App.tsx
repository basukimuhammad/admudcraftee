import React, { useState, useEffect, useRef } from 'react';
import { subscribeToData, saveData, resetData, formatNumber } from './services/storage';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';
import { AppData, EditType } from './types';
import { ADMIN_HASH, ADMIN_SALT } from './constants';
import EditModal from './components/EditModal';

// Helper Function: HASHING (Sangat Aman)
// Menggunakan API Kriptografi bawaan browser (SHA-256)
// Ini adalah standar keamanan web modern.
const hashPassword = async (password: string, salt: string) => {
  const encoder = new TextEncoder();
  // Gabungkan password + salt agar tidak bisa ditebak pakai "Rainbow Table"
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

function App() {
  const [data, setData] = useState<AppData | null>(null); // Nullable saat loading awal
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  
  // STATE BARU: Menyimpan Hash yang dihitung browser untuk keperluan Debugging
  const [debugHash, setDebugHash] = useState('');
  const [showDebug, setShowDebug] = useState(false); // Default false agar tersembunyi
  
  // MODAL STATES
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false); // State untuk Modal Toko
  const [copied, setCopied] = useState(false);
  
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  
  const [editType, setEditType] = useState<EditType | null>(null);
  const [editIndex, setEditIndex] = useState<number | undefined>(undefined);
  
  const [isSyncing, setIsSyncing] = useState(false);

  // Tab State untuk Community Heroes
  const [activeRankTab, setActiveRankTab] = useState<'members' | 'moderators'>('members');

  const scheduleRef = useRef<HTMLDivElement>(null);

  // === REALTIME DATA LISTENER ===
  useEffect(() => {
    // Fungsi ini akan dipanggil setiap kali ada perubahan di Firebase
    const unsubscribe = subscribeToData((newData) => {
      setData(newData);
      setIsSyncing(false);
    });

    // Cleanup listener saat unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsCheckingPassword(true);
    setDebugHash(''); // Reset debug hash sebelum hitung ulang
    setShowDebug(false); // Reset tampilan debug

    try {
      // Kita hash input user secara realtime
      const inputHash = await hashPassword(adminPassword, ADMIN_SALT);
      setDebugHash(inputHash); // Simpan hash ini agar bisa ditampilkan ke User
      
      // Bandingkan Hash input user dengan Hash asli di constants.ts
      if (inputHash === ADMIN_HASH) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setAdminPassword('');
        setLoginError('');
        setDebugHash('');
        setShowAdminMenu(true);
      } else {
        setLoginError('Password salah!');
      }
    } catch (err) {
      setLoginError('Terjadi kesalahan sistem saat hashing.');
      console.error(err);
    } finally {
      setIsCheckingPassword(false);
    }
  };

  const handleDataUpdate = async (newData: AppData) => {
    setIsSyncing(true); 
    // Optimistic UI Update (Langsung ubah di layar biar cepat)
    setData(newData); 
    
    // Kirim ke server
    try {
      await saveData(newData);
      // Sukses diam (indikator saving hilang)
      setIsSyncing(false);
    } catch (err: any) {
      setIsSyncing(false);
      // Tampilkan error jelas jika gagal
      alert("GAGAL MENYIMPAN KE SERVER!\n\nKemungkinan penyebab:\n1. Kamu BELUM klik tombol ENABLE di Firebase Console.\n2. URL Database salah.\n3. Koneksi internet putus.\n\nError: " + err.message);
    }
  };

  // === ADD & DELETE ITEM FUNCTIONS (FIXED) ===
  const handleAddItem = async (type: 'schedule' | 'rank' | 'moderators' | 'gallery') => {
    if (!data) return;
    
    // Clone Object Utama
    const newData = { ...data };
    const generateId = () => Math.random().toString(36).substr(2, 9);

    if (type === 'schedule') {
      // Clone Array Schedule sebelum di-push (Agar React tahu ada perubahan)
      newData.schedule = [...newData.schedule];
      newData.schedule.push({
        id: generateId(),
        day: 'Hari Baru',
        activity: 'Isi kegiatan...',
        time: '00:00',
        badge: 'Live'
      });
    } else if (type === 'rank') {
      newData.rank = [...newData.rank];
      newData.rank.push({
        id: generateId(),
        rank: newData.rank.length + 1,
        name: 'Nama Member',
        points: 0,
        avatar: 'https://ui-avatars.com/api/?name=Member&background=random'
      });
    } else if (type === 'moderators') {
      if (!newData.moderators) newData.moderators = [];
      newData.moderators = [...newData.moderators]; // CLONE PENTING
      newData.moderators.push({
        id: generateId(),
        rank: newData.moderators.length + 1,
        name: 'Nama Moderator',
        points: 0,
        avatar: 'https://ui-avatars.com/api/?name=Mod&background=random'
      });
    } else if (type === 'gallery') {
      newData.gallery = [...newData.gallery];
      newData.gallery.push({
        id: generateId(),
        src: 'https://picsum.photos/400/300?random=' + Math.floor(Math.random() * 1000)
      });
    }

    await handleDataUpdate(newData);
  };

  const handleDeleteItem = async (type: 'schedule' | 'rank' | 'moderators' | 'gallery', index: number) => {
    if (!data || !window.confirm("Yakin ingin menghapus item ini selamanya?")) return;
    
    // Clone Object Utama
    const newData = { ...data };

    if (type === 'schedule') {
      // Clone Array sebelum di-splice (PENTING UNTUK HAPUS)
      newData.schedule = [...newData.schedule];
      newData.schedule.splice(index, 1);
    } else if (type === 'rank') {
      newData.rank = [...newData.rank];
      newData.rank.splice(index, 1);
      // Re-order ranks (1, 2, 3...)
      newData.rank.forEach((item, i) => item.rank = i + 1);
    } else if (type === 'moderators') {
      if (newData.moderators) {
        newData.moderators = [...newData.moderators]; // CLONE ARRAY MODERATOR
        newData.moderators.splice(index, 1);
        // Re-order ranks (1, 2, 3...)
        newData.moderators.forEach((item, i) => item.rank = i + 1);
      }
    } else if (type === 'gallery') {
      newData.gallery = [...newData.gallery];
      newData.gallery.splice(index, 1);
    }

    await handleDataUpdate(newData);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleResetData = () => {
    if (window.confirm("Yakin ingin mereset semua data ke default?")) {
      const defaultData = resetData();
      setData(defaultData);
    }
  };

  const openEdit = (type: EditType, index?: number) => {
    setEditType(type);
    setEditIndex(index);
  };

  const scrollSchedule = (direction: 'left' | 'right') => {
    if (scheduleRef.current) {
      const scrollAmount = 250;
      scheduleRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading Screen
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
      <div className="text-center">
        <i className="fas fa-circle-notch fa-spin text-4xl mb-3 text-blue-500"></i>
        <p>Menghubungkan ke Server...</p>
        <p className="text-xs text-gray-400 mt-2">Mencoba: {firebaseConfig.databaseURL}</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#121212] text-gray-100' : 'bg-[#e9ecef] text-gray-800'}`}>
      
      {/* Background Parallax Effect Wrapper */}
      <div className="fixed inset-0 z-0 bg-fixed bg-cover opacity-10 pointer-events-none" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cubes.png')` }}></div>

      {/* Main Container */}
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">

        {/* INFO BANNER: FIREBASE SETUP */}
        {!isFirebaseConfigured() && isAdmin && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-2xl backdrop-blur-md flex items-start gap-3 text-red-800 dark:text-red-200 text-sm animate-pulse">
            <i className="fas fa-exclamation-triangle mt-1 text-lg"></i>
            <div>
              <p className="font-bold">DATABASE BELUM TERHUBUNG!</p>
              <p>Kamu sedang dalam "Mode Offline". Perubahan yang kamu buat <b>TIDAK AKAN DILIHAT ORANG LAIN</b>.</p>
              <p className="mt-1">Silakan buka file <code>firebaseConfig.ts</code> dan masukkan kode API Key dari Firebase Console agar fitur Edit berfungsi secara Online.</p>
            </div>
          </div>
        )}

        {/* INFO BANNER: SUCCESS */}
        {isFirebaseConfigured() && isAdmin && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-2xl backdrop-blur-md flex items-center gap-3 text-green-800 dark:text-green-200 text-sm">
            <i className="fas fa-wifi mt-1 text-lg"></i>
            <div>
              <p className="font-bold">Online Mode Aktif</p>
              <p>Coba edit sesuatu. Jika loading terus atau error, cek apakah kamu sudah klik ENABLE di Firebase.</p>
            </div>
          </div>
        )}
        
        {/* === SECTION 1: PROFILE === */}
        <section className="mb-8 p-8 rounded-3xl bg-glass-light dark:bg-glass-dark backdrop-blur-md border border-glass-border dark:border-glass-borderDark shadow-xl text-center relative overflow-hidden group">
          {isAdmin && (
            <button onClick={() => openEdit('profile')} className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full z-20 hover:bg-green-600 transition shadow-lg">
              <i className="fas fa-edit"></i>
            </button>
          )}
          <div className="relative inline-block mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-white/30 overflow-hidden relative z-10 shadow-lg">
              <img src={data.profile.avatar} alt="Profile" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
            </div>
            {/* Animated Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-400 animate-spin-slow -m-1"></div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 cursor-default hover:tracking-wide transition-all duration-300">
            {data.profile.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{data.profile.tagline}</p>
          
          {/* Social Icons - Clean White Circle with COLORFUL HOVER */}
          <div className="flex justify-center gap-4 flex-wrap">
            
            {/* YouTube - Default: White/Black, Hover: Red/White */}
            <a href={data.profile.youtubeUrl} target="_blank" rel="noreferrer" 
               className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-md text-2xl text-gray-900 transition-all duration-300 hover:scale-110 hover:bg-[#FF0000] hover:text-white hover:shadow-red-500/50"
               title="YouTube">
              <i className="fab fa-youtube"></i>
            </a>

            {/* TikTok - Default: White/Black, Hover: Black/White */}
            <a href={data.profile.tiktokUrl} target="_blank" rel="noreferrer" 
               className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-md text-2xl text-gray-900 transition-all duration-300 hover:scale-110 hover:bg-black hover:text-white hover:shadow-gray-500/50"
               title="TikTok">
              <i className="fab fa-tiktok"></i>
            </a>

            {/* Store Button (Trigger Modal) - Default: White/Black, Hover: Orange/White */}
            <button 
               onClick={() => setShowStoreModal(true)}
               className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-md text-2xl text-gray-900 transition-all duration-300 hover:scale-110 hover:bg-orange-500 hover:text-white hover:shadow-orange-500/50"
               title="Open Stores">
              <i className="fas fa-shopping-bag"></i>
            </button>

            {/* Discord - Default: White/Black, Hover: Blue/White */}
            <a href={data.profile.discordUrl} target="_blank" rel="noreferrer" 
               className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-md text-2xl text-gray-900 transition-all duration-300 hover:scale-110 hover:bg-[#5865F2] hover:text-white hover:shadow-blue-500/50"
               title="Discord">
              <i className="fab fa-discord"></i>
            </a>

             {/* Heart / Support - Default: White/Red, Hover: Pink/White - NOW CLICKABLE */}
             <a href={data.profile.supportUrl || '#'} target="_blank" rel="noreferrer" 
                className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-md text-2xl text-red-500 transition-all duration-300 hover:scale-110 hover:bg-pink-500 hover:text-white hover:shadow-pink-500/50 animate-pulse-fast hover:animate-none" 
                title="Support / Donate">
               <i className="fas fa-heart"></i>
            </a>

          </div>
        </section>

        {/* === SECTION 2: STATS === */}
        <section className="mb-8 relative p-6 rounded-3xl bg-glass-light dark:bg-glass-dark backdrop-blur-md border border-glass-border dark:border-glass-borderDark shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Channel Stats</h2>
            {isAdmin && (
              <button onClick={() => openEdit('stats')} className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold hover:bg-green-600 transition">
                <i className="fas fa-edit mr-2"></i>Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white/40 dark:bg-black/20 p-4 rounded-xl text-center border border-white/20 hover:-translate-y-1 transition duration-300">
              <i className="fab fa-youtube text-3xl text-red-600 mb-2"></i>
              <h3 className="text-2xl font-bold">{formatNumber(data.stats.subscribers)}</h3>
              <p className="text-xs uppercase tracking-wider opacity-70">Subscribers</p>
            </div>
            <div className="bg-white/40 dark:bg-black/20 p-4 rounded-xl text-center border border-white/20 hover:-translate-y-1 transition duration-300">
              <i className="fab fa-tiktok text-3xl text-black dark:text-white mb-2"></i>
              <h3 className="text-2xl font-bold">{formatNumber(data.stats.followers)}</h3>
              <p className="text-xs uppercase tracking-wider opacity-70">Followers</p>
            </div>
            <div className="col-span-2 md:col-span-1 bg-white/40 dark:bg-black/20 p-4 rounded-xl text-center border border-white/20 hover:-translate-y-1 transition duration-300">
              <i className="fas fa-eye text-3xl text-blue-500 mb-2"></i>
              <h3 className="text-2xl font-bold">{formatNumber(data.stats.totalViews)}</h3>
              <p className="text-xs uppercase tracking-wider opacity-70">Total Views</p>
            </div>
          </div>
        </section>

        {/* === SECTION 3: SCHEDULE & RANK/MODS === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Schedule */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-glass-light dark:bg-glass-dark backdrop-blur-md border border-glass-border dark:border-glass-borderDark shadow-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Streaming Schedule</h2>
              <div className="flex gap-2">
                 {/* ADD BUTTON (SCHEDULE) */}
                 {isAdmin && (
                  <button onClick={() => handleAddItem('schedule')} className="w-8 h-8 rounded-full bg-green-500 text-white hover:bg-green-600 transition flex items-center justify-center shadow-lg" title="Tambah Jadwal">
                    <i className="fas fa-plus"></i>
                  </button>
                )}
                <button onClick={() => scrollSchedule('left')} className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 hover:bg-blue-500 hover:text-white transition flex items-center justify-center">
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button onClick={() => scrollSchedule('right')} className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 hover:bg-blue-500 hover:text-white transition flex items-center justify-center">
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>

            <div className="relative">
              <div ref={scheduleRef} className="flex gap-4 overflow-x-auto hide-scroll pb-2">
                {data.schedule.map((day, index) => (
                  <div key={day.id} className="flex-none w-64 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20 relative group hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                     {isAdmin && (
                      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition z-20">
                         <button onClick={() => openEdit('schedule', index)} className="w-6 h-6 bg-green-500 rounded-full text-white text-xs flex items-center justify-center">
                            <i className="fas fa-edit"></i>
                         </button>
                         <button onClick={() => handleDeleteItem('schedule', index)} className="w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                            <i className="fas fa-trash"></i>
                         </button>
                      </div>
                    )}
                    <span className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md text-white ${
                      day.badge === 'Live' ? 'bg-red-500' : 
                      day.badge === 'Off' ? 'bg-gray-500' : 
                      'bg-blue-500'
                    }`}>
                      {day.badge}
                    </span>
                    <h3 className="font-bold text-lg mb-1">{day.day}</h3>
                    <p className="text-sm opacity-80 mb-3 min-h-[40px] line-clamp-2">{day.activity}</p>
                    <div className="inline-block px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                      {day.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rank List (Community Heroes) */}
          <div className="p-6 rounded-3xl bg-glass-light dark:bg-glass-dark backdrop-blur-md border border-glass-border dark:border-glass-borderDark shadow-lg flex flex-col">
             
             {/* Header with Tabs */}
             <div className="flex flex-col mb-4">
               <h2 className="text-lg font-bold mb-3">Community Heroes</h2>
               <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl">
                 <button 
                  onClick={() => setActiveRankTab('members')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeRankTab === 'members' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                 >
                   Top Members
                 </button>
                 <button 
                  onClick={() => setActiveRankTab('moderators')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeRankTab === 'moderators' ? 'bg-purple-500 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                 >
                   Top Mods
                 </button>
               </div>
             </div>
            
            {/* List Container - Members */}
            {activeRankTab === 'members' && (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
                {data.rank.map((member, index) => (
                  <div key={member.id} className="flex items-center p-3 rounded-xl bg-white/40 dark:bg-black/20 border border-white/20 relative group hover:scale-[1.02] transition">
                     {isAdmin && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition z-20">
                            <button onClick={() => openEdit('rank', index)} className="w-6 h-6 bg-green-500 rounded-full text-white text-xs flex items-center justify-center shadow-sm hover:scale-110">
                              <i className="fas fa-edit"></i>
                            </button>
                            <button onClick={() => handleDeleteItem('rank', index)} className="w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center shadow-sm hover:scale-110">
                              <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    )}
                    <div className={`w-8 font-bold text-center mr-2 ${index === 0 ? 'text-yellow-500 text-xl' : index === 1 ? 'text-gray-400 text-lg' : index === 2 ? 'text-orange-500' : 'opacity-60'}`}>
                      {member.rank}
                    </div>
                    <img src={member.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 mr-3 object-cover" />
                    <div className="flex-1 min-w-0 pointer-events-none">
  <h4 className="text-sm font-bold truncate">{member.name}</h4>

  {member.youtubeHandle && (
    <a
      href={`https://m.youtube.com/${
        member.youtubeHandle.startsWith('@')
          ? member.youtubeHandle
          : `@${member.youtubeHandle}`
      }`}
      target="_blank"
      rel="noreferrer"
      className="pointer-events-auto inline-flex w-fit text-xs text-red-500 hover:underline"
    >
      {member.youtubeHandle}
    </a>
  )}

  <p className="text-xs opacity-70 mt-1">
    <i className="fas fa-star text-yellow-400 mr-1"></i>
    {member.points.toLocaleString()}
  </p>
</div>
                  </div>
                ))}

                 {/* ADD BUTTON (MEMBERS) */}
                 {isAdmin && (
                  <button 
                    onClick={() => handleAddItem('rank')}
                    className="w-full py-2 mt-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition font-bold"
                  >
                    <i className="fas fa-plus mr-2"></i> Tambah Member
                  </button>
                )}
              </div>
            )}

            {/* List Container - Moderators - NEW LUXURY DESIGN */}
            {activeRankTab === 'moderators' && (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
                {data.moderators && data.moderators.map((mod, index) => (
                  <div key={mod.id} className="flex items-center p-3 rounded-xl bg-purple-100/40 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 relative group hover:scale-[1.02] transition shadow-sm">
                    {isAdmin && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition z-20">
                            <button onClick={() => openEdit('moderators', index)} className="w-6 h-6 bg-green-500 rounded-full text-white text-xs flex items-center justify-center shadow-sm hover:scale-110">
                              <i className="fas fa-edit"></i>
                            </button>
                            <button onClick={() => handleDeleteItem('moderators', index)} className="w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center shadow-sm hover:scale-110">
                              <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    )}
                    
                    {/* LUXURY RANK BADGE LOGIC */}
                    <div className="w-10 flex justify-center items-center mr-2">
                       {index === 0 ? (
                         <div className="relative group/crown">
                           {/* Rank 1: Glowing Gold Crown */}
                           <i className="fas fa-crown text-3xl text-yellow-400 drop-shadow-[0_2px_10px_rgba(234,179,8,0.6)] animate-pulse-fast"></i>
                           <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white animate-ping"></div>
                         </div>
                       ) : index === 1 ? (
                         <div className="relative">
                            {/* Rank 2: Silver Crown */}
                           <i className="fas fa-crown text-2xl text-gray-300 drop-shadow-md"></i>
                           <span className="absolute -bottom-1 -right-1 text-[10px] font-bold text-gray-500 bg-white/80 px-1 rounded-full border border-gray-300">2</span>
                         </div>
                       ) : index === 2 ? (
                         <div className="relative">
                            {/* Rank 3: Bronze Crown */}
                           <i className="fas fa-crown text-2xl text-amber-700 drop-shadow-md"></i>
                            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold text-amber-800 bg-white/80 px-1 rounded-full border border-amber-700">3</span>
                         </div>
                       ) : (
                         /* Rank 4+: Luxury Hexagon Badge (Segi Enam) */
                         <div className="relative w-8 h-9 flex items-center justify-center drop-shadow-md transition-transform group-hover:scale-110">
                           {/* Outer Dark Border Effect */}
                            <div 
                              className="absolute inset-0 bg-gradient-to-br from-purple-800 to-indigo-900" 
                              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                            ></div>
                            {/* Inner Royal Gradient */}
                            <div 
                              className="absolute inset-[2px] bg-gradient-to-b from-purple-500 via-purple-600 to-indigo-600" 
                              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                            ></div>
                            {/* Number */}
                           <span className="relative z-10 text-white font-bold text-xs shadow-black drop-shadow-sm">{mod.rank}</span>
                         </div>
                       )}
                    </div>

                    {/* AVATAR with Border Effect for Top 3 */}
                    <div className="relative">
                        <img 
                          src={mod.avatar} 
                          alt="Avatar" 
                          className={`w-12 h-12 rounded-full border-2 mr-3 object-cover ${
                            index === 0 ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)] ring-2 ring-yellow-400/30' : 
                            index === 1 ? 'border-gray-300 shadow-md' : 
                            'border-purple-300 dark:border-purple-600'
                          }`} 
                        />
                        {/* Status Dot */}
                        <div className="absolute bottom-0 right-3 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold truncate flex items-center gap-1 text-gray-800 dark:text-gray-100">
                        {mod.name} 
                        {index === 0 && <i className="fas fa-check-circle text-blue-500 text-xs ml-1" title="Verified"></i>}
                      </h4>
                      {mod.youtubeHandle && (
  <a
  href={`https://www.youtube.com/${
    mod.youtubeHandle.startsWith('@')
      ? mod.youtubeHandle
      : `@${mod.youtubeHandle}`
  }`}
  target="_blank"
  rel="noreferrer"
  className="text-[11px] text-pink-500 hover:underline"
>
    {mod.youtubeHandle}
  </a>
)}
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 w-16 bg-purple-200 dark:bg-purple-900 rounded-full overflow-hidden">
                           <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${Math.min(100, (mod.points / 20000) * 100)}%` }}></div>
                         </div>
                         <p className="text-[10px] opacity-70 text-purple-600 dark:text-purple-300 font-bold whitespace-nowrap">{formatNumber(mod.points)} XP</p>
                      </div>
                    </div>
                  </div>
                ))}

                 {/* ADD BUTTON (MODERATORS) */}
                 {isAdmin && (
                  <button 
                    onClick={() => handleAddItem('moderators')}
                    className="w-full py-2 mt-2 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl text-purple-500 hover:border-purple-500 hover:text-purple-600 transition font-bold"
                  >
                    <i className="fas fa-plus mr-2"></i> Tambah Moderator
                  </button>
                )}
              </div>
            )}
            
          </div>
        </div>

        {/* === SECTION 4: VIDEOS === */}
        <section className="mb-8 p-6 rounded-3xl bg-glass-light dark:bg-glass-dark backdrop-blur-md border border-glass-border dark:border-glass-borderDark shadow-lg relative group">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Latest Content</h2>
            {isAdmin && (
              <button onClick={() => openEdit('content')} className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold hover:bg-green-600 transition">
                <i className="fas fa-edit mr-2"></i>Edit
              </button>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="aspect-video rounded-xl overflow-hidden shadow-lg border border-white/20 bg-black relative">
               <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${data.content.youtubeId}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
               <div className="absolute -bottom-6 left-0 right-0 text-center">
                  <a href={`https://www.youtube.com/watch?v=${data.content.youtubeId}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">
                    Video tidak muncul? Klik disini
                  </a>
               </div>
            </div>
            <div className="flex justify-center items-center bg-gradient-to-br from-gray-900 to-black rounded-xl border border-white/20 p-4 text-white">
               <div className="text-center w-full">
                 <div className="mb-4 text-5xl">
                    <i className="fab fa-tiktok text-pink-500 animate-pulse"></i>
                 </div>
                 <p className="mb-4 font-bold opacity-90">Check out the latest TikTok</p>
                 <a href={data.content.tiktokUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-6 py-3 bg-[#fe2c55] text-white rounded-full hover:scale-105 transition gap-2 shadow-lg w-full max-w-[200px] font-bold">
                   <i className="fab fa-tiktok"></i> Watch Now
                 </a>
               </div>
            </div>
          </div>
        </section>

        {/* === SECTION 5: GALLERY === */}
        <section className="mb-8 p-6 rounded-3xl bg-glass-light dark:bg-glass-dark backdrop-blur-md border border-glass-border dark:border-glass-borderDark shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Gallery</h2>
             {/* ADD BUTTON (GALLERY) */}
             {isAdmin && (
                <button onClick={() => handleAddItem('gallery')} className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold hover:bg-green-600 transition shadow-lg">
                  <i className="fas fa-plus mr-2"></i>Tambah Foto
                </button>
              )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.gallery.map((img, index) => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-[4/3] shadow-md cursor-pointer">
                 {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition z-20">
                      <button onClick={() => openEdit('gallery', index)} className="w-8 h-8 bg-green-500 rounded-full text-white text-sm flex items-center justify-center shadow-md hover:scale-110">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => handleDeleteItem('gallery', index)} className="w-8 h-8 bg-red-500 rounded-full text-white text-sm flex items-center justify-center shadow-md hover:scale-110">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  )}
                <img src={img.src} alt="Gallery" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition duration-300"></div>
              </div>
            ))}
          </div>
        </section>

        {/* === JOIN BUTTON === */}
        <div className="text-center mb-12">
          <button onClick={() => setShowJoinModal(true)} className="inline-flex items-center px-8 py-4 bg-white/80 dark:bg-black/60 backdrop-blur-md border border-glass-border rounded-2xl text-lg font-bold hover:scale-105 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all duration-300 shadow-xl">
            <i className="fas fa-server mr-3"></i> Join Community
          </button>
        </div>

      </div>

      {/* === FIXED CONTROLS (Floating Action Buttons) === */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        
        {/* SYNC INDICATOR */}
        {isSyncing && (
          <div className="bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center animate-pulse">
            <i className="fas fa-sync fa-spin mr-2"></i> Saving...
          </div>
        )}

        {/* Admin Menu (Only shown if logged in) */}
        {isAdmin && showAdminMenu && (
          <div className="flex flex-col gap-3 mb-2 animate-fade-in-up">
            
             {/* Reset Data */}
             <button 
              onClick={handleResetData}
              className="w-12 h-12 rounded-full backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-all"
              title="Reset All Data"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          </div>
        )}

        {/* Main Controls Group */}
        <div className="flex items-center gap-3">
          {/* Refresh Button - Always visible for quick check */}
          <button onClick={handleRefresh} className={`w-12 h-12 rounded-full backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center transition-all duration-300 bg-white/80 dark:bg-black/60 hover:bg-blue-500 hover:text-white`} title="Refresh Page">
             <i className="fas fa-sync-alt"></i>
          </button>

          {/* Admin Toggle */}
          <button 
            onClick={() => {
              if (isAdmin) {
                setShowAdminMenu(!showAdminMenu);
              } else {
                setShowAdminLogin(true);
              }
            }} 
            className={`w-14 h-14 rounded-full backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center transition-all duration-300 ${isAdmin ? 'bg-green-500 text-white ring-4 ring-green-500/30' : 'bg-white/90 dark:bg-black/80 hover:bg-green-500 hover:text-white'}`}
            title={isAdmin ? "Admin Menu" : "Login Admin"}
          >
            <i className={`fas ${isAdmin ? (showAdminMenu ? 'fa-times' : 'fa-tools') : 'fa-user-cog'}`}></i>
          </button>
        </div>
      </div>

      <div className="fixed top-6 right-6 z-50">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-12 h-12 rounded-full backdrop-blur-md bg-white/80 dark:bg-black/60 border border-white/20 shadow-lg flex items-center justify-center hover:scale-110 transition text-xl">
          <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
      </div>

      {/* === MODALS === */}
      
      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/90 dark:bg-gray-900/90 w-full max-w-sm p-8 rounded-3xl border border-white/20 shadow-2xl text-center">
            <h2 className="text-2xl font-bold mb-6 text-blue-600"><i className="fas fa-lock mr-2"></i>Admin Access</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="password" 
                placeholder="Enter Admin Password" 
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                autoFocus
                autoCapitalize="none" 
                autoCorrect="off"
              />
              
              {/* ERROR & DEBUG SECTION */}
              {loginError && (
                <div className="animate-shake">
                  <p 
                    className="text-red-500 text-sm font-bold mb-2 bg-red-100 dark:bg-red-900/30 p-2 rounded-lg cursor-pointer"
                    onClick={() => setShowDebug(!showDebug)}
                    title="Klik untuk opsi developer (Debug)"
                  >
                    {loginError}
                  </p>
                  
                  {/* DEBUG AREA (Hidden by default) */}
                  {showDebug && (
                    <div className="mt-2 text-xs text-left p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg animate-fade-in">
                      <p className="font-bold mb-1 text-gray-700 dark:text-gray-300">🛠 Developer Debug:</p>
                      <p className="mb-2 text-gray-500">
                        Browser kamu menghitung Hash berikut. <br/>
                        Jika password benar tapi tetap error, salin kode ini ke <code>constants.ts</code>:
                      </p>
                      <div className="p-2 bg-black/90 text-green-400 font-mono rounded break-all select-all border border-green-900 cursor-text">
                        {debugHash}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                 <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-3 bg-gray-300 dark:bg-gray-700 rounded-xl font-bold hover:opacity-80 transition">Cancel</button>
                 <button type="submit" disabled={isCheckingPassword} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg disabled:opacity-50">
                   {isCheckingPassword ? 'Checking...' : 'Login'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Community Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowJoinModal(false)}>
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm p-6 rounded-3xl border border-white/20 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowJoinModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xl transition">
              <i className="fas fa-times"></i>
            </button>
            <h2 className="text-xl font-bold mb-6 text-center">Select Platform</h2>
            <div className="space-y-4">
              <a href="https://discord.gg/RrX7KGkn79" target="_blank" rel="noreferrer" className="flex items-center p-4 bg-[#5865F2] text-white rounded-xl font-bold hover:scale-105 transition shadow-md">
                <i className="fab fa-discord text-2xl mr-4"></i> Join Discord Server
              </a>
              <a href="https://chat.whatsapp.com/BC2YakGnnI4G6SlzFtNhT1" target="_blank" rel="noreferrer" className="flex items-center p-4 bg-[#25D366] text-white rounded-xl font-bold hover:scale-105 transition shadow-md">
                <i className="fab fa-whatsapp text-2xl mr-4"></i> Join WhatsApp Group
              </a>
            </div>
          </div>
        </div>
      )}

       {/* Store Selection Modal */}
       {showStoreModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowStoreModal(false)}>
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm p-6 rounded-3xl border border-white/20 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowStoreModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xl transition">
              <i className="fas fa-times"></i>
            </button>
            <h2 className="text-xl font-bold mb-6 text-center">Select Store</h2>

            <div className="space-y-4">
              
              {/* Promo Code Section - MOVED TO TOP */}
              {data.profile.secondStoreUrl && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center mb-2">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                       <i className="fas fa-ticket-alt mr-1"></i> Voucher Khusus Hosting Store
                    </p>
                    <div className="flex items-center justify-between bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-lg p-2 pl-4">
                      <span className="font-mono font-bold text-lg select-all">ADMUDJAWA-M</span>
                      <button 
                        onClick={() => handleCopyCode("ADMUDJAWA-M")}
                        className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                      >
                        {copied ? <><i className="fas fa-check mr-1"></i>Copied</> : <><i className="fas fa-copy mr-1"></i>Copy</>}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">Gunakan kode ini saat checkout di Hosting Store</p>
                </div>
              )}

              {/* Store 1 - Official Store */}
              <a href={data.profile.storeUrl} target="_blank" rel="noreferrer" className="flex items-center p-4 bg-orange-500 text-white rounded-xl font-bold hover:scale-105 transition shadow-md">
                <i className="fas fa-shopping-bag text-2xl mr-4"></i> Official Store
              </a>

              {/* Store 2 - Hosting Store */}
              {data.profile.secondStoreUrl && (
                 <a href={data.profile.secondStoreUrl} target="_blank" rel="noreferrer" className="flex items-center p-4 bg-purple-600 text-white rounded-xl font-bold hover:scale-105 transition shadow-md">
                    <i className="fas fa-server text-2xl mr-4"></i> Hosting Store
                  </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal Component */}
      <EditModal 
        isOpen={!!editType} 
        type={editType} 
        itemIndex={editIndex}
        data={data} 
        onClose={() => { setEditType(null); setEditIndex(undefined); }} 
        onSave={handleDataUpdate} 
      />

    </div>
  );
}

export default App;
