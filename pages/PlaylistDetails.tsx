import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { authService } from '../services/auth';
import { getImageUrl, api } from '../services/api';
import { Play, Pause, Clock3, MoreHorizontal, Trash2, Music, ArrowLeft, Search, Heart, Share2, Check, User } from 'lucide-react';
import { Song, UserPlaylist } from '../types';
import { motion } from 'framer-motion';

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

export const PlaylistDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userPlaylists, playSong, currentSong, isPlaying, removePlaylist, addSongToPlaylist, importPlaylist } = usePlayerStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [viewPlaylist, setViewPlaylist] = useState<UserPlaylist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  
  const isMyPlaylist = userPlaylists.some(p => p.id === id);

  useEffect(() => {
    const main = document.querySelector('main');
    const handleScroll = () => {
        if (main) setIsScrolled(main.scrollTop > 200);
    };
    main?.addEventListener('scroll', handleScroll);
    return () => main?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
      const loadPlaylist = async () => {
          setIsLoading(true);
          const localPlaylist = userPlaylists.find(p => p.id === id);
          if (localPlaylist) {
              setViewPlaylist(localPlaylist);
              setIsLoading(false);
              return;
          }
          if (id) {
              const publicPlaylist = await authService.getPublicPlaylist(id);
              if (publicPlaylist) {
                  setViewPlaylist(publicPlaylist);
              }
          }
          setIsLoading(false);
      };
      loadPlaylist();
  }, [id, userPlaylists]);

  // Debounced Search for "Add Songs"
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
           const songs = await api.searchSongs(searchQuery);
           setSearchResults(songs.slice(0, 5));
        } catch (e) { console.error(e); } 
        finally { setIsSearching(false); }
      } else {
        setSearchResults([]);
      }
    }, 500); 
    return () => clearTimeout(timer);
  }, [searchQuery]);


  if (isLoading) {
      return <div className="flex h-full w-full items-center justify-center bg-[#121212]"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!viewPlaylist) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-white">
              <h2 className="text-2xl font-bold mb-4">Playlist not found</h2>
              <button onClick={() => navigate('/library')} className="px-6 py-2 bg-white text-black rounded-full font-bold">Back to Library</button>
          </div>
      );
  }

  const handleDelete = () => {
      if (window.confirm("Are you sure you want to delete this playlist?")) {
          removePlaylist(viewPlaylist.id);
          navigate('/library');
      }
  };

  const handleImport = () => {
      importPlaylist(viewPlaylist);
      alert('Playlist added to your library!');
  };

  const handleShare = () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
          setShareFeedback(true);
          setTimeout(() => setShareFeedback(false), 2000);
      }).catch(err => console.error("Failed to copy", err));
  };

  const handleAddSong = (song: Song) => {
      addSongToPlaylist(viewPlaylist.id, song);
      setSearchQuery(''); 
  };

  const imageUrl = getImageUrl(viewPlaylist.image);
  
  // Calculate duration
  const totalDurationSeconds = viewPlaylist.songs.reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0);
  const totalDurationHours = Math.floor(totalDurationSeconds / 3600);
  const totalDurationMinutes = Math.floor((totalDurationSeconds % 3600) / 60);

  return (
    <div className="min-h-full pb-32 bg-[#121212] relative isolate">
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#404040] via-[#282828] to-[#121212] -z-10 transition-colors duration-700"></div>

      {/* Sticky Header */}
      <div className={`sticky top-0 z-50 h-[64px] px-6 flex items-center justify-between transition-all duration-300 ${isScrolled ? 'bg-[#282828] shadow-lg border-b border-white/5' : 'bg-transparent border-transparent'}`}>
          <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors">
                 <ArrowLeft size={20} />
              </button>
              <span className={`font-bold text-lg text-white transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
                  {viewPlaylist.title}
              </span>
              {isScrolled && viewPlaylist.songs.length > 0 && (
                   <button 
                    onClick={() => playSong(viewPlaylist.songs[0], viewPlaylist.songs)}
                    className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center hover:scale-105 transition-transform text-black shadow-md"
                   >
                       {isPlaying && viewPlaylist.songs.some(s => s.id === currentSong?.id) ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-0.5" />}
                   </button>
              )}
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={handleShare}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${shareFeedback ? 'bg-green-500 border-green-500 text-black' : 'bg-black/20 hover:bg-white/10 text-white border-white/10'}`}
             >
                 {shareFeedback ? <Check size={14} strokeWidth={3} /> : <Share2 size={14} />}
                 <span className="hidden sm:block">{shareFeedback ? 'Copied' : 'Share'}</span>
             </button>
            {isMyPlaylist ? (
                <button onClick={handleDelete} className="w-9 h-9 rounded-full bg-black/20 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center text-white/70 transition-colors">
                    <Trash2 size={18} />
                </button>
            ) : (
                 <button onClick={handleImport} className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-bold text-xs md:text-sm hover:scale-105 transition-transform shadow-lg">
                    <Heart size={16} fill={userPlaylists.some(p => p.id === viewPlaylist.id) ? "black" : "none"} /> 
                    {userPlaylists.some(p => p.id === viewPlaylist.id) ? 'Saved' : 'Save'}
                </button>
            )}
          </div>
      </div>

      {/* Hero Content */}
      <div className="flex flex-col md:flex-row items-end gap-6 p-6 md:p-8 pt-2 pb-6">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-[190px] h-[190px] md:w-[230px] md:h-[230px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#282828] flex items-center justify-center overflow-hidden shrink-0 group rounded-md relative"
        >
             {viewPlaylist.image && (viewPlaylist.image[0].url.includes('unsplash') || viewPlaylist.image[0].url.includes('cloudinary')) ? (
                 <img src={imageUrl} alt={viewPlaylist.title} className="w-full h-full object-cover shadow-2xl" />
             ) : (
                 <div className="flex flex-col items-center gap-2">
                    <Music size={60} className="text-white/20" />
                 </div>
             )}
        </motion.div>
        <div className="flex flex-col gap-2 mb-2 w-full min-w-0">
            <span className="uppercase text-xs font-bold tracking-wider text-white hidden md:block">Playlist</span>
            <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-none break-words drop-shadow-sm line-clamp-2 py-2"
            >
                {viewPlaylist.title}
            </motion.h1>
            <p className="text-white/70 text-sm font-medium line-clamp-2 max-w-2xl">{viewPlaylist.description}</p>
            <div className="flex items-center flex-wrap gap-2 text-sm font-bold text-white mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#555] flex items-center justify-center text-[10px] text-white shadow-sm border border-black">
                         <User size={14} />
                    </div>
                    <span className="hover:underline cursor-pointer text-sm">{isMyPlaylist ? 'You' : (viewPlaylist.creator || 'User')}</span>
                </div>
                {viewPlaylist.songs.length > 0 && (
                    <>
                        <span className="text-white/60">•</span>
                        <span>{viewPlaylist.songs.length} songs,</span>
                        <span className="text-white/70 font-medium ml-1">
                            {totalDurationHours > 0 ? `${totalDurationHours} hr ` : ''}
                            {totalDurationMinutes} min
                        </span>
                    </>
                )}
            </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="px-6 md:px-8 py-4 flex items-center gap-6 backdrop-blur-sm sticky top-[64px] z-40">
         {viewPlaylist.songs.length > 0 && (
             <button 
                onClick={() => playSong(viewPlaylist.songs[0], viewPlaylist.songs)}
                className="w-14 h-14 bg-[#1DB954] hover:bg-[#1ed760] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
             >
                 {isPlaying && viewPlaylist.songs.some(s => s.id === currentSong?.id) ? (
                     <Pause size={28} fill="black" className="text-black" />
                 ) : (
                     <Play size={28} fill="black" className="ml-1 text-black" />
                 )}
             </button>
         )}
         <button className="text-white/50 hover:text-white transition-colors">
             <MoreHorizontal size={32} />
         </button>
      </div>

      {/* Songs List */}
      <div className="px-6 md:px-8 bg-[#121212]">
        
        {/* List Header */}
        {viewPlaylist.songs.length > 0 && (
            <div className="grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_1fr_1fr_auto] gap-4 px-4 py-2 border-b border-white/10 text-[#B3B3B3] text-sm font-medium uppercase tracking-wider sticky top-[130px] bg-[#121212] z-30">
                <span className="text-center">#</span>
                <span>Title</span>
                <span className="hidden md:block">Album</span>
                <div className="flex justify-end pr-4"><Clock3 size={16} /></div>
            </div>
        )}

        {/* Empty State */}
        {viewPlaylist.songs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-white/40 border-t border-white/5 mt-4">
                <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-6">
                    <Music size={32} className="opacity-50" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">It feels empty here</h3>
                <p className="max-w-xs text-center text-sm">Find songs you love to build your perfect playlist.</p>
            </div>
        )}
        
        <motion.div 
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col pb-8"
        >
            {viewPlaylist.songs.map((song, index) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                    <motion.div 
                        key={`${song.id}-${index}`}
                        variants={itemVariants}
                        onClick={() => playSong(song, viewPlaylist.songs)}
                        className={`group grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_1fr_1fr_auto] gap-4 items-center px-4 py-2 rounded-md cursor-pointer transition-colors ${isCurrent ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    >
                        {/* Index */}
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

                        {/* Title */}
                        <div className="flex items-center gap-3 overflow-hidden">
                            <img src={getImageUrl(song.image)} alt="" className="w-10 h-10 rounded-[4px] object-cover shadow-sm shrink-0" />
                            <div className="flex flex-col truncate">
                                <span className={`font-medium text-[15px] truncate ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>{song.name}</span>
                                <span className="text-xs text-[#B3B3B3] group-hover:text-white truncate transition-colors">{song.artists?.primary?.[0]?.name || "Unknown"}</span>
                            </div>
                        </div>

                        {/* Album */}
                        <span className="hidden md:block text-sm text-[#B3B3B3] truncate group-hover:text-white transition-colors">{song.album?.name || "Single"}</span>
                        
                        {/* Duration */}
                        <div className="flex items-center justify-end gap-3 min-w-[60px]">
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[#B3B3B3] hover:text-white hidden md:block" title="Save to Liked">
                                <Heart size={16} />
                            </button>
                            <span className="text-sm font-mono text-[#B3B3B3]">
                                {Math.floor(parseInt(song.duration) / 60)}:{(parseInt(song.duration) % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>

        {/* --- ADD SONGS SECTION --- */}
        {isMyPlaylist && (
            <div className="mt-4 mb-16 border-t border-white/10 pt-8">
                <div className="flex flex-col gap-4 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-white">Let's find something for your playlist</h2>
                    <div className="relative max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3B3B3]" />
                        <input 
                            type="text" 
                            placeholder="Search for songs" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#2A2A2A] text-white pl-10 pr-10 py-3 rounded-md focus:outline-none focus:bg-[#333] focus:ring-1 focus:ring-white/20 transition-all placeholder-[#B3B3B3] text-sm font-medium"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                 {isSearching ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <div className="text-white/50 hover:text-white">✕</div>}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    {searchResults.map((song) => {
                        const isAdded = viewPlaylist.songs.some(s => s.id === song.id);
                        return (
                            <div key={song.id} className="flex items-center justify-between p-2 hover:bg-[#2A2A2A] rounded-lg group transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <img src={getImageUrl(song.image)} className="w-10 h-10 object-cover rounded shadow-sm" alt="" />
                                    <div className="flex flex-col truncate">
                                        <span className="text-white font-medium text-sm truncate">{song.name}</span>
                                        <span className="text-[#B3B3B3] text-xs truncate">{song.artists?.primary?.[0]?.name}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => !isAdded && handleAddSong(song)}
                                    disabled={isAdded}
                                    className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${isAdded ? 'border-transparent text-white/50' : 'border-[#727272] text-white hover:border-white hover:scale-105'}`}
                                >
                                    {isAdded ? 'Added' : 'Add'}
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};