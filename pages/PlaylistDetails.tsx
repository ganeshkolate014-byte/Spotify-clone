import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { getImageUrl, api } from '../services/api';
import { Play, Pause, Clock3, MoreHorizontal, Trash2, Music, ArrowLeft, Search, Plus, CheckCircle2 } from 'lucide-react';
import { Song } from '../types';

export const PlaylistDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userPlaylists, playSong, currentSong, isPlaying, removePlaylist, addSongToPlaylist } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const playlist = userPlaylists.find(p => p.id === id);

  // Debounced Search for "Add Songs"
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
           const songs = await api.searchSongs(searchQuery);
           setSearchResults(songs.slice(0, 5));
        } catch (e) {
           console.error(e);
        } finally {
            setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500); 
    return () => clearTimeout(timer);
  }, [searchQuery]);


  if (!playlist) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-white">
              <h2 className="text-2xl font-bold mb-4">Playlist not found</h2>
              <button onClick={() => navigate('/library')} className="px-6 py-2 bg-white text-black rounded-full font-bold">Back to Library</button>
          </div>
      );
  }

  const handleDelete = () => {
      if (window.confirm("Are you sure you want to delete this playlist?")) {
          removePlaylist(playlist.id);
          navigate('/library');
      }
  };

  const handleAddSong = (song: Song) => {
      addSongToPlaylist(playlist.id, song);
      // Optional: Visual feedback or toast could go here
  };

  const imageUrl = getImageUrl(playlist.image);

  return (
    <div className="min-h-full pb-32 bg-[#121212] relative">
      {/* Background Gradient based on playlist */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#404040] to-[#121212] -z-10 opacity-60"></div>

      {/* Header */}
      <div className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between bg-transparent transition-colors">
          <button 
            onClick={() => navigate(-1)} 
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white backdrop-blur-md"
          >
             <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <button 
                onClick={handleDelete}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-red-500/80 flex items-center justify-center text-white backdrop-blur-md transition-colors"
                title="Delete Playlist"
            >
                <Trash2 size={16} />
            </button>
          </div>
      </div>

      {/* Playlist Hero */}
      <div className="flex flex-col md:flex-row items-end gap-6 p-6 md:p-8 -mt-10">
        <div className="w-[190px] h-[190px] md:w-[230px] md:h-[230px] shadow-[0_30px_60px_rgba(0,0,0,0.5)] bg-[#282828] flex items-center justify-center overflow-hidden shrink-0 group rounded-md">
             {playlist.image && (playlist.image[0].url.includes('unsplash') || playlist.image[0].url.includes('cloudinary')) ? (
                 <img src={imageUrl} alt={playlist.title} className="w-full h-full object-cover shadow-2xl" />
             ) : (
                 <Music size={80} className="text-white/20" />
             )}
        </div>
        <div className="flex flex-col gap-2 mb-2 w-full">
            <span className="uppercase text-xs font-bold tracking-wider text-white">Playlist</span>
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tight text-white leading-none break-words line-clamp-2 drop-shadow-lg">{playlist.title}</h1>
            <p className="text-white/70 text-sm mt-2 line-clamp-2 font-medium">{playlist.description}</p>
            <div className="flex items-center flex-wrap gap-2 text-sm font-bold text-white mt-2">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] text-black">U</div>
                <span className="cursor-pointer hover:underline">User</span>
                <span className="text-white/60">• {playlist.songs.length} songs</span>
            </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="px-6 md:px-8 py-6 flex items-center gap-8 bg-gradient-to-b from-black/20 to-[#121212]">
         {playlist.songs.length > 0 && (
             <button 
                onClick={() => playSong(playlist.songs[0], playlist.songs)}
                className="bg-[#1DB954] hover:bg-[#1ed760] rounded-full p-4 hover:scale-105 transition-transform flex items-center justify-center shadow-lg group"
             >
                 {isPlaying && playlist.songs.some(s => s.id === currentSong?.id) ? (
                     <Pause size={28} fill="black" className="text-black" />
                 ) : (
                     <Play size={28} fill="black" className="ml-1 text-black" />
                 )}
             </button>
         )}
         <button className="text-white/60 hover:text-white transition-colors">
             <MoreHorizontal size={32} />
         </button>
      </div>

      {/* Songs List */}
      <div className="px-6 md:px-8 min-h-[200px] bg-[#121212]">
        {playlist.songs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/50 border-t border-white/5">
                <Music size={48} className="mb-4 opacity-30" />
                <p>Playlist is empty</p>
            </div>
        ) : (
            <div className="flex flex-col">
                 <div className="grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_1fr_1fr_auto] gap-4 text-[#B3B3B3] text-sm border-b border-[#282828] pb-2 mb-2 px-4 uppercase tracking-wider font-medium sticky top-16 bg-[#121212] z-10">
                    <span className="text-center">#</span>
                    <span>Title</span>
                    <span className="hidden md:block">Album</span>
                    <div className="flex justify-end"><Clock3 size={16} /></div>
                </div>
                {playlist.songs.map((song, index) => {
                    const isCurrent = currentSong?.id === song.id;
                    return (
                        <div 
                            key={`${song.id}-${index}`}
                            onClick={() => playSong(song, playlist.songs)}
                            className={`group grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_1fr_1fr_auto] gap-4 items-center px-4 py-2 hover:bg-[#2a2a2a] rounded-md cursor-pointer transition-colors ${isCurrent ? 'bg-white/10' : ''}`}
                        >
                            <span className={`text-sm font-mono flex justify-center items-center ${isCurrent ? 'text-[#1DB954]' : 'text-[#B3B3B3] group-hover:text-white'}`}>
                                <span className={`${isCurrent ? 'hidden' : 'group-hover:hidden'}`}>{index + 1}</span>
                                <Play size={12} fill="currentColor" className={`${isCurrent ? 'hidden' : 'hidden group-hover:block'}`} />
                                {isCurrent && <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" className="h-3 w-3" alt="playing"/>}
                            </span>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <img src={getImageUrl(song.image)} alt="" className="w-10 h-10 rounded object-cover" />
                                <div className="flex flex-col truncate">
                                    <span className={`font-medium text-base truncate ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>{song.name}</span>
                                    <span className="text-xs text-[#B3B3B3] group-hover:text-white truncate">{song.artists?.primary?.[0]?.name || "Unknown"}</span>
                                </div>
                            </div>
                            <span className="hidden md:block text-sm text-[#B3B3B3] truncate group-hover:text-white">{song.album?.name || "Single"}</span>
                            <div className="flex justify-end text-sm font-mono text-[#B3B3B3] group-hover:text-white">
                                {Math.floor(parseInt(song.duration) / 60)}:{(parseInt(song.duration) % 60).toString().padStart(2, '0')}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* --- ADD SONGS SECTION --- */}
        <div className="mt-12 mb-8 pt-8 border-t border-white/10">
            <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-white">Let's find something for your playlist</h2>
                <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search size={20} className="text-[#B3B3B3]" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search for songs" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-1/2 bg-[#2A2A2A] text-white pl-10 pr-4 py-3 rounded-md focus:outline-none focus:bg-[#333] transition-colors placeholder-[#B3B3B3]"
                    />
                    {isSearching && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                </div>
            </div>

            {/* Results */}
            <div className="mt-6 flex flex-col gap-1">
                {searchResults.map((song) => {
                     const isAdded = playlist.songs.some(s => s.id === song.id);
                     return (
                        <div key={song.id} className="flex items-center justify-between p-3 hover:bg-[#2A2A2A] rounded-md group transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <img src={getImageUrl(song.image)} className="w-12 h-12 object-cover rounded" alt="" />
                                <div className="flex flex-col truncate">
                                    <span className="text-white font-medium truncate">{song.name}</span>
                                    <span className="text-[#B3B3B3] text-sm truncate">{song.artists?.primary?.[0]?.name}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => !isAdded && handleAddSong(song)}
                                className={`px-4 py-1.5 rounded-full border text-sm font-bold transition-all ${isAdded ? 'border-green-500 text-green-500 cursor-default' : 'border-[#727272] text-white hover:border-white hover:scale-105'}`}
                            >
                                {isAdded ? 'Added' : 'Add'}
                            </button>
                        </div>
                     )
                })}
            </div>
        </div>
      </div>
    </div>
  );
};