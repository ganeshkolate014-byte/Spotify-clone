import React, { useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { Search, Plus, ArrowUpDown, Pin, Heart, Music } from 'lucide-react';
import { getImageUrl } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { CreatePlaylistModal } from '../components/CreatePlaylistModal';

export const Library: React.FC = () => {
  const { likedSongs, userPlaylists } = usePlayerStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'All' | 'Playlists' | 'Artists'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
              <button className="hover:text-white/70 transition-colors"><Search size={24} /></button>
              <button onClick={() => setIsModalOpen(true)} className="hover:text-white/70 transition-colors"><Plus size={26} /></button>
          </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar">
          <FilterChip label="All" />
          <FilterChip label="Playlists" />
          <FilterChip label="Artists" />
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
            className="flex items-center gap-3 p-2 -mx-2 hover:bg-[#1A1A1A] rounded-md cursor-pointer active:scale-[0.99] transition-all group"
          >
              <div className="w-[50px] h-[50px] bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center shrink-0 rounded-[4px]">
                 <Heart size={24} fill="white" className="text-white" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-white font-medium text-[15px] truncate group-hover:text-white">Liked Songs</span>
                  <div className="flex items-center gap-1.5 text-[#B3B3B3] text-sm">
                       <Pin size={12} fill="#1DB954" className="text-[#1DB954] rotate-45" />
                       <span>Playlist • {likedSongs.length} songs</span>
                  </div>
              </div>
          </div>

          {/* User Playlists */}
          {userPlaylists.map(playlist => (
             <div 
                key={playlist.id}
                onClick={() => navigate(`/playlist/${playlist.id}`)}
                className="flex items-center gap-3 p-2 -mx-2 hover:bg-[#1A1A1A] rounded-md cursor-pointer active:scale-[0.99] transition-all group"
             >
                <div className="w-[50px] h-[50px] bg-[#333] shrink-0 rounded-[4px] overflow-hidden">
                    {playlist.image && playlist.image[0] ? (
                        <img src={getImageUrl(playlist.image)} alt={playlist.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#282828]">
                            <Music size={24} className="text-white/40" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-white font-medium text-[15px] truncate">{playlist.title}</span>
                    <span className="text-[#B3B3B3] text-sm truncate">Playlist • {playlist.subtitle}</span>
                </div>
             </div>
          ))}

      </div>

      {isModalOpen && <CreatePlaylistModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};