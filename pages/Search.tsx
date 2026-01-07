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
  
  const { playSong, likedSongs, toggleLike, musicSource } = usePlayerStore();
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
              api.searchSongs(query, musicSource),
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
  }, [query, musicSource]);

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
             <button onClick={() => navigate(-1)} className="md:hidden text-white/70 hover:text-white">
                 <ArrowLeft size={24} />
             </button>
             <div className="relative flex-1">
                 <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-black/50" size={20} />
                 <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    placeholder="What do you want to listen to?" 
                    className="w-full bg-white text-black pl-10 pr-10 py-3 rounded-full font-medium placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-white transition-all shadow-md"
                    autoFocus
                 />
                 {query && (
                     <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black">
                         <X size={20} />
                     </button>
                 )}
             </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pt-4">
          
          {/* Default Browse Grid (When no search) */}
          {!query && (
              <div className="px-4 pb-8 animate-in fade-in duration-500">
                  <h2 className="text-white font-bold text-lg mb-4">Browse all</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {BROWSE_CATEGORIES.map((cat, idx) => (
                          <motion.div 
                              key={cat.title}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`${cat.color} h-[100px] md:h-[120px] rounded-lg p-4 relative overflow-hidden cursor-pointer shadow-lg`}
                              onClick={() => setQuery(cat.title)}
                          >
                              <span className="text-white font-bold text-lg md:text-xl absolute top-4 left-4 max-w-[70%] leading-tight">{cat.title}</span>
                              {/* Decorative rotated box */}
                              <div className="absolute -bottom-2 -right-4 w-20 h-20 bg-white/20 rotate-[25deg] rounded-md shadow-sm transform translate-x-2 translate-y-2"></div>
                          </motion.div>
                      ))}
                  </div>
              </div>
          )}

          {/* Search Suggestions (When typing but not loading results yet) */}
          {query && !isLoading && results.songs.length === 0 && results.artists.length === 0 && (
              <div className="px-4 text-center py-20 text-[#777]">
                  <p>No results found for "{query}"</p>
              </div>
          )}

          {/* Loading Skeletons */}
          {isLoading && (
              <div className="flex flex-col gap-2 pt-2">
                  <ResultSkeleton />
                  <ResultSkeleton />
                  <ResultSkeleton />
                  <ResultSkeleton />
                  <ResultSkeleton />
              </div>
          )}

          {/* Results List */}
          {(results.songs.length > 0 || results.artists.length > 0 || results.albums.length > 0) && (
              <motion.div 
                 variants={containerVariants}
                 initial="hidden"
                 animate="visible"
                 className="flex flex-col gap-8 pb-8"
              >
                  {/* Top Result (Best Match) */}
                  {results.artists.length > 0 && (
                      <div className="px-4">
                          <h2 className="text-white font-bold text-lg mb-4">Top Result</h2>
                          <motion.div 
                              variants={itemVariants}
                              onClick={() => navigate(`/artist/${results.artists[0].id}`, { state: { artist: results.artists[0] } })}
                              className="bg-[#181818] hover:bg-[#282828] p-5 rounded-xl flex flex-col items-start gap-4 transition-colors cursor-pointer group shadow-lg border border-white/5"
                          >
                              <img src={getImageUrl(results.artists[0].image)} className="w-24 h-24 rounded-full shadow-lg object-cover group-hover:scale-105 transition-transform" alt=""/>
                              <div className="flex flex-col gap-1">
                                  <h3 className="text-white font-bold text-2xl md:text-3xl">{results.artists[0].name}</h3>
                                  <div className="flex items-center gap-2">
                                      <span className="bg-[#121212] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Artist</span>
                                  </div>
                              </div>
                          </motion.div>
                      </div>
                  )}

                  {/* Songs Section */}
                  {results.songs.length > 0 && (
                      <div className="px-4">
                          <h2 className="text-white font-bold text-lg mb-2">Songs</h2>
                          <div className="flex flex-col">
                              {results.songs.map((song, i) => {
                                  const isLiked = likedSongs.some(s => s.id === song.id);
                                  return (
                                    <motion.div 
                                        key={song.id} 
                                        variants={itemVariants}
                                        onClick={() => playSong(song, results.songs)}
                                        className="group flex items-center gap-3 p-2 rounded-md hover:bg-[#2A2A2A] cursor-pointer transition-colors"
                                    >
                                        <div className="relative w-12 h-12 shrink-0">
                                            <img src={getImageUrl(song.image)} alt={song.name} className="w-full h-full object-cover rounded shadow-sm group-hover:opacity-60 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play size={20} fill="white" className="text-white" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className={`font-medium truncate ${isLiked ? 'text-[#1DB954]' : 'text-white'}`}>{song.name}</span>
                                            <span className="text-sm text-[#B3B3B3] truncate">{song.artists.primary[0]?.name}</span>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                                            className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {isLiked ? <CheckCircle2 size={20} className="text-[#1DB954]" /> : <PlusCircle size={20} className="text-[#B3B3B3] hover:text-white" />}
                                        </button>
                                        <div className="text-xs text-[#B3B3B3] font-mono w-10 text-right">
                                            {(parseInt(song.duration) / 60).toFixed(0)}:{(parseInt(song.duration) % 60).toString().padStart(2, '0')}
                                        </div>
                                    </motion.div>
                                  );
                              })}
                          </div>
                      </div>
                  )}

                  {/* Artists Section */}
                  {results.artists.length > 0 && (
                       <div className="px-4">
                           <h2 className="text-white font-bold text-lg mb-4">Artists</h2>
                           <div className="flex overflow-x-auto gap-4 no-scrollbar pb-4">
                               {results.artists.map(artist => (
                                   <motion.div 
                                       key={artist.id}
                                       variants={itemVariants}
                                       onClick={() => navigate(`/artist/${artist.id}`, { state: { artist } })}
                                       className="flex flex-col items-center gap-2 w-[120px] shrink-0 cursor-pointer group"
                                   >
                                       <div className="w-[120px] h-[120px] rounded-full overflow-hidden shadow-lg">
                                           <img src={getImageUrl(artist.image)} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                       </div>
                                       <span className="text-white font-bold text-center text-sm truncate w-full group-hover:underline">{artist.name}</span>
                                       <span className="text-[#B3B3B3] text-xs">Artist</span>
                                   </motion.div>
                               ))}
                           </div>
                       </div>
                  )}

                  {/* Albums Section */}
                  {results.albums.length > 0 && (
                       <div className="px-4">
                           <h2 className="text-white font-bold text-lg mb-4">Albums</h2>
                           <div className="flex overflow-x-auto gap-4 no-scrollbar pb-4">
                               {results.albums.map(album => (
                                   <motion.div 
                                       key={album.id}
                                       variants={itemVariants}
                                       onClick={() => navigate(`/album/${album.id}`)}
                                       className="flex flex-col gap-2 w-[140px] shrink-0 cursor-pointer group"
                                   >
                                       <div className="w-[140px] h-[140px] rounded-md overflow-hidden shadow-lg relative">
                                           <img src={getImageUrl(album.image)} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                       </div>
                                       <div className="flex flex-col">
                                            <span className="text-white font-bold text-sm truncate w-full group-hover:underline">{album.name}</span>
                                            <span className="text-[#B3B3B3] text-xs truncate">{album.year} • Album</span>
                                       </div>
                                   </motion.div>
                               ))}
                           </div>
                       </div>
                  )}

              </motion.div>
          )}
      </div>
    </div>
  );
};