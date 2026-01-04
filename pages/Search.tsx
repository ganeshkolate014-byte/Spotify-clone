import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, ArrowLeft, X, PlusCircle, CheckCircle2, MoreVertical, TrendingUp } from 'lucide-react';
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
              newSuggestions.add(`${songs[0].name} ${songs[0].artists.primary[0]?.name}`);
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
    <div className={`aspect-[1.6/1] ${color} rounded-lg p-3 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform`}>
        <h3 className="text-white font-bold text-lg relative z-10">{title}</h3>
        <div className="absolute -bottom-2 -right-3 w-16 h-16 bg-black/20 rounded shadow-lg rotate-[25deg]">
             {image && <img src={image} className="w-full h-full object-cover" alt="" />}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full pb-32 bg-black">
      
      {/* Search Header */}
      <div className="sticky top-0 bg-[#121212] z-20 px-4 py-3 flex items-center gap-3 shadow-md">
         <button onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft size={24} />
         </button>
         <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <SearchIcon size={20} className="text-[#B3B3B3]" />
            </div>
            <input 
              type="text"
              className="w-full bg-[#2A2A2A] text-white rounded-full py-2.5 pl-10 pr-10 focus:outline-none placeholder-[#777] font-medium text-base"
              placeholder="What do you want to listen to?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-white">
                    <X size={18} />
                </button>
            )}
         </div>
      </div>

      {/* Default Browse View (Only if no query) */}
      {!query && (
         <div className="flex flex-col gap-6 p-4">
            <section>
                <h2 className="text-white font-bold text-base mb-3">Start browsing</h2>
                <div className="grid grid-cols-2 gap-4">
                    <BrowseCard title="Music" color="bg-pink-600" />
                    <BrowseCard title="Podcasts" color="bg-teal-600" />
                    <BrowseCard title="Live Events" color="bg-purple-600" />
                    <BrowseCard title="Home of I-Pop" color="bg-blue-800" />
                </div>
            </section>
            <section>
                 <h2 className="text-white font-bold text-base mb-3">Discover something new</h2>
                 <div className="grid grid-cols-2 gap-4">
                     <BrowseCard title="Hindi" color="bg-orange-600" />
                     <BrowseCard title="Punjabi" color="bg-red-600" />
                     <BrowseCard title="Tamil" color="bg-yellow-600" />
                     <BrowseCard title="Ghazals" color="bg-indigo-600" />
                 </div>
            </section>
         </div>
      )}

      {/* Search Results */}
      {query && (
        <div className="flex flex-col w-full">
            {/* Real Search Suggestions */}
            {suggestions.length > 0 && results.songs.length > 0 && (
                <div className="flex flex-col mb-4">
                    {suggestions.map((suggestion, i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-[#1A1A1A] cursor-pointer" onClick={() => setQuery(suggestion)}>
                            <div className="w-8 h-8 flex items-center justify-center">
                                <SearchIcon size={18} className="text-[#B3B3B3]" />
                            </div>
                            <span className="text-white flex-1 text-sm">{suggestion}</span>
                            <TrendingUp size={16} className="text-[#B3B3B3]" />
                        </div>
                    ))}
                </div>
            )}

            {/* Song Results List */}
            {results.songs.length > 0 && (
                <div className="mt-0">
                     <h2 className="px-4 text-white font-bold mb-2 text-lg">Songs</h2>
                     {results.songs.map(song => {
                         const isLiked = likedSongs.some(s => s.id === song.id);
                         return (
                             <div key={song.id} className="flex items-center gap-3 px-4 py-2 hover:bg-[#1A1A1A] cursor-pointer group" onClick={() => playSong(song, results.songs)}>
                                 <img src={getImageUrl(song.image)} className="w-12 h-12 rounded-sm object-cover" alt="" />
                                 <div className="flex-1 min-w-0">
                                     <div className={`font-medium truncate ${false ? 'text-[#1DB954]' : 'text-white'}`}>{song.name}</div>
                                     <div className="text-[#B3B3B3] text-xs truncate">Song • {song.artists.primary[0].name}</div>
                                 </div>
                                 
                                 {/* Actions */}
                                 <div className="flex items-center gap-4">
                                     <button 
                                        className="text-[#B3B3B3] hover:text-white" 
                                        onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                                     >
                                        {isLiked ? (
                                            <CheckCircle2 size={24} className="text-[#1DB954] fill-[#1DB954] text-black" />
                                        ) : (
                                            <PlusCircle size={24} />
                                        )}
                                     </button>
                                     <button className="text-[#B3B3B3]" onClick={(e) => { e.stopPropagation(); /* Menu logic */ }}>
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
                 <div className="mt-6">
                    <h2 className="px-4 text-white font-bold mb-2 text-lg">Albums</h2>
                    {results.albums.map(album => (
                        <div key={album.id} className="flex items-center gap-3 px-4 py-2 hover:bg-[#1A1A1A] cursor-pointer" onClick={() => navigate(`/album/${album.id}`)}>
                            <img src={getImageUrl(album.image)} className="w-12 h-12 rounded-sm object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                                <div className="text-white font-medium truncate">{album.name}</div>
                                <div className="text-[#B3B3B3] text-xs truncate">Album • {album.artists.primary[0]?.name}</div>
                            </div>
                        </div>
                    ))}
                 </div>
            )}
        </div>
      )}
    </div>
  );
};