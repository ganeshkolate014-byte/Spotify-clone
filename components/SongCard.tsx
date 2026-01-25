import React from 'react';
import { Play } from 'lucide-react';
import { SearchResult } from '../types';
import { getImageUrl } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
      navigate(`/artist/${item.id}`, { state: { artist: item } });
    } else if (item.type === 'song' && onPlay) {
      onPlay();
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) onPlay();
  };

  // Safe subtitle generation
  let safeSubtitle = subtitle;
  if (!safeSubtitle) {
      if (item.type === 'song') {
          safeSubtitle = item.artists?.primary?.[0]?.name || item.artists?.all?.[0]?.name || 'Artist';
      } else if (item.type === 'album') {
          safeSubtitle = `Album • ${item.artists?.primary?.[0]?.name || 'Artist'}`;
      } else if (item.type === 'artist') {
          safeSubtitle = 'Artist';
      } else if (item.type === 'playlist') {
          safeSubtitle = item.subtitle || 'Playlist';
      }
  }

  // Handle display title
  const displayTitle = item.type === 'playlist' ? item.title : item.name;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={handleClick}
      className="group relative bg-[#181818] hover:bg-[#282828] p-4 rounded-[24px] transition-colors cursor-pointer w-[160px] md:w-[180px] shrink-0"
    >
      <div className={`relative w-full aspect-square mb-3 shadow-lg ${round ? 'rounded-full' : 'rounded-[16px]'} overflow-hidden`}>
        <img 
          src={imageUrl} 
          alt={displayTitle} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Play Button Overlay */}
        {!round && item.type !== 'artist' && (
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePlayClick}
            className="absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-[#1DB954] text-black rounded-full p-3 shadow-xl flex items-center justify-center z-20"
          >
            <Play size={20} fill="black" className="ml-1" />
          </motion.button>
        )}
      </div>
      <div className="flex flex-col gap-1 min-h-[48px]">
        <h3 className="text-white font-bold truncate text-[15px] mb-1 leading-tight group-hover:underline decoration-1 underline-offset-2">
          {displayTitle}
        </h3>
        <p className="text-[#A7A7A7] text-[13px] truncate font-medium">
          {safeSubtitle}
        </p>
      </div>
    </motion.div>
  );
};