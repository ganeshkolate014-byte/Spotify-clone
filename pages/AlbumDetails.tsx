import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, getImageUrl } from '../services/api';
import { Album, Song } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { Clock3, Play } from 'lucide-react';

export const AlbumDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const { playSong } = usePlayerStore();

  useEffect(() => {
    if (id) {
      api.getAlbumDetails(id).then(setAlbum);
    }
  }, [id]);

  if (!album) return <div className="p-8 text-center text-secondary">Loading album...</div>;

  const imageUrl = getImageUrl(album.image);
  // Safely handle if songs are nested differently or plain list
  // The type definition says songs?: Song[]
  const songs = album.songs || [];

  return (
    <div className="pb-32 bg-gradient-to-b from-[#404040] to-black min-h-full">
      {/* Hero */}
      <div className="flex flex-col md:flex-row items-end gap-6 p-6 md:p-8 bg-gradient-to-b from-transparent to-black/20">
        <img src={imageUrl} alt={album.name} className="w-52 h-52 shadow-2xl rounded-sm object-cover" />
        <div className="flex flex-col gap-2 mb-2">
            <span className="uppercase text-xs font-bold tracking-wider">Album</span>
            <h1 className="text-4xl md:text-7xl font-black tracking-tight">{album.name}</h1>
            <div className="flex items-center gap-2 text-sm font-bold text-white mt-4">
                <span className="hover:underline cursor-pointer">{album.artists?.primary?.[0]?.name || "Unknown Artist"}</span>
                <span className="text-secondary">• {album.year} • {songs.length} songs</span>
            </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 md:px-8 py-4 bg-black/20 backdrop-blur-sm flex items-center gap-8">
         <button 
            onClick={() => songs.length > 0 && playSong(songs[0], songs)}
            className="bg-[#1DB954] hover:bg-[#1ed760] rounded-full p-4 hover:scale-105 transition-transform flex items-center justify-center shadow-lg"
         >
             <Play size={28} fill="black" className="ml-1 text-black" />
         </button>
      </div>

      {/* List */}
      <div className="px-6 md:px-8 mt-4">
        {/* Header Row */}
        <div className="grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_1fr_1fr_auto] gap-4 text-secondary text-sm border-b border-[#282828] pb-2 mb-4 px-4">
            <span>#</span>
            <span>Title</span>
            <span className="hidden md:block">Album</span>
            <Clock3 size={16} />
        </div>

        <div className="flex flex-col">
            {songs.map((song, index) => (
                <div 
                    key={song.id} 
                    className="group grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_1fr_1fr_auto] gap-4 items-center px-4 py-2 hover:bg-[#2a2a2a] rounded-md cursor-pointer text-secondary hover:text-white transition-colors"
                    onClick={() => playSong(song, songs)}
                >
                    <span className="text-sm group-hover:text-white font-mono flex justify-center">
                        <span className="group-hover:hidden">{index + 1}</span>
                        <Play size={12} fill="white" className="hidden group-hover:block" />
                    </span>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex flex-col truncate">
                            <span className="text-white font-medium text-base truncate">{song.name}</span>
                            <span className="text-xs group-hover:text-white truncate">{song.artists?.primary?.[0]?.name || "Unknown"}</span>
                        </div>
                    </div>
                    <span className="hidden md:block text-sm truncate">{album.name}</span>
                    <span className="text-sm font-mono">
                        {Math.floor(parseInt(song.duration) / 60)}:{(parseInt(song.duration) % 60).toString().padStart(2, '0')}
                    </span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};