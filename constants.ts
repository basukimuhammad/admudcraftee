
import { AppData } from './types.ts';

export const DEFAULT_DATA: AppData = {
  _lastUpdated: Date.now(),
  profile: {
    name: "AdmudCraft",
    tagline: "Digital Crafter & Redstone Engineer",
    avatar: "https://z-cdn-media.chatglm.cn/files/4ff9bcd3-5fbb-4f00-a4d1-ce066b56a0a1.jpg",
    youtubeUrl: "https://youtube.com/@admudcraft",
    tiktokUrl: "https://tiktok.com/@admudcraft",
    discordUrl: "https://discord.gg/4YrY3ruMvg",
    storeUrl: "https://adhost-phi.vercel.app",
    secondStoreUrl: "https://billing.mineidhost.com?ref=Admud-Jawa",
    supportUrl: "https://sociabuzz.com/admud/tribe"
  },
  content: {
    youtubeId: "MmB9b5njVbA", 
    tiktokUrl: "https://www.tiktok.com/@admudcraft/video/7359154398421234955"
  },
  stats: {
    subscribers: 12500,
    followers: 45000,
    totalViews: 1200000
  },
  schedule: [
    { id: '1', day: 'Senin', activity: 'Survival Minecraft', time: '19:00 WIB', badge: 'Live' },
    { id: '2', day: 'Selasa', activity: 'Off Stream / Editing', time: '-', badge: 'Off' },
    { id: '3', day: 'Rabu', activity: 'Mabar Server', time: '20:00 WIB', badge: 'Mabar' },
    { id: '4', day: 'Kamis', activity: 'Review Map Subscriber', time: '19:30 WIB', badge: 'Live' },
    { id: '5', day: 'Jumat', activity: 'Jumat Berkah (Giveaway)', time: '16:00 WIB', badge: 'Event' },
    { id: '6', day: 'Sabtu', activity: 'Marathon Stream', time: '13:00 WIB', badge: 'Long' },
    { id: '7', day: 'Minggu', activity: 'Istirahat / Random Game', time: 'Tentative', badge: 'Chill' },
  ],
  rank: [
    { id: 'r1', rank: 1, name: 'SultanCraft_99', youtubeHandle: '@sultancraft', points: 15000, avatar: 'https://picsum.photos/50/50?random=1' },
    { id: 'r2', rank: 2, name: 'MinerPro_ID', youtubeHandle: '@minerpro', points: 12400, avatar: 'https://picsum.photos/50/50?random=2' },
    { id: 'r3', rank: 3, name: 'RedstoneMaster', youtubeHandle: '@redstone', points: 11000, avatar: 'https://picsum.photos/50/50?random=3' },
    { id: 'r4', rank: 4, name: 'CreeperHugger', youtubeHandle: '@creeper', points: 9500, avatar: 'https://picsum.photos/50/50?random=4' },
    { id: 'r5', rank: 5, name: 'DiamondHunter', youtubeHandle: '@diamond', points: 8200, avatar: 'https://picsum.photos/50/50?random=5' },
  ],
  moderators: [
    { id: 'm1', rank: 1, name: 'Admin_Ganteng', youtubeHandle: '@admin_ganteng', points: 99999, avatar: 'https://picsum.photos/50/50?random=20' },
    { id: 'm2', rank: 2, name: 'Bot_Police', youtubeHandle: '@bot_police', points: 8888, avatar: 'https://picsum.photos/50/50?random=21' },
    { id: 'm3', rank: 3, name: 'Helper_Santuy', youtubeHandle: '@helper_santuy', points: 5555, avatar: 'https://picsum.photos/50/50?random=22' },
    { id: 'm4', rank: 4, name: 'Mod_Baru_Rekrut', youtubeHandle: '@mod_baru', points: 3000, avatar: 'https://picsum.photos/50/50?random=23' },
  ],
  gallery: [
    { id: 'g1', src: 'https://picsum.photos/400/300?random=10' },
    { id: 'g2', src: 'https://picsum.photos/400/300?random=11' },
    { id: 'g3', src: 'https://picsum.photos/400/300?random=12' },
    { id: 'g4', src: 'https://picsum.photos/400/300?random=13' },
  ]
};

export const ADMIN_SALT = "4f7a1c9e2b"; 
export const ADMIN_HASH = "8dbdd28c01d52a8563d3aab9560f2f0f3eaa6b9536a2faed5d3054472e73623a";
