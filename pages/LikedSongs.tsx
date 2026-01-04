import React from 'react';
import { usePlayerStore } from '../store/playerStore';
import { ArrowLeft, Play, Shuffle, Download, Search, CheckCircle2, MoreVertical, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../services/api';

export const LikedSongs: React.FC = () => {
  const { likedSongs, playSong, toggleLike } = usePlayerStore();
  const navigate = useNavigate();

  const handlePlayAll = () => {
    if (likedSongs.length > 0) {
      playSong(likedSongs[0], likedSongs);
    }
  };

  const handleShufflePlay = () => {
    if (likedSongs.length > 0) {
        const shuffled = [...likedSongs].sort(() => Math.random() - 0.5);
        playSong(shuffled[0], shuffled);
    }
  };

  return (
    <div className="min-h-full pb-32 bg-gradient-to-b from-[#1a1b4b] via-[#121212] to-black">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center p-4 bg-transparent">
        <button onClick={() => navigate(-1)} className="text-white hover:bg-black/20 p-2 rounded-full">
            <ArrowLeft size={24} />
        </button>
      </div>

      <div className="px-6 flex flex-col pb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Liked Songs</h1>
          <p className="text-[#B3B3B3] text-sm font-medium">{likedSongs.length} songs</p>
          
          <div className="flex items-center gap-4 mt-4">
              <div className="bg-[#2A2A2A] p-3 rounded-full text-[#B3B3B3] border border-white/10">
                  <Download size={20} />
              </div>
          </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between px-6 mb-4">
          <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center">
             <span className="text-xs font-bold">↓</span>
          </div>
          <div className="flex items-center gap-4">
              <button onClick={handleShufflePlay} className="text-[#1DB954]">
                  <Shuffle size={24} />
              </button>
              <button 
                onClick={handlePlayAll}
                className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-green-900/20"
              >
                  <Play size={28} fill="black" className="text-black ml-1" />
              </button>
          </div>
      </div>

      {/* List */}
      <div className="flex flex-col">
          {likedSongs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center opacity-70">
                  <p className="text-lg font-bold mb-2">Songs you like will appear here</p>
                  <p className="text-sm">Save songs by tapping the heart icon.</p>
                  <button onClick={() => navigate('/search')} className="mt-6 bg-white text-black px-6 py-2 rounded-full font-bold text-sm">
                      Find songs
                  </button>
              </div>
          ) : (
              likedSongs.map((song) => (
                  <div 
                    key={song.id} 
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#2A2A2A] cursor-pointer active:bg-black"
                    onClick={() => playSong(song, likedSongs)}
                  >
                      <img src={getImageUrl(song.image)} className="w-12 h-12 rounded object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                          <h3 className={`font-medium truncate text-base ${false ? 'text-[#1DB954]' : 'text-white'}`}>{song.name}</h3>
                          <div className="flex items-center gap-1 text-[#B3B3B3] text-xs truncate">
                              {song.downloadUrl[song.downloadUrl.length-1]?.quality.includes('320') && (
                                  <span className="bg-[#C4C4C4] text-black px-1 rounded-[2px] text-[8px] font-bold">E</span>
                              )}
                              <span>{song.artists.primary[0]?.name}</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <button 
                             onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                             className="text-[#1DB954]"
                          >
                             <CheckCircle2 size={24} fill="#1DB954" className="text-black" />
                          </button>
                          <button onClick={(e) => e.stopPropagation()} className="text-[#B3B3B3]">
                              <MoreVertical size={20} />
                          </button>
                      </div>
                  </div>
              ))
          )}
      </div>

      <div className="h-40 bg-gradient-to-t from-black to-transparent pointer-events-none -mt-20 relative z-10"></div>
    </div>
  );
};