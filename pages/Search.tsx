import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, ArrowLeft, X, Loader2, Play, CheckCircle2, PlusCircle, ArrowUpLeft, MoreVertical } from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { Song, Album, Artist } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const BROWSE_CATEGORIES = [
  { title: "Podcasts", color: "bg-[#006450]" },
  { title: "Live Events", color: "bg-[#8400E7]" },
  { title: "Made For You", color: "bg-[#1E3264]" },
  { title: "New Releases", color: "bg-[#E8115B]" },
  { title: "Hindi", color: "bg-[#E13300]" },
  { title: "Punjabi", color: "bg-[#B02897]" },
  { title: "Tamil", color: "bg-[#503750]" },
  { title: "Charts", color: "bg-[#8D67AB]" },
  { title: "Pop", color: "bg-[#148A08]" },
  { title: "Indie", color: "bg-[#E91429]" },
  { title: "Trending", color: "bg-[#B02897]" },
  { title: "Love", color: "bg-[#FF0090]" },
  { title: "Discover", color: "bg-[#8D67AB]" },
  { title: "Radio", color: "bg-[#7358FF]" },
  { title: "Mood", color: "bg-[#E1118C]" },
  { title: "Party", color: "bg-[#537AA1]" },
  { title: "Devotional", color: "bg-[#148A08]" },
  { title: "Decades", color: "bg-[#BA5D07]" },
  { title: "Hip-Hop", color: "bg-[#BC5900]" },
  { title: "Dance / Electronic", color: "bg-[#D84000]" },
  { title: "Student", color: "bg-[#AF2896]" },
  { title: "Chill", color: "bg-[#D84000]" },
  { title: "Gaming", color: "bg-[#E8115B]" },
  { title: "K-Pop", color: "bg-[#148A08]" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ songs: Song[], albums: Album[], artists: Artist[] }>({ songs: [], albums: [], artists: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  
  const { playSong, likedSongs, toggleLike } = usePlayerStore();
  const navigate = useNavigate();

  // AbortController to handle race conditions
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any ongoing fetch if query changes
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }

    if (!query.trim()) {
        setResults({ songs: [], albums: [], artists: [] });
        setSuggestions([]);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);

    const timer = setTimeout(async () => {
        abortControllerRef.current = new AbortController();
        try {
           const [songs, albums, artists] = await Promise.all([
              api.searchSongs(query),
              api.searchAlbums(query),
              api.searchArtists(query)
           ]);

           // Only update if not aborted
           if (!abortControllerRef.current?.signal.aborted) {
               setResults({ songs, albums, artists });
               
               // Generate Related Keywords from results
               const rawTitles = songs.map(s => s.name.toLowerCase());
               const artistNames = artists.slice(0, 2).map(a => a.name.toLowerCase());
               
               const derivedSuggestions = Array.from(new Set([
                   query.toLowerCase(), 
                   ...rawTitles.filter(t => t.includes(query.toLowerCase()) && t !== query.toLowerCase()),
                   ...artistNames,
                   ...rawTitles
               ])).slice(0, 4); 

               setSuggestions(derivedSuggestions);
           }
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                console.error(e);
            }
        } finally {
            if (!abortControllerRef.current?.signal.aborted) {
                setIsLoading(false);
            }
        }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setResults({ songs: [], albums: [], artists: [] });
    setSuggestions([]);
    setIsLoading(false);
  };

  const ResultSkeleton = () => (
      <div className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
          <div className="w-12 h-12 bg-white/10 rounded-md shrink-0"></div>
          <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
              <div className="h-3 bg-white/5 rounded w-1/4"></div>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col min-h-full pb-32 bg-black">
      
      {/* Search Header */}
      <div className="sticky top-0 bg-[#121212] z-30 px-4 py-3 border-b border-white/5 transition-colors duration-300">
         <div className="flex items-center gap-3">
             <button onClick={() => navigate(-1)} className="text-white hover:bg-white/10 p-2 rounded-full transition-colors active:scale-95 md:hidden">
                <ArrowLeft size={24} />
             </button>
             
             {/* Premium Search Bar */}
             <div className={`flex-1 relative group transition-all duration-300 ease-out ${isFocused ? 'scale-[1.01]' : 'scale-100'}`}>
                {/* Search Icon */}
                <div className={`absolute inset-y-0 left-3.5 flex items-center pointer-events-none transition-colors duration-300 ${isFocused ? 'text-white' : 'text-[#777]'}`}>
                     <SearchIcon size={20} />
                </div>
                
                {/* Input Field */}
                <input 
                  type="text"
                  className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#1f1f1f] text-white rounded-full py-3 pl-11 pr-11 outline-none border border-transparent focus:border-white/10 focus:shadow-[0_0_20px_rgba(255,255,255,0.03)] placeholder-[#777] font-medium text-[16px] transition-all duration-300 ease-out"
                  placeholder="What do you want to listen to?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  autoFocus={false}
                />
                
                {/* Clear / Loading Action */}
                {(query || isLoading) && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                         {isLoading ? (
                             <Loader2 size={18} className="text-[#1DB954] animate-spin" />
                         ) : (
                             <button onClick={clearSearch} className="text-[#777] hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                                 <X size={18} />
                             </button>
                         )}
                    </div>
                )}
             </div>
         </div>
      </div>
      
      {/* Browse All (Initial State) */}
      {!query && (
         <div className="p-4">
             <h2 className="text-white font-bold text-lg mb-4">Browse all</h2>
             <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"
             >
                 {BROWSE_CATEGORIES.map((cat, idx) => (
                     <motion.div 
                        key={idx} 
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`${cat.color} aspect-[1.6/1] rounded-lg p-4 relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
                        onClick={() => setQuery(cat.title)} 
                     >
                         <h3 className="text-white font-bold text-xl md:text-2xl break-words max-w-[80%] relative z-10 leading-tight">
                            {cat.title}
                         </h3>
                         <div className="absolute -bottom-2 -right-4 w-20 h-20 bg-black/20 rotate-[25deg] shadow-lg rounded-md flex items-center justify-center">
                         </div>
                     </motion.div>
                 ))}
             </motion.div>
         </div>
      )}

      {/* Loading State Skeleton */}
      {isLoading && !results.songs.length && (
          <div className="flex flex-col w-full pt-2">
              {[1,2,3,4,5].map(i => <ResultSkeleton key={i} />)}
          </div>
      )}

      {/* Results */}
      {query && (
        <div className="flex flex-col w-full pb-8">
            
            {/* 1. Related Keywords (Suggestions) */}
            {suggestions.length > 0 && (
                <div className="flex flex-col mb-2">
                    {suggestions.map((suggestion, idx) => (
                        <div 
                            key={idx}
                            onClick={() => setQuery(suggestion)}
                            className="flex items-center justify-between px-4 py-3.5 hover:bg-[#1A1A1A] active:bg-[#222] cursor-pointer transition-colors border-b border-white/5 last:border-0"
                        >
                            <div className="flex items-center gap-4">
                                <SearchIcon size={20} className="text-[#B3B3B3]" />
                                <span className="text-white text-[15px]">{suggestion}</span>
                            </div>
                            <ArrowUpLeft size={18} className="text-[#555] rotate-45" />
                        </div>
                    ))}
                </div>
            )}

            {/* 2. Songs List */}
            {results.songs.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 delay-75">
                     {/* REMOVED SLICE TO SHOW ALL SONGS */}
                     {results.songs.map((song) => {
                         const isLiked = likedSongs.some(s => s.id === song.id);
                         const artistName = song.artists?.primary?.[0]?.name || "Unknown";
                         
                         return (
                             <div 
                                key={song.id} 
                                className="flex items-center gap-3 px-4 py-2 hover:bg-[#1A1A1A] cursor-pointer group transition-colors" 
                                onClick={() => playSong(song, results.songs)}
                             >
                                 <div className="w-12 h-12 shrink-0 relative">
                                    <img src={getImageUrl(song.image)} className="w-full h-full rounded-[4px] object-cover" alt="" />
                                 </div>
                                 <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                     <div className={`font-medium truncate text-[16px] text-white ${isLiked ? 'text-[#1DB954]' : ''}`}>{song.name}</div>
                                     <div className="text-[#B3B3B3] text-sm truncate flex items-center gap-1">
                                        {song.name.toLowerCase().includes('explicit') && (
                                            <span className="bg-[#B3B3B3] text-black text-[9px] px-1 rounded-[2px] font-bold">E</span>
                                        )}
                                        <span>Song • {artistName}</span>
                                     </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-4">
                                     <button 
                                        className="text-[#B3B3B3] hover:text-white transition-transform active:scale-90" 
                                        onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                                     >
                                        {isLiked ? (
                                            <CheckCircle2 size={22} className="text-[#1DB954] fill-[#1DB954] text-black" />
                                        ) : (
                                            <PlusCircle size={22} />
                                        )}
                                     </button>
                                     <button className="text-[#B3B3B3] hover:text-white" onClick={(e) => e.stopPropagation()}>
                                         <MoreVertical size={20} />
                                     </button>
                                 </div>
                             </div>
                         );
                     })}
                </div>
            )}
            
            {/* No Results */}
            {!isLoading && results.songs.length === 0 && suggestions.length === 0 && (
                <div className="flex flex-col items-center justify-center pt-20 text-[#777]">
                    <div className="w-20 h-20 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-4">
                        <SearchIcon size={40} className="opacity-50"/>
                    </div>
                    <h3 className="text-white font-bold text-lg">No results found</h3>
                    <p className="text-sm mt-2">Try searching for a different song or artist.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};