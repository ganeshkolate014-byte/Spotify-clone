import React, { useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { Search, Plus, ArrowUpDown, Pin, Heart, Music, UserCircle, Sparkles, CheckCircle2, WifiOff } from 'lucide-react';
import { getImageUrl } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { CreatePlaylistModal } from '../components/CreatePlaylistModal';
import { motion, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -15 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
        type: "tween",
        ease: "easeOut",
        duration: 0.2
    }
  }
};

export const Library: React.FC = () => {
  const { likedSongs, userPlaylists, currentUser, isOfflineMode, downloadedSongIds } = usePlayerStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'All' | 'Playlists' | 'Artists' | 'Downloaded'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter Logic
  const filteredPlaylists = userPlaylists.filter(() => {
     if (isOfflineMode || filter === 'Downloaded') {
         return true; 
     }
     return true;
  });

  const downloadedLikedSongsCount = likedSongs.filter(s => downloadedSongIds.includes(s.id)).length;
  
  const FilterChip = ({ label }: { label: string }) => (
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setFilter(label as any)}
        className={`px-5 py-2 rounded-full text-xs font-bold border border-transparent transition-colors shadow-sm ${filter === label ? 'bg-[#1DB954] text-black' : 'bg-[#2A2A2A] text-white hover:bg-[#3E3E3E]'}`}
      >
          {label}
      </motion.button>
  );

  const handleProfileClick = () => {
    if (currentUser) {
        navigate('/profile');
    } else {
        navigate('/login');
    }
  };

  return (
    <div className="min-h-full pb-32 bg-[#121212] pt-4 px-4">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#121212] z-20 py-2">
          <div className="flex items-center gap-3">
              <motion.div 
                 whileHover={{ scale: 1.1 }}
                 whileTap={{ scale: 0.9 }}
                 onClick={handleProfileClick}
                 className="w-9 h-9 rounded-full bg-[#1DB954] flex items-center justify-center font-bold text-black text-xs cursor-pointer overflow-hidden border border-black"
              >
                  {currentUser && currentUser.image ? (
                     <img src={currentUser.image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                     <span className="font-bold">{currentUser ? currentUser.name.charAt(0).toUpperCase() : <UserCircle size={20} />}</span>
                  )}
              </motion.div>
              <h1 className="text-2xl font-bold text-white">Your Library</h1>
          </div>
          <div className="flex items-center gap-4 text-white">
              {!isOfflineMode && <button onClick={() => navigate('/premium')} className="hover:text-white/70 transition-colors"><Sparkles size={24} /></button>}
              <button className="hover:text-white/70 transition-colors"><Search size={24} /></button>
              <button onClick={() => setIsModalOpen(true)} className="hover:text-white/70 transition-colors"><Plus size={26} /></button>
          </div>
      </div>

      {/* Offline Banner in Library */}
      {isOfflineMode && (
         <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-[#2A2A2A] rounded-[16px] p-4 flex items-center gap-3"
         >
             <div className="bg-[#333] p-2 rounded-full"><WifiOff size={20} /></div>
             <div className="flex flex-col">
                 <span className="text-sm font-bold text-white">You're offline</span>
                 <span className="text-xs text-[#B3B3B3]">Showing only downloaded music.</span>
             </div>
         </motion.div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar">
          {!isOfflineMode && <FilterChip label="All" />}
          {!isOfflineMode && <FilterChip label="Playlists" />}
          {!isOfflineMode && <FilterChip label="Artists" />}
          <FilterChip label="Downloaded" />
      </div>

      {/* Sort Row */}
      <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-1 text-white/90 text-sm">
              <ArrowUpDown size={14} />
              <span className="font-medium">Recents</span>
          </div>
          <div className="p-1">
              <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-1.5 h-1.5 bg-white/50 rounded-[1px]"></div>
                  <div className="w-1.5 h-1.5 bg-white/50 rounded-[1px]"></div>
                  <div className="w-1.5 h-1.5 bg-white/50 rounded-[1px]"></div>
                  <div className="w-1.5 h-1.5 bg-white/50 rounded-[1px]"></div>
              </div>
          </div>
      </div>

      {/* List Content */}
      <motion.div 
        className="flex flex-col gap-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
          
          {/* Liked Songs Pin */}
          {(!isOfflineMode || downloadedLikedSongsCount > 0) && (
              <motion.div 
                variants={itemVariants}
                onClick={() => navigate('/liked')}
                className="flex items-center gap-4 p-2 hover:bg-[#1A1A1A] rounded-[16px] cursor-pointer active:scale-[0.99] transition-all group"
              >
                  <div className="w-[56px] h-[56px] bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center shrink-0 rounded-[12px] shadow-sm">
                     <Heart size={24} fill="white" className="text-white" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-white font-bold text-[16px] truncate group-hover:text-white">Liked Songs</span>
                      <div className="flex items-center gap-1.5 text-[#B3B3B3] text-sm font-medium">
                           <Pin size={12} fill="#1DB954" className="text-[#1DB954] rotate-45" />
                           <span>Playlist • {isOfflineMode ? downloadedLikedSongsCount : likedSongs.length} songs</span>
                           {isOfflineMode && <CheckCircle2 size={12} className="text-[#1DB954]" />}
                      </div>
                  </div>
              </motion.div>
          )}

          {/* User Playlists */}
          {filteredPlaylists.map(playlist => (
             <motion.div 
                key={playlist.id}
                variants={itemVariants}
                onClick={() => navigate(`/playlist/${playlist.id}`)}
                className="flex items-center gap-4 p-2 hover:bg-[#1A1A1A] rounded-[16px] cursor-pointer active:scale-[0.99] transition-all group"
             >
                <div className="w-[56px] h-[56px] bg-[#333] shrink-0 rounded-[12px] overflow-hidden shadow-sm">
                    {playlist.image && playlist.image[0] ? (
                        <img src={getImageUrl(playlist.image)} alt={playlist.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#282828]">
                            <Music size={24} className="text-white/40" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-white font-bold text-[16px] truncate">{playlist.title}</span>
                    <div className="flex items-center gap-1 text-[#B3B3B3] text-sm font-medium truncate">
                        <span>Playlist • {playlist.subtitle}</span>
                        {isOfflineMode && <CheckCircle2 size={12} className="text-[#1DB954]" />}
                    </div>
                </div>
             </motion.div>
          ))}

          {isOfflineMode && filteredPlaylists.length === 0 && downloadedLikedSongsCount === 0 && (
              <div className="text-center py-12 text-[#777]">
                  <WifiOff size={40} className="mx-auto mb-4 opacity-50" />
                  <p className="font-bold text-lg">No downloaded content found.</p>
                  <p className="text-sm mt-2">Go online to download music.</p>
              </div>
          )}

      </motion.div>

      {isModalOpen && <CreatePlaylistModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};