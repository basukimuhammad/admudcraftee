export interface Stats {
  subscribers: number;
  followers: number;
  totalViews: number;
}

export interface ScheduleItem {
  id: string;
  day: string;
  activity: string;
  time: string;
  badge: string;
}

export interface RankItem {
  id: string;
  rank: number;
  name: string;
  youtubeHandle?: string; // @username YouTube
  points: number;
  avatar: string;
}

export interface GalleryItem {
  id: string;
  src: string;
}

export interface Profile {
  name: string;
  tagline: string;
  avatar: string;
  youtubeUrl: string;
  tiktokUrl: string;
  discordUrl: string;
  storeUrl: string;
  secondStoreUrl: string;
  supportUrl: string;
}

export interface Content {
  youtubeId: string;
  tiktokUrl: string;
}

export interface AppData {
  profile: Profile;
  content: Content;
  stats: Stats;
  schedule: ScheduleItem[];
  rank: RankItem[];
  moderators: RankItem[];
  gallery: GalleryItem[];
  _lastUpdated: number;
}

export type EditType =
  | 'profile'
  | 'content'
  | 'stats'
  | 'schedule'
  | 'rank'
  | 'moderators'
  | 'gallery';
