import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../services/api';
import { Artist, Song } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { Play, Pause, Share2, CheckCircle2, PlusCircle, ArrowLeft, MoreHorizontal, Shuffle } from 'lucide-react';

export const ArtistDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(location.state?.artist || null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(!artist);
  const { playSong, currentSong, isPlaying, toggleLike, likedSongs } = usePlayerStore();

  // Scroll effect state
  const [scrollOpen, setScrollOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
        const scrolled = window.scrollY > 200;
        if (scrolled !== scrollOpen) setScrollOpen(scrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollOpen]);

  useEffect(() => {
    const fetchData = async () => {
      let currentArtist = artist;

      if (!currentArtist && id) {
        try {
           const results = await api.searchArtists(id);
           if (results.length > 0) {
             currentArtist = results[0];
             setArtist(currentArtist);
           }
        } catch (e) {
           console.error("Failed to fetch artist", e);
        }
      }

      if (currentArtist) {
        setLoading(true);
        try {
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
     return <div className="flex h-screen w-full items-center justify-center bg-black"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!artist) {
      return (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-white">
              <span className="text-secondary">Artist not found.</span>
              <button onClick={() => navigate('/search')} className="px-6 py-3 bg-white text-black rounded-full text-sm font-bold hover:scale-105 transition-transform">Go to Search</button>
          </div>
      );
  }

  const imageUrl = getImageUrl(artist.image);

  return (
    <div className="min-h-full pb-32 bg-[#050505] text-white relative">
        
        {/* Mobile Top Bar (Sticky) */}
        <div className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrollOpen ? 'bg-[#050505]/90 backdrop-blur-md border-b border-white/5 py-3' : 'bg-transparent py-4'}`}>
            <div className="flex items-center justify-between px-4">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors text-white">
                    <ArrowLeft size={22} />
                </button>
                <span className={`font-bold text-lg transition-opacity duration-300 ${scrollOpen ? 'opacity-100' : 'opacity-0'}`}>
                    {artist.name}
                </span>
                <button className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors text-white">
                    <MoreHorizontal size={22} />
                </button>
            </div>
        </div>

        {/* Hero Section */}
        <div className="relative w-full h-[45vh] lg:h-[55vh] overflow-hidden group">
            <div className="absolute inset-0 bg-gray-900 animate-pulse"></div>
            <img 
                src={imageUrl} 
                alt={artist.name} 
                className="w-full h-full object-cover object-top lg:object-center transition-transform duration-700 group-hover:scale-105" 
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-[#050505]"></div>
            
            {/* Artist Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10 flex flex-col items-start gap-2 lg:gap-4 pb-12">
                 <div className="flex items-center gap-2">
                     <CheckCircle2 size={18} className="text-blue-400 fill-black bg-black rounded-full" />
                     <span className="text-sm font-medium tracking-wide uppercase text-white/90">Verified Artist</span>
                 </div>
                 <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white drop-shadow-2xl leading-[0.9]">
                     {artist.name}
                 </h1>
                 <p className="text-white/70 font-medium text-sm lg:text-base mt-2">
                     12,405,392 monthly listeners
                 </p>
            </div>
        </div>

        {/* Action Buttons & Content */}
        <div className="px-4 lg:px-10 -mt-6 relative z-10">
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => songs.length > 0 && playSong(songs[0], songs)}
                    className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-[0_8px_24px_rgba(29,185,84,0.3)]"
                >
                    {isPlaying && currentSong?.artists?.primary?.[0]?.name === artist.name ? (
                        <Pause size={28} fill="black" className="text-black" />
                    ) : (
                        <Play size={28} fill="black" className="text-black ml-1" />
                    )}
                </button>
                <button className="px-4 py-2 rounded-full border border-white/30 font-bold text-sm hover:border-white hover:bg-white/5 transition-all">
                    Follow
                </button>
                <button className="text-white/60 hover:text-white transition-colors">
                    <MoreHorizontal size={28} />
                </button>
                <div className="flex-1"></div>
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors lg:hidden">
                     <Shuffle size={20} className="text-[#1DB954]" />
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
                {/* Popular Songs List */}
                <div className="flex-1">
                    <h2 className="text-xl font-bold mb-4">Popular</h2>
                    <div className="flex flex-col">
                        {songs.length === 0 ? (
                            <div className="text-secondary py-8 text-center italic">No tracks available right now.</div>
                        ) : (
                            songs.map((song, index) => {
                                const isCurrent = currentSong?.id === song.id;
                                const isSongLiked = likedSongs.some(s => s.id === song.id);

                                return (
                                    <div 
                                        key={song.id}
                                        onClick={() => playSong(song, songs)}
                                        className={`group flex items-center gap-4 p-3 -mx-3 rounded-lg cursor-pointer transition-colors ${isCurrent ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                    >
                                        <div className="w-6 text-center text-sm font-mono text-secondary group-hover:hidden">
                                            {index + 1}
                                        </div>
                                        <div className="w-6 hidden group-hover:flex items-center justify-center">
                                            <Play size={14} fill="white" />
                                        </div>

                                        <img src={getImageUrl(song.image)} className="w-12 h-12 rounded-md object-cover shadow-sm" alt="" />

                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium truncate text-[15px] ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>
                                                {song.name}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-secondary mt-0.5">
                                                {song.downloadUrl?.some(u => u.quality.includes('320')) && (
                                                    <span className="bg-white/20 text-white px-1 rounded-[2px] text-[8px] font-bold">E</span>
                                                )}
                                                <span>{song.artists.primary.length > 0 ? song.artists.primary[0].name : artist.name}</span>
                                            </div>
                                        </div>

                                        <div className="text-xs text-secondary font-mono mr-2 hidden md:block">
                                            {(parseInt(song.duration) / 60).toFixed(0)}:{(parseInt(song.duration) % 60).toString().padStart(2, '0')}
                                        </div>

                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                                            className={`p-2 transition-transform active:scale-90 ${isSongLiked ? 'text-[#1DB954]' : 'text-secondary hover:text-white'}`}
                                        >
                                            {isSongLiked ? <CheckCircle2 size={20} /> : <PlusCircle size={20} />}
                                        </button>
                                        
                                        <button onClick={(e) => e.stopPropagation()} className="text-secondary hover:text-white">
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Sidebar Info (Desktop Only) */}
                <div className="hidden lg:block w-[350px] shrink-0">
                    <h2 className="text-xl font-bold mb-4">About</h2>
                    <div className="bg-[#181818] rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 cursor-pointer group relative h-[400px]">
                        <img src={imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="" />
                        <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black via-transparent to-transparent">
                             <div className="text-2xl font-bold mb-2">12,405,392</div>
                             <div className="text-sm font-medium text-white/70 mb-4">Monthly Listeners</div>
                             <p className="line-clamp-3 text-sm text-white/80">
                                 Detailed biography of the artist goes here. It provides insights into their journey, style, and achievements in the music industry.
                             </p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Mobile About Section Preview */}
            <div className="mt-8 lg:hidden">
                <h2 className="text-xl font-bold mb-4">About</h2>
                <div className="bg-[#181818] rounded-xl p-4 flex gap-4 items-center">
                    <img src={imageUrl} className="w-20 h-20 rounded-full object-cover" alt="" />
                    <div>
                         <div className="font-bold text-lg">12.4M Listeners</div>
                         <p className="text-sm text-secondary line-clamp-2 mt-1">
                            The artist's bio usually appears here with more details about their background.
                         </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};