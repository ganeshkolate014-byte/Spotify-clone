import React, { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { ArrowLeft, Play, Pause, Clock3, Heart, Download, Search, ListFilter, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../services/api';
import { DownloadQualityModal } from '../components/DownloadQualityModal';
import { Song } from '../types';
import { motion } from 'framer-motion';

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export const LikedSongs: React.FC = () => {
  const { likedSongs, playSong, currentSong, isPlaying, toggleLike } = usePlayerStore();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [downloadSong, setDownloadSong] = useState<Song | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  // Scroll listener attached to MAIN container
  useEffect(() => {
    const main = document.querySelector('main');
    const handleScroll = () => {
        if (main) setIsScrolled(main.scrollTop > 200);
    };
    main?.addEventListener('scroll', handleScroll);
    return () => main?.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePlayAll = () => {
    if (likedSongs.length > 0) {
      playSong(likedSongs[0], likedSongs);
    }
  };

  const handleDownloadClick = (e: React.MouseEvent, song: Song) => {
      e.stopPropagation();
      setDownloadSong(song);
  };

  const filteredSongs = likedSongs.filter(s => 
      s.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
      s.artists.primary[0]?.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="min-h-full pb-32 relative isolate bg-[#121212]">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#5038a0] via-[#2a1e50] to-[#121212] -z-10 transition-colors duration-700" />

      {/* Sticky Header */}
      <div className={`sticky top-0 z-50 h-[64px] px-6 flex items-center gap-4 transition-all duration-300 ${isScrolled ? 'bg-[#2a1e50] shadow-xl' : 'bg-transparent'}`}>
          <button 
            onClick={() => navigate(-1)} 
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
          >
             <ArrowLeft size={20} />
          </button>
          <span className={`font-bold text-xl text-white transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>Liked Songs</span>
          {isScrolled && (
               <button 
                onClick={handlePlayAll}
                className="ml-auto w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center hover:scale-105 transition-transform text-black shadow-md"
               >
                   {isPlaying && likedSongs.some(s => s.id === currentSong?.id) ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-0.5" />}
               </button>
          )}
      </div>

      <div className="px-6 md:px-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-end gap-6 mb-6 pt-2 pb-6">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-[180px] h-[180px] md:w-[230px] md:h-[230px] bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-md shrink-0"
            >
                <Heart size={80} fill="white" className="text-white drop-shadow-md" />
            </motion.div>
            
            <div className="flex flex-col gap-2 md:gap-4 mb-2 flex-1 min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-white hidden md:block">Playlist</span>
                <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none drop-shadow-sm truncate py-2"
                >
                    Liked Songs
                </motion.h1>
                <div className="flex items-center flex-wrap gap-2 text-sm text-white/90 font-medium mt-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">Y</div>
                    <span className="hover:underline cursor-pointer font-bold">You</span>
                    <span className="hidden md:inline">•</span>
                    <span>{likedSongs.length} songs</span>
                </div>
            </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6 sticky top-[64px] z-40 py-2 -mx-6 px-6 backdrop-blur-sm transition-colors">
             <div className="flex items-center gap-6">
                 <button 
                    onClick={handlePlayAll}
                    className="w-14 h-14 rounded-full bg-[#1DB954] flex items-center justify-center shadow-[0_8px_24px_rgba(29,185,84,0.3)] hover:scale-105 active:scale-95 transition-all group hover:bg-[#1ed760]"
                 >
                    {isPlaying && likedSongs.some(s => s.id === currentSong?.id) ? (
                        <Pause size={28} fill="black" className="text-black" />
                    ) : (
                        <Play size={28} fill="black" className="text-black ml-1" />
                    )}
                 </button>
             </div>
             
             {/* Filter Input */}
             {likedSongs.length > 0 && (
                 <div className="relative group">
                     <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 group-hover:text-white transition-colors" />
                     <input 
                        type="text" 
                        placeholder="Find in Liked Songs" 
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        className="bg-white/10 hover:bg-white/20 focus:bg-white/20 text-white text-xs pl-9 pr-4 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-white/30 transition-all w-[150px] focus:w-[200px]"
                     />
                 </div>
             )}
        </div>

        {/* List Header */}
        <div className="grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_1fr_1fr_auto] gap-4 px-4 py-2 border-b border-white/10 text-[#B3B3B3] text-sm font-medium uppercase tracking-wider sticky top-[120px] bg-[#121212] z-30">
            <span className="text-center">#</span>
            <span>Title</span>
            <span className="hidden md:block">Album</span>
            <div className="flex justify-end pr-4"><Clock3 size={16} /></div>
        </div>

        {/* Songs List */}
        <motion.div 
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col"
        >
            {filteredSongs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-[#B3B3B3]">
                    <div className="w-16 h-16 bg-[#2A2A2A] rounded-full flex items-center justify-center mb-6">
                        <Music size={32} className="opacity-50" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                        {filterQuery ? "No matches found" : "Songs you like will appear here"}
                    </h3>
                    {!filterQuery && (
                        <button onClick={() => navigate('/search')} className="mt-6 px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">
                            Find Songs
                        </button>
                    )}
                </div>
            ) : (
                filteredSongs.map((song, index) => {
                    const isCurrent = currentSong?.id === song.id;
                    
                    return (
                        <motion.div
                            key={song.id}
                            variants={itemVariants}
                            onClick={() => playSong(song, likedSongs)}
                            className={`group grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_1fr_1fr_auto] gap-4 px-4 py-2 rounded-md items-center cursor-pointer transition-colors ${isCurrent ? 'bg-white/10' : 'hover:bg-white/5'}`}
                        >
                            {/* Index / Play Icon */}
                            <div className="flex items-center justify-center w-4 text-sm font-medium text-[#B3B3B3]">
                                {isCurrent && isPlaying ? (
                                    <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" className="w-3 h-3" alt="playing" />
                                ) : (
                                    <>
                                        <span className={`block group-hover:hidden ${isCurrent ? 'text-[#1DB954]' : ''}`}>{index + 1}</span>
                                        <Play size={12} fill="white" className="hidden group-hover:block text-white" />
                                    </>
                                )}
                            </div>

                            {/* Title & Artist */}
                            <div className="flex items-center gap-3 overflow-hidden">
                                <img src={getImageUrl(song.image)} alt="" className="w-10 h-10 rounded-[4px] shadow-sm object-cover shrink-0" />
                                <div className="flex flex-col overflow-hidden">
                                    <span className={`truncate font-medium text-[15px] ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>{song.name}</span>
                                    <span className="text-sm text-[#B3B3B3] group-hover:text-white transition-colors truncate">
                                        {song.artists?.primary?.[0]?.name || "Unknown"}
                                    </span>
                                </div>
                            </div>

                            {/* Album (Desktop) */}
                            <span className="hidden md:block text-sm text-[#B3B3B3] truncate group-hover:text-white transition-colors">
                                {song.album?.name || "Single"}
                            </span>

                            {/* Actions / Duration */}
                            <div className="flex items-center justify-end gap-3 min-w-[100px]">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#1DB954] hover:scale-110"
                                    title="Remove from Liked"
                                >
                                    <Heart size={16} fill="#1DB954" />
                                </button>
                                <button 
                                    onClick={(e) => handleDownloadClick(e, song)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#B3B3B3] hover:text-white hover:scale-110"
                                    title="Download"
                                >
                                    <Download size={16} />
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
        
        {/* Download Modal */}
        {downloadSong && (
            <DownloadQualityModal 
                song={downloadSong} 
                onClose={() => setDownloadSong(null)} 
            />
        )}
      </div>
    </div>
  );
};