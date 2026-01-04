import React from 'react';
import { Play } from 'lucide-react';
import { SearchResult } from '../types';
import { getImageUrl } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface SongCardProps {
  item: SearchResult;
  onPlay?: () => void;
  subtitle?: string;
  round?: boolean;
}

export const SongCard: React.FC<SongCardProps> = ({ item, onPlay, subtitle, round = false }) => {
  const navigate = useNavigate();
  const imageUrl = getImageUrl(item.image);

  const handleClick = () => {
    if (item.type === 'album') {
      navigate(`/album/${item.id}`);
    } else if (item.type === 'artist') {
      // Pass the artist object in state to avoid re-fetching details immediately
      navigate(`/artist/${item.id}`, { state: { artist: item } });
    } else if (item.type === 'song' && onPlay) {
      onPlay();
    }
    // Playlist logic can remain as is or be added later
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) onPlay();
  };

  return (
    <div 
      onClick={handleClick}
      className="group relative bg-[#181818] hover:bg-[#282828] p-4 rounded-lg transition-colors duration-300 cursor-pointer w-[180px] shrink-0"
    >
      <div className={`relative w-full aspect-square mb-4 shadow-xl ${round ? 'rounded-full' : 'rounded-md'} overflow-hidden`}>
        <img 
          src={imageUrl} 
          alt={item.name || (item as any).title} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Play Button Overlay (Spotify Style) - Only show for songs/albums */}
        {!round && item.type !== 'artist' && (
          <button 
            onClick={handlePlayClick}
            className="absolute bottom-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-[-8px] group-hover:opacity-100 transition-all duration-300 bg-[#1DB954] text-black rounded-full p-3 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 z-20"
          >
            <Play size={22} fill="black" className="ml-0.5" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1 min-h-[60px]">
        <h3 className="text-white font-bold truncate text-base mb-1">
          {item.name || (item as any).title}
        </h3>
        <p className="text-[#A7A7A7] text-sm truncate line-clamp-2 font-medium">
          {subtitle || (item.type === 'song' ? (item as any).artists?.primary?.[0]?.name : 
                        item.type === 'album' ? `Album • ${(item as any).artists?.primary?.[0]?.name}` : 
                        item.type === 'artist' ? 'Artist' : '')}
        </p>
      </div>
    </div>
  );
};