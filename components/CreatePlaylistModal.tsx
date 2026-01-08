import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2, Music, Sparkles, Search, Plus } from 'lucide-react';
import { uploadToCloudinary, api, getImageUrl } from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import { UserPlaylist, Song } from '../types';
import { motion } from 'framer-motion';

interface CreatePlaylistModalProps {
  onClose: () => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // AI Smart Fill State
  const [seedQuery, setSeedQuery] = useState('');
  const [seedResults, setSeedResults] = useState<Song[]>([]);
  const [selectedSeed, setSelectedSeed] = useState<Song | null>(null);
  const [isSearchingSeed, setIsSearchingSeed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createPlaylist } = usePlayerStore();

  // Search for seed songs
  useEffect(() => {
    const timer = setTimeout(async () => {
        if (seedQuery.trim() && !selectedSeed) {
            setIsSearchingSeed(true);
            try {
                const results = await api.searchSongs(seedQuery);
                setSeedResults(results.slice(0, 4));
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearchingSeed(false);
            }
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [seedQuery, selectedSeed]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSelectSeed = (song: Song) => {
      setSelectedSeed(song);
      setSeedQuery(song.name);
      setSeedResults([]); // Hide dropdown
      // Auto-name playlist if empty
      if (!name) setName(`${song.name} Radio`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      let imageUrl = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop';
      
      if (file) {
        imageUrl = await uploadToCloudinary(file);
      } else if (selectedSeed) {
        // Use seed song image if no custom upload
        imageUrl = getImageUrl(selectedSeed.image);
      }

      let initialSongs: Song[] = [];

      // AI Logic: Fetch similar songs
      if (selectedSeed) {
          const artistName = selectedSeed.artists.primary[0]?.name || '';
          // Search for a mix of artist and genre-like queries
          const similarSongs = await api.searchSongs(`${artistName} ${selectedSeed.language || ''}`);
          // Filter out duplicates
          initialSongs = [selectedSeed, ...similarSongs.filter(s => s.id !== selectedSeed.id).slice(0, 15)];
      }

      const newPlaylist: UserPlaylist = {
        id: `user-pl-${Date.now()}`,
        title: name,
        subtitle: selectedSeed ? `Based on ${selectedSeed.name}` : (description || 'User Playlist'),
        description: description,
        type: 'playlist',
        isUserCreated: true,
        createdAt: Date.now(),
        image: [{ quality: 'high', url: imageUrl }],
        songs: initialSongs
      };

      createPlaylist(newPlaylist);
      onClose();
    } catch (error) {
      console.error('Failed to create playlist', error);
      alert('Failed to upload image or create playlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-[#121212] w-full max-w-lg rounded-t-2xl md:rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[95dvh]"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#121212]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Create Playlist
                {selectedSeed && <Sparkles size={16} className="text-[#1DB954]" />}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto no-scrollbar">
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Image Upload */}
                    <div className="flex justify-center shrink-0">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-40 h-40 bg-[#282828] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#333] transition-colors group relative overflow-hidden border-2 border-dashed border-white/10 hover:border-white/30 shadow-inner"
                        >
                            {preview ? (
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            ) : selectedSeed ? (
                                <img src={getImageUrl(selectedSeed.image)} alt="Seed" className="w-full h-full object-cover opacity-60" />
                            ) : (
                                <>
                                    <Music size={40} className="text-white/20 group-hover:text-white/40 mb-2 transition-colors" />
                                    <span className="text-xs text-white/50 font-medium text-center px-2">Tap to upload cover</span>
                                </>
                            )}
                            
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={24} className="text-white" />
                            </div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4 flex-1">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Name</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="My Playlist"
                                className="bg-[#282828] text-white p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-white/30 font-medium w-full"
                                autoFocus={!selectedSeed}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Description</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add an optional description"
                                className="bg-[#282828] text-white p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-white/30 resize-none h-20 text-sm w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* AI Smart Fill Section */}
                <div className="bg-gradient-to-r from-[#1DB954]/10 to-transparent p-4 rounded-xl border border-[#1DB954]/20 relative">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={18} className="text-[#1DB954]" />
                        <span className="text-sm font-bold text-white">AI Smart Fill</span>
                    </div>
                    
                    {!selectedSeed ? (
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                            <input 
                                type="text"
                                value={seedQuery}
                                onChange={(e) => setSeedQuery(e.target.value)}
                                placeholder="Pick a song to auto-fill playlist..."
                                className="w-full bg-[#121212] text-white pl-9 pr-4 py-2.5 rounded-lg text-sm border border-white/10 focus:border-[#1DB954] focus:outline-none transition-colors"
                            />
                            {isSearchingSeed && <Loader2 size={16} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-white/50" />}
                            
                            {/* Dropdown Results */}
                            {seedResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#181818] border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                                    {seedResults.map(song => (
                                        <div 
                                            key={song.id} 
                                            onClick={() => handleSelectSeed(song)}
                                            className="flex items-center gap-3 p-2 hover:bg-white/10 cursor-pointer transition-colors"
                                        >
                                            <img src={getImageUrl(song.image)} className="w-8 h-8 rounded object-cover" alt="" />
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-sm font-medium text-white truncate">{song.name}</span>
                                                <span className="text-xs text-[#777] truncate">{song.artists.primary[0]?.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-[#1DB954]/20 p-2 rounded-lg border border-[#1DB954]/30">
                            <div className="flex items-center gap-3">
                                <img src={getImageUrl(selectedSeed.image)} className="w-10 h-10 rounded object-cover" alt="" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white">{selectedSeed.name}</span>
                                    <span className="text-xs text-[#1DB954]">+ Similar songs will be added</span>
                                </div>
                            </div>
                            <button onClick={() => { setSelectedSeed(null); setSeedQuery(''); }} className="p-1 hover:bg-black/20 rounded-full">
                                <X size={16} className="text-white" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-2">
                    <button 
                        type="submit" 
                        disabled={!name.trim() || isLoading}
                        className="bg-white text-black font-bold py-3 px-10 rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    >
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        {selectedSeed ? 'Generate Playlist' : 'Create'}
                    </button>
                </div>

            </form>
        </div>
      </motion.div>
    </div>
  );
};