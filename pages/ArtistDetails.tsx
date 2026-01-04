import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../services/api';
import { Artist, Song } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { Play, Pause, Music2, Share2, CheckCircle2, PlusCircle, BarChart2 } from 'lucide-react';

export const ArtistDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(location.state?.artist || null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(!artist);
  const { playSong, currentSong, isPlaying, togglePlay, likedSongs, toggleLike } = usePlayerStore();

  useEffect(() => {
    const fetchData = async () => {
      let currentArtist = artist;

      // 1. Fetch Artist Info if not passed in state (e.g., via direct link)
      if (!currentArtist && id) {
        try {
           // Since we don't have a direct "getArtistById", we search by ID assuming it might match, 
           // or we have to rely on the user having clicked from search. 
           // Fallback: This API behaves oddly with IDs in search, so we might not find it perfectly. 
           // We will try to search for the ID as a string, but ideally, we need the name.
           // For this demo, if state is missing, we redirect to search because of API limitations.
           const results = await api.searchArtists(id);
           if (results.length > 0) {
             currentArtist = results[0];
             setArtist(currentArtist);
           }
        } catch (e) {
           console.error("Failed to fetch artist", e);
        }
      }

      // 2. Fetch Songs (Top Tracks)
      if (currentArtist) {
        setLoading(true);
        try {
            // Fetch top songs by this artist
            const trackResults = await api.searchSongs(currentArtist.name);
            setSongs(trackResults);
        } catch (e) {
            console.error("Failed to fetch artist songs", e);
        } finally {
            setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, artist]);

  if (loading) {
     return <div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!artist) {
      return (
          <div className="flex flex-col items-center justify-center h-full gap-4">
              <span className="text-secondary">Artist not found.</span>
              <button onClick={() => navigate('/search')} className="px-4 py-2 bg-white text-black rounded-full text-sm font-bold">Go to Search</button>
          </div>
      );
  }

  const imageUrl = getImageUrl(artist.image);

  return (
    <div className="min-h-full pb-32 bg-[#050505] text-white">
        
        {/* Custom Layout: Split View / Magazine Style */}
        <div className="flex flex-col lg:flex-row h-full">
            
            {/* Left Column: Artist Identity Card */}
            <div className="lg:w-[400px] lg:h-[calc(100vh-100px)] lg:sticky lg:top-4 p-4 shrink-0 z-10">
                <div className="bg-[#121212] h-full rounded-2xl overflow-hidden relative border border-white/5 flex flex-col shadow-2xl">
                    {/* Background Image with Tint */}
                    <div className="absolute inset-0 z-0">
                        <img src={imageUrl} className="w-full h-full object-cover opacity-60 grayscale-[30%]" alt={artist.name} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent"></div>
                    </div>

                    {/* Artist Content */}
                    <div className="relative z-10 mt-auto p-6 flex flex-col gap-2">
                         <div className="flex items-center gap-2 mb-2">
                             <div className="px-2 py-0.5 border border-white/40 rounded-full text-[10px] uppercase tracking-wider font-medium backdrop-blur-md">Verified Artist</div>
                             <div className="px-2 py-0.5 bg-blue-600 rounded-full text-[10px] uppercase tracking-wider font-bold text-white">Trending</div>
                         </div>
                         <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.9]">{artist.name}</h1>
                         <p className="text-white/60 text-sm font-mono mt-2">ID: {artist.id.substring(0, 8)}...</p>
                         
                         <div className="mt-6 flex gap-3">
                             <button 
                                onClick={() => songs.length > 0 && playSong(songs[0], songs)}
                                className="flex-1 bg-white text-black h-12 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors uppercase tracking-wide text-sm"
                             >
                                 <Play size={18} fill="black" /> Play Latest
                             </button>
                             <button className="w-12 h-12 border border-white/20 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                                 <Share2 size={20} />
                             </button>
                         </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Discography & Tracks */}
            <div className="flex-1 p-4 lg:p-6 lg:pl-0">
                {/* Stats / Info Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                     <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5">
                         <span className="text-secondary text-xs uppercase tracking-wider font-mono">Monthly Listeners</span>
                         <div className="text-xl font-bold mt-1">12.4M</div>
                     </div>
                     <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5">
                         <span className="text-secondary text-xs uppercase tracking-wider font-mono">Global Rank</span>
                         <div className="text-xl font-bold mt-1">#42</div>
                     </div>
                     <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 col-span-2 flex items-center justify-between">
                          <div>
                            <span className="text-secondary text-xs uppercase tracking-wider font-mono">Latest Release</span>
                            <div className="text-base font-bold mt-1 truncate max-w-[150px]">{songs[0]?.name || 'N/A'}</div>
                          </div>
                          <Music2 className="text-white/20" size={32} />
                     </div>
                </div>

                {/* Top Tracks Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <BarChart2 size={20} className="text-blue-500"/>
                            Top Tracks
                        </h2>
                        <button className="text-xs text-secondary hover:text-white uppercase font-bold tracking-wide">View Discography</button>
                    </div>

                    <div className="flex flex-col gap-2">
                        {songs.length === 0 ? (
                            <div className="text-secondary p-4 italic">No tracks found.</div>
                        ) : (
                            songs.map((song, index) => {
                                const isCurrent = currentSong?.id === song.id;
                                const isSongLiked = likedSongs.some(s => s.id === song.id);

                                return (
                                    <div 
                                        key={song.id}
                                        onClick={() => playSong(song, songs)}
                                        className={`group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border border-transparent ${isCurrent ? 'bg-[#222] border-blue-500/50' : 'hover:bg-[#1A1A1A] hover:border-white/5'}`}
                                    >
                                        <div className="w-8 text-center text-secondary font-mono text-sm group-hover:hidden">
                                            {index + 1}
                                        </div>
                                        <div className="w-8 hidden group-hover:flex items-center justify-center">
                                            {isCurrent && isPlaying ? (
                                                <Pause size={16} fill="white" />
                                            ) : (
                                                <Play size={16} fill="white" />
                                            )}
                                        </div>

                                        <img src={getImageUrl(song.image)} className="w-12 h-12 rounded-md object-cover shadow-sm" alt="" />

                                        <div className="flex-1 min-w-0">
                                            <div className={`font-bold truncate text-base ${isCurrent ? 'text-blue-400' : 'text-white'}`}>
                                                {song.name}
                                            </div>
                                            <div className="text-xs text-secondary truncate font-mono mt-0.5">
                                                {(parseInt(song.duration) / 60).toFixed(0)}:{(parseInt(song.duration) % 60).toString().padStart(2, '0')} • {song.year || '2024'}
                                            </div>
                                        </div>

                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                                            className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {isSongLiked ? (
                                                <CheckCircle2 size={20} className="text-blue-500" />
                                            ) : (
                                                <PlusCircle size={20} className="text-secondary hover:text-white" />
                                            )}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};