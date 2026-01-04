import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, ArrowLeft, X, PlusCircle, CheckCircle2, MoreVertical, TrendingUp, Music } from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { Song, Album, Artist } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { useNavigate } from 'react-router-dom';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<{ songs: Song[], albums: Album[], artists: Artist[] }>({ songs: [], albums: [], artists: [] });
  const { playSong, likedSongs, toggleLike } = usePlayerStore();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim()) {
        try {
           const [songs, albums, artists] = await Promise.all([
              api.searchSongs(query),
              api.searchAlbums(query),
              api.searchArtists(query)
           ]);

           setResults({ songs, albums, artists });

           // Generate real suggestions from data
           const newSuggestions = new Set<string>();
           
           // Priority 1: Exact matches in songs
           songs.slice(0, 2).forEach(s => newSuggestions.add(s.name));
           
           // Priority 2: Artists
           artists.slice(0, 2).forEach(a => newSuggestions.add(a.name));
           
           // Priority 3: Genre if available
           songs.forEach(s => {
               if(s.genre && !s.genre.includes('Unknown')) newSuggestions.add(s.genre);
           });

           // Priority 4: Contextual (Song by Artist)
           if (songs.length > 0) {
              const artistName = songs[0].artists?.primary?.[0]?.name;
              if (artistName) newSuggestions.add(`${songs[0].name} ${artistName}`);
           }

           setSuggestions(Array.from(newSuggestions).slice(0, 5));

        } catch (e) {
            console.error(e);
        }
      } else {
          setResults({ songs: [], albums: [], artists: [] });
          setSuggestions([]);
      }
    }, 300); 
    return () => clearTimeout(timer);
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setResults({ songs: [], albums: [], artists: [] });
  };

  const BrowseCard = ({ title, color, image }: { title: string, color: string, image?: string }) => (
    <div className={`aspect-[1.6/1] ${color} rounded-xl p-4 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-300 shadow-lg group`}>
        <h3 className="text-white font-bold text-lg relative z-10">{title}</h3>
        <div className="absolute -bottom-2 -right-3 w-20 h-20 bg-black/20 rounded shadow-2xl rotate-[25deg] group-hover:rotate-[30deg] transition-transform duration-300">
             {image && <img src={image} className="w-full h-full object-cover" alt="" />}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full pb-32">
      
      {/* Search Header */}
      <div className="sticky top-0 bg-[#050505]/90 backdrop-blur-md z-30 px-4 py-3 flex items-center gap-3 border-b border-white/5">
         <button onClick={() => navigate(-1)} className="text-white hover:bg-white/10 p-2 rounded-full transition-colors">
            <ArrowLeft size={24} />
         </button>
         <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <SearchIcon size={20} className="text-[#B3B3B3] group-focus-within:text-white transition-colors" />
            </div>
            <input 
              type="text"
              className="w-full bg-[#1A1A1A] text-white rounded-full py-3 pl-11 pr-10 focus:outline-none focus:bg-[#252525] focus:ring-1 focus:ring-white/20 placeholder-[#777] font-medium text-base transition-all shadow-inner"
              placeholder="What do you want to listen to?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-1">
                    <X size={18} />
                </button>
            )}
         </div>
      </div>

      {/* Default Browse View (Only if no query) */}
      {!query && (
         <div className="flex flex-col gap-8 p-4 pt-6">
            <section>
                <h2 className="text-white font-bold text-lg mb-4">Start browsing</h2>
                <div className="grid grid-cols-2 gap-4">
                    <BrowseCard title="Music" color="bg-gradient-to-br from-pink-600 to-purple-700" />
                    <BrowseCard title="Podcasts" color="bg-gradient-to-br from-teal-600 to-green-700" />
                    <BrowseCard title="Live Events" color="bg-gradient-to-br from-purple-600 to-indigo-700" />
                    <BrowseCard title="Home of I-Pop" color="bg-gradient-to-br from-blue-800 to-blue-900" />
                </div>
            </section>
            <section>
                 <h2 className="text-white font-bold text-lg mb-4">Discover something new</h2>
                 <div className="grid grid-cols-2 gap-4">
                     <BrowseCard title="Hindi" color="bg-gradient-to-br from-orange-600 to-red-700" />
                     <BrowseCard title="Punjabi" color="bg-gradient-to-br from-red-600 to-pink-700" />
                     <BrowseCard title="Tamil" color="bg-gradient-to-br from-yellow-600 to-orange-700" />
                     <BrowseCard title="Ghazals" color="bg-gradient-to-br from-indigo-600 to-blue-700" />
                 </div>
            </section>
         </div>
      )}

      {/* Search Results */}
      {query && (
        <div className="flex flex-col w-full pb-8">
            {/* Real Search Suggestions */}
            {suggestions.length > 0 && results.songs.length > 0 && (
                <div className="flex flex-col mb-4 pt-2">
                    {suggestions.map((suggestion, i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors" onClick={() => setQuery(suggestion)}>
                            <div className="w-8 h-8 flex items-center justify-center">
                                <SearchIcon size={18} className="text-[#B3B3B3]" />
                            </div>
                            <span className="text-white flex-1 text-base">{suggestion}</span>
                            <TrendingUp size={16} className="text-[#B3B3B3]" />
                        </div>
                    ))}
                </div>
            )}

            {/* Song Results List */}
            {results.songs.length > 0 && (
                <div className="mt-2">
                     <h2 className="px-4 text-white font-bold mb-3 text-xl">Songs</h2>
                     {results.songs.map(song => {
                         const isLiked = likedSongs.some(s => s.id === song.id);
                         // CRITICAL FIX: Safe access to artists
                         const artistName = song.artists?.primary?.[0]?.name || song.artists?.all?.[0]?.name || "Unknown Artist";
                         
                         return (
                             <div key={song.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer group transition-colors rounded-lg mx-2" onClick={() => playSong(song, results.songs)}>
                                 <div className="relative w-12 h-12 shrink-0">
                                    <img src={getImageUrl(song.image)} className="w-full h-full rounded-md object-cover shadow-sm group-hover:opacity-80 transition-opacity" alt="" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <Music size={16} className="text-white drop-shadow-md"/>
                                    </div>
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <div className={`font-medium truncate text-[15px] ${false ? 'text-[#1DB954]' : 'text-white'}`}>{song.name}</div>
                                     <div className="text-[#B3B3B3] text-sm truncate">Song • {artistName}</div>
                                 </div>
                                 
                                 {/* Actions */}
                                 <div className="flex items-center gap-4">
                                     <button 
                                        className="text-[#B3B3B3] hover:text-white transition-transform active:scale-90" 
                                        onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                                     >
                                        {isLiked ? (
                                            <CheckCircle2 size={24} className="text-[#1DB954] fill-[#1DB954] text-black" />
                                        ) : (
                                            <PlusCircle size={24} />
                                        )}
                                     </button>
                                     <button className="text-[#B3B3B3] hover:text-white" onClick={(e) => { e.stopPropagation(); /* Menu logic */ }}>
                                         <MoreVertical size={20} />
                                     </button>
                                 </div>
                             </div>
                         );
                     })}
                </div>
            )}
            
            {/* Albums Section */}
            {results.albums.length > 0 && (
                 <div className="mt-8">
                    <h2 className="px-4 text-white font-bold mb-3 text-xl">Albums</h2>
                    <div className="flex flex-col gap-1">
                    {results.albums.map(album => (
                        <div key={album.id} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 cursor-pointer rounded-lg mx-2 transition-colors" onClick={() => navigate(`/album/${album.id}`)}>
                            <img src={getImageUrl(album.image)} className="w-14 h-14 rounded-md object-cover shadow-sm" alt="" />
                            <div className="flex-1 min-w-0">
                                <div className="text-white font-medium truncate text-[15px]">{album.name}</div>
                                <div className="text-[#B3B3B3] text-sm truncate">Album • {album.artists?.primary?.[0]?.name || "Unknown Artist"}</div>
                            </div>
                        </div>
                    ))}
                    </div>
                 </div>
            )}
        </div>
      )}
    </div>
  );
};