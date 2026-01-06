import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../services/api';
import { Artist, Song, Album } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { Play, Pause, CheckCircle2, PlusCircle, ArrowLeft, MoreHorizontal, Disc } from 'lucide-react';

export const ArtistDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(location.state?.artist || null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(!artist);
  const { playSong, currentSong, isPlaying, toggleLike, likedSongs } = usePlayerStore();

  const [scrollOpacity, setScrollOpacity] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
        const opacity = Math.min(window.scrollY / 200, 1);
        setScrollOpacity(opacity);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      let currentArtist = artist;

      // 1. Fetch Artist Info if not present
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

      // 2. Fetch Songs and Albums
      if (currentArtist) {
        setLoading(true);
        try {
            const [trackResults, albumResults] = await Promise.all([
                api.searchSongs(currentArtist.name),
                api.searchAlbums(currentArtist.name)
            ]);
            setSongs(trackResults);
            setAlbums(albumResults);
        } catch (e) {
            console.error("Failed to fetch artist details", e);
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
              <button onClick={() => navigate('/search')} className="px-6 py-3 bg-white text-black rounded-full text-sm font-bold">Go to Search</button>
          </div>
      );
  }

  const imageUrl = getImageUrl(artist.image);

  return (
    <div className="min-h-full pb-32 bg-[#121212] text-white relative isolate">
        
        {/* Sticky Header */}
        <div 
            className="fixed top-0 left-0 right-0 z-40 transition-colors duration-200 flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: `rgba(18, 18, 18, ${scrollOpacity})`, backdropFilter: scrollOpacity > 0.8 ? 'blur(10px)' : 'none' }}
        >
            <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white">
                <ArrowLeft size={20} />
            </button>
            <span 
                className="font-bold text-lg transition-opacity duration-300"
                style={{ opacity: scrollOpacity }}
            >
                {artist.name}
            </span>
            <button className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white">
                <MoreHorizontal size={20} />
            </button>
        </div>

        {/* Hero Image */}
        <div className="relative w-full h-[350px] md:h-[450px] -mt-[64px] z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-[#121212] z-10"></div>
            <img 
                src={imageUrl} 
                alt={artist.name} 
                className="w-full h-full object-cover object-center" 
            />
            <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                 <div className="flex items-center gap-2 mb-2">
                     <CheckCircle2 size={24} className="text-[#3d91f4] fill-white bg-white rounded-full border-none" />
                     <span className="text-sm font-medium tracking-wide">Verified Artist</span>
                 </div>
                 <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-xl">{artist.name}</h1>
                 <p className="text-white/80 mt-2 font-medium">10,230,129 monthly listeners</p>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-6 flex items-center gap-4 bg-[#121212] relative z-20">
             <button 
                 onClick={() => songs.length > 0 && playSong(songs[0], songs)}
                 className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
             >
                 {isPlaying && currentSong?.artists?.primary?.[0]?.name === artist.name ? (
                     <Pause size={28} fill="black" className="text-black" />
                 ) : (
                     <Play size={28} fill="black" className="text-black ml-1" />
                 )}
             </button>
             <button className="px-5 py-2 rounded-full border border-white/40 text-sm font-bold hover:border-white transition-colors">
                 Follow
             </button>
        </div>

        {/* Popular Songs */}
        <div className="px-4 pb-8 bg-[#121212] relative z-20">
            <h2 className="text-xl font-bold mb-4">Popular</h2>
            <div className="flex flex-col">
                {songs.length === 0 ? (
                    <div className="text-secondary italic">No songs found.</div>
                ) : (
                    songs.slice(0, 5).map((song, index) => {
                        const isCurrent = currentSong?.id === song.id;
                        const isSongLiked = likedSongs.some(s => s.id === song.id);

                        return (
                            <div 
                                key={song.id}
                                onClick={() => playSong(song, songs)}
                                className={`flex items-center gap-4 p-3 rounded-md cursor-pointer transition-colors ${isCurrent ? 'bg-white/10' : 'hover:bg-white/5'}`}
                            >
                                <span className={`w-4 text-center text-sm font-mono ${isCurrent ? 'text-[#1DB954]' : 'text-[#B3B3B3]'}`}>
                                    {index + 1}
                                </span>

                                <img src={getImageUrl(song.image)} className="w-10 h-10 rounded object-cover" alt="" />

                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium truncate text-[15px] ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>
                                        {song.name}
                                    </div>
                                    <div className="text-xs text-[#B3B3B3] truncate">
                                        {song.downloadUrl?.some(u => u.quality.includes('320')) && (
                                            <span className="bg-[#555] text-white px-1 rounded-[2px] text-[9px] mr-1">E</span>
                                        )}
                                        {song.artists.primary[0]?.name}
                                    </div>
                                </div>

                                <span className="text-xs text-[#B3B3B3] font-mono hidden md:block">
                                    {(parseInt(song.duration) / 60).toFixed(0)}:{(parseInt(song.duration) % 60).toString().padStart(2, '0')}
                                </span>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                                    className={`${isSongLiked ? 'text-[#1DB954]' : 'text-[#B3B3B3] hover:text-white'}`}
                                >
                                    {isSongLiked ? <CheckCircle2 size={18} /> : <PlusCircle size={18} />}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>

        {/* Albums Section */}
        {albums.length > 0 && (
            <div className="px-4 pb-8 bg-[#121212] relative z-20">
                <h2 className="text-xl font-bold mb-4">Discography</h2>
                <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2">
                    {albums.map((album) => (
                        <div 
                            key={album.id} 
                            className="w-[150px] shrink-0 cursor-pointer group"
                            onClick={() => navigate(`/album/${album.id}`)}
                        >
                            <div className="w-full aspect-square mb-2 relative">
                                <img src={getImageUrl(album.image)} alt={album.name} className="w-full h-full object-cover rounded-md shadow-md" />
                            </div>
                            <h3 className="text-sm font-bold text-white truncate group-hover:underline">{album.name}</h3>
                            <p className="text-xs text-[#B3B3B3]">{album.year} • Album</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};