import React, { useState, useEffect } from 'react';
import { AppData } from '../types';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'profile' | 'content' | 'stats' | 'schedule' | 'rank' | 'moderators' | 'gallery' | null;
  data: AppData;
  itemIndex?: number; // Used for arrays like schedule/rank
  onSave: (updatedData: AppData) => void;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, type, data, itemIndex, onSave }) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (isOpen && type) {
      if (type === 'profile') {
        setFormData({ ...data.profile });
      } else if (type === 'content') {
        setFormData({ ...data.content });
      } else if (type === 'stats') {
        setFormData({ ...data.stats });
      } else if (type === 'schedule' && itemIndex !== undefined) {
        setFormData({ ...data.schedule[itemIndex] });
      } else if (type === 'rank' && itemIndex !== undefined) {
        setFormData({ ...data.rank[itemIndex] });
      } else if (type === 'moderators' && itemIndex !== undefined) {
        setFormData({ ...data.moderators[itemIndex] });
      } else if (type === 'gallery' && itemIndex !== undefined) {
        setFormData({ ...data.gallery[itemIndex] });
      }
    }
  }, [isOpen, type, data, itemIndex]);

  if (!isOpen || !type) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newData = { ...data };

    if (type === 'profile') {
  newData.profile = {
    ...newData.profile,   // 🟢 pertahankan data lama
    ...formData          // 🟢 timpa yang diedit (name, tagline, avatar, dll)
  };
} else if (type === 'content') {
      newData.content = { ...formData };
    } else if (type === 'stats') {
      newData.stats = {
        subscribers: Number(formData.subscribers) || 0,
        followers: Number(formData.followers) || 0,
        totalViews: Number(formData.totalViews) || 0,
      };
    } else if (type === 'schedule' && itemIndex !== undefined) {
      const updatedSchedule = [...newData.schedule];
      updatedSchedule[itemIndex] = { ...updatedSchedule[itemIndex], ...formData };
      newData.schedule = updatedSchedule;
    } else if (type === 'rank' && itemIndex !== undefined) {
      const updatedRank = [...newData.rank];
      updatedRank[itemIndex] = {
  ...updatedRank[itemIndex],
  name: formData.name,
  youtubeHandle: formData.youtubeHandle || '',
  avatar: formData.avatar,
  points: Number(formData.points) || 0,
};
      newData.rank = updatedRank;
    } else if (type === 'moderators' && itemIndex !== undefined) {
      const updatedMods = [...newData.moderators];
      updatedMods[itemIndex] = {
  ...updatedMods[itemIndex],
  name: formData.name,
  youtubeHandle: formData.youtubeHandle || '',
  avatar: formData.avatar,
  points: Number(formData.points) || 0,
};
      newData.moderators = updatedMods;
    } else if (type === 'gallery' && itemIndex !== undefined) {
      const updatedGallery = [...newData.gallery];
      updatedGallery[itemIndex] = { ...updatedGallery[itemIndex], ...formData };
      newData.gallery = updatedGallery;
    }

    onSave(newData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md p-6 rounded-2xl border border-white/20 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white capitalize">
          Edit {type}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {type === 'profile' && (
            <>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">Name</label>
                <input name="name" type="text" value={formData.name || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">Tagline / Bio</label>
                <input name="tagline" type="text" value={formData.tagline || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">Avatar URL</label>
                <input name="avatar" type="text" value={formData.avatar || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                <h4 className="font-semibold mb-2 text-sm text-gray-700 dark:text-gray-300">Social Links</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400">YouTube URL</label>
                    <input name="youtubeUrl" type="text" value={formData.youtubeUrl || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400">TikTok URL</label>
                    <input name="tiktokUrl" type="text" value={formData.tiktokUrl || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400">Discord URL</label>
                    <input name="discordUrl" type="text" value={formData.discordUrl || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400">Store 1 (Main) URL</label>
                    <input name="storeUrl" type="text" value={formData.storeUrl || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                   <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400">Store 2 (Hosting) URL</label>
                    <input name="secondStoreUrl" type="text" value={formData.secondStoreUrl || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400">Support / Donate URL</label>
                    <input name="supportUrl" type="text" value={formData.supportUrl || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://sociabuzz..." />
                  </div>
                </div>
              </div>
            </>
          )}

          {type === 'content' && (
            <>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">YouTube Video ID</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Enter ONLY the ID (e.g., NaLSra9mv8c) from the URL.</p>
                <input name="youtubeId" type="text" value={formData.youtubeId || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">TikTok Video Link</label>
                <input name="tiktokUrl" type="text" value={formData.tiktokUrl || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}

          {type === 'stats' && (
            <>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">YouTube Subs</label>
                <input name="subscribers" type="number" value={formData.subscribers || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">TikTok Followers</label>
                <input name="followers" type="number" value={formData.followers || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">Total Views</label>
                <input name="totalViews" type="number" value={formData.totalViews || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}

          {type === 'schedule' && (
            <>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">Activity</label>
                <input name="activity" type="text" value={formData.activity || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">Time</label>
                <input name="time" type="text" value={formData.time || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">Badge</label>
                <input name="badge" type="text" value={formData.badge || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}

          {(type === 'rank' || type === 'moderators') && (
  <>
    <div>
      <label className="block text-sm text-gray-600 dark:text-gray-300">Display Name</label>
      <input 
        name="name" 
        type="text" 
        value={formData.name || ''} 
        onChange={handleChange} 
        className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
      />
    </div>

    <div>
      <label className="block text-sm text-gray-600 dark:text-gray-300">
        YouTube Username (@)
      </label>
      <input 
        name="youtubeHandle" 
        type="text" 
        value={formData.youtubeHandle || ''} 
        onChange={handleChange} 
        placeholder="@admudcraft"
        className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
      />
    </div>

    <div>
      <label className="block text-sm text-gray-600 dark:text-gray-300">Points (XP)</label>
      <input 
        name="points" 
        type="number" 
        value={formData.points || 0} 
        onChange={handleChange} 
        className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
      />
    </div>

    <div>
      <label className="block text-sm text-gray-600 dark:text-gray-300">Avatar URL</label>
      <input 
        name="avatar" 
        type="text" 
        value={formData.avatar || ''} 
        onChange={handleChange} 
        className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
      />
    </div>
  </>
)}

          {type === 'gallery' && (
            <>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">Image URL</label>
                <input name="src" type="text" value={formData.src || ''} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white font-semibold hover:opacity-90">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
