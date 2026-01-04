import React, { useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { Search, Plus, ArrowUpDown, Pin, Heart } from 'lucide-react';
import { getImageUrl } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const Library: React.FC = () => {
  const { likedSongs, playSong } = usePlayerStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'All' | 'Playlists' | 'Artists'>('All');

  const FilterChip = ({ label }: { label: string }) => (
      <button 
        onClick={() => setFilter(label as any)}
        className={`px-4 py-1.5 rounded-full text-xs font-medium border border-transparent transition-colors ${filter === label ? 'bg-[#1DB954] text-black' : 'bg-[#2A2A2A] text-white hover:bg-[#3E3E3E]'}`}
      >
          {label}
      </button>
  );

  return (
    <div className="min-h-full pb-32 bg-[#121212] pt-4 px-4">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-black text-xs">A</div>
              <h1 className="text-2xl font-bold text-white">Your Library</h1>
          </div>
          <div className="flex items-center gap-4 text-white">
              <Search size={24} />
              <Plus size={26} />
          </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar">
          <FilterChip label="Playlists" />
          <FilterChip label="Artists" />
          <FilterChip label="Albums" />
          <FilterChip label="Podcasts & Shows" />
      </div>

      {/* Sort Row */}
      <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 text-white/90 text-sm">
              <ArrowUpDown size={14} />
              <span className="font-medium">Recents</span>
          </div>
          <div className="p-1">
              <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-1.5 h-1.5 bg-white/50 rounded-[1px]"></div>
                  <div className="w-1.5 h-1.5 bg-white/50 rounded-[1px]"></div>
                  <div className="w-1.5 h-1.5 bg-white/50 rounded-[1px]"></div>
                  <div className="w-1.5 h-1.5 bg-white/50 rounded-[1px]"></div>
              </div>
          </div>
      </div>

      {/* List Content */}
      <div className="flex flex-col gap-2">
          
          {/* Liked Songs Pin */}
          <div 
            onClick={() => navigate('/liked')}
            className="flex items-center gap-3 p-2 -mx-2 hover:bg-[#1A1A1A] rounded-md cursor-pointer active:bg-black group"
          >
              <div className="w-16 h-16 bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center rounded-sm shrink-0">
                  <Heart size={24} fill="white" className="text-white" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                  <h3 className="text-white font-bold text-base truncate">Liked Songs</h3>
                  <div className="flex items-center gap-2 text-[#B3B3B3] text-sm">
                      <Pin size={12} fill="#1DB954" className="text-[#1DB954] rotate-45" />
                      <span>Playlist • {likedSongs.length} songs</span>
                  </div>
              </div>
          </div>

          {/* Fallback Static Items to make it look populated like Spotify */}
          {[
              { title: "New Music Friday", type: "Playlist", owner: "Spotify", img: "https://picsum.photos/seed/1/200" },
              { title: "Daylist", type: "Playlist", owner: "Spotify", img: "https://picsum.photos/seed/2/200" },
              { title: "Arijit Singh", type: "Artist", owner: "", img: "https://picsum.photos/seed/3/200", round: true },
              { title: "On Repeat", type: "Playlist", owner: "Spotify", img: "https://picsum.photos/seed/4/200" },
              { title: "Punjabi 101", type: "Playlist", owner: "Spotify", img: "https://picsum.photos/seed/5/200" },
          ].map((item, i) => (
             <div key={i} className="flex items-center gap-3 p-2 -mx-2 hover:bg-[#1A1A1A] rounded-md cursor-pointer active:bg-black">
                <img 
                    src={item.img} 
                    className={`w-16 h-16 object-cover ${item.round ? 'rounded-full' : 'rounded-sm'} shrink-0`} 
                    alt="" 
                />
                <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="text-white font-medium text-base truncate mb-0.5">{item.title}</h3>
                    <div className="text-[#B3B3B3] text-sm truncate">
                        {item.type} {item.owner ? `• ${item.owner}` : ''}
                    </div>
                </div>
             </div>
          ))}
      </div>
    </div>
  );
};