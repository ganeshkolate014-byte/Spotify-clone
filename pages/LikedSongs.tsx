import React from 'react';
import { usePlayerStore } from '../store/playerStore';
import { ArrowLeft, Play, Pause, Clock3, Heart, Download, ListFilter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../services/api';
import { motion } from 'framer-motion';

export const LikedSongs: React.FC = () => {
  const { likedSongs, playSong, currentSong, isPlaying, toggleLike } = usePlayerStore();
  const navigate = useNavigate();

  const handlePlayAll = () => {
    if (likedSongs.length > 0) {
      playSong(likedSongs[0], likedSongs);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-full pb-32 relative isolate">
      {/* Deep Atmosphere Background */}
      <div className="fixed inset-0 bg-[#121212] -z-20"></div>
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#5038a0] via-[#2d2060] to-[#121212] -z-10 opacity-80" />

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 px-6 py-4 flex items-center gap-4 bg-[#121212]/0 backdrop-blur-md transition-colors duration-300">
          <button 
            onClick={() => navigate(-1)} 
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
          >
             <ArrowLeft size={20} />
          </button>
          <span className="font-bold text-lg text-white opacity-0 md:opacity-100 transition-opacity">Liked Songs</span>
      </div>

      <div className="px-6 md:px-10">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-end gap-6 mb-8 pt-2">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-[160px] h-[160px] md:w-[240px] md:h-[240px] bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg shrink-0 group relative overflow-hidden"
            >
                <Heart size={80} fill="white" className="text-white drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </motion.div>
            
            <div className="flex flex-col gap-1 md:gap-3 mb-2 flex-1">
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-white hidden md:block">Playlist</span>
                <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none drop-shadow-lg">Liked Songs</h1>
                <div className="flex items-center flex-wrap gap-2 text-sm text-white/90 font-medium mt-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-white text-[10px] font-bold shadow-md">Y</div>
                    <span className="hover:underline cursor-pointer font-bold">You</span>
                    <span className="hidden md:inline">•</span>
                    <span className="w-1 h-1 rounded-full bg-white/50 md:hidden"></span>
                    <span>{likedSongs.length} songs</span>
                </div>
            </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-6">
                 <button 
                    onClick={handlePlayAll}
                    className="w-14 h-14 rounded-full bg-[#1DB954] flex items-center justify-center shadow-[0_8px_24px_rgba(29,185,84,0.3)] hover:scale-105 active:scale-95 transition-all group hover:bg-[#1ed760]"
                 >
                    {isPlaying && likedSongs.some(s => s.id === currentSong?.id) ? (
                        <Pause size={28} fill="black" className="text-black" />
                    ) : (
                        <Play size={28} fill="black" className="text-black ml-1 group-hover:scale-110 transition-transform" />
                    )}
                 </button>
                 <button className="text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5">
                    <Download size={24} />
                 </button>
             </div>
             <div className="flex items-center gap-4 text-white/60">
                 <button className="hover:text-white transition-colors p-2"><Search size={22} /></button>
                 <button className="hover:text-white transition-colors p-2"><ListFilter size={22} /></button>
             </div>
        </div>

        {/* List Header (Desktop) */}
        <div className="grid grid-cols-[16px_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-white/10 text-[#B3B3B3] text-sm font-medium sticky top-[72px] bg-[#121212] z-20 hidden md:grid mb-2">
            <span className="text-center">#</span>
            <span>Title</span>
            <span>Album</span>
            <div className="flex justify-end pr-2"><Clock3 size={16} /></div>
        </div>

        {/* Songs List */}
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col"
        >
            {likedSongs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-[#B3B3B3]">
                    <div className="w-20 h-20 bg-[#2A2A2A] rounded-full flex items-center justify-center mb-6">
                        <Heart size={32} className="opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Songs you like will appear here</h3>
                    <p className="max-w-md mx-auto text-sm">Save songs by tapping the heart icon on any track, album, or playlist.</p>
                    <button onClick={() => navigate('/search')} className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">
                        Find Songs
                    </button>
                </div>
            ) : (
                likedSongs.map((song, index) => {
                    const isCurrent = currentSong?.id === song.id;
                    return (
                        <motion.div
                            variants={itemVariants}
                            key={song.id}
                            onClick={() => playSong(song, likedSongs)}
                            className={`group grid grid-cols-[auto_1fr_auto] md:grid-cols-[16px_1fr_1fr_auto] gap-4 px-3 py-2.5 rounded-lg items-center cursor-pointer transition-colors ${isCurrent ? 'bg-white/10' : 'hover:bg-white/5'}`}
                        >
                            {/* Index / Play Button */}
                            <div className="w-4 md:w-full flex items-center justify-center text-[#B3B3B3] text-sm font-mono relative">
                                <span className={`group-hover:opacity-0 transition-opacity duration-0 ${isCurrent ? 'text-[#1DB954]' : ''}`}>{index + 1}</span>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-0 text-white">
                                    {isCurrent && isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" />}
                                </div>
                            </div>

                            {/* Title & Artist */}
                            <div className="flex items-center gap-4 overflow-hidden">
                                <img src={getImageUrl(song.image)} alt="" className="w-10 h-10 rounded shadow-sm object-cover shrink-0" />
                                <div className="flex flex-col overflow-hidden">
                                    <span className={`truncate font-medium text-[15px] ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>{song.name}</span>
                                    <div className="flex items-center gap-1 group-hover:text-white text-[#B3B3B3] transition-colors text-sm truncate">
                                        {song.downloadUrl?.some(u => u.quality.includes('320')) && (
                                            <span className="bg-[#C4C4C4] text-black px-1 rounded-[2px] text-[8px] font-bold flex items-center justify-center h-3 min-w-[12px]">E</span>
                                        )}
                                        <span className="truncate">{song.artists?.primary?.[0]?.name || "Unknown"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Album (Desktop) */}
                            <span className="hidden md:block text-sm text-[#B3B3B3] truncate group-hover:text-white transition-colors">
                                {song.album?.name || "Single"}
                            </span>

                            {/* Duration / Heart */}
                            <div className="flex items-center justify-end gap-6 min-w-[50px]">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#1DB954] focus:opacity-100"
                                >
                                    <Heart size={18} fill="#1DB954" />
                                </button>
                                <span className="text-sm text-[#B3B3B3] font-mono w-10 text-right">
                                    {Math.floor(parseInt(song.duration) / 60)}:{(parseInt(song.duration) % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                        </motion.div>
                    );
                })
            )}
        </motion.div>
      </div>
    </div>
  );
};