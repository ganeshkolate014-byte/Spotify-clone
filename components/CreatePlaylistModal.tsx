import React, { useState, useRef } from 'react';
import { X, Upload, Loader2, Music } from 'lucide-react';
import { uploadToCloudinary } from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import { UserPlaylist } from '../types';

interface CreatePlaylistModalProps {
  onClose: () => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createPlaylist } = usePlayerStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      let imageUrl = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop';
      
      if (file) {
        imageUrl = await uploadToCloudinary(file);
      }

      const newPlaylist: UserPlaylist = {
        id: `user-pl-${Date.now()}`,
        title: name,
        subtitle: description || 'User Playlist',
        description: description,
        type: 'playlist',
        isUserCreated: true,
        createdAt: Date.now(),
        image: [{ quality: 'high', url: imageUrl }],
        songs: []
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
    <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="bg-[#121212] w-full max-w-md rounded-t-xl md:rounded-xl border-t md:border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] md:max-h-auto transition-transform animate-in slide-in-from-bottom duration-300"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h2 className="text-xl font-bold text-white">Create Playlist</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                
                {/* Image Upload */}
                <div className="flex justify-center">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-32 h-32 md:w-40 md:h-40 bg-[#282828] rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#333] transition-colors group relative overflow-hidden border-2 border-dashed border-white/10 hover:border-white/30"
                    >
                        {preview ? (
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <Music size={40} className="text-white/20 group-hover:text-white/40 mb-2 transition-colors" />
                                <span className="text-xs text-white/50 font-medium">Choose photo</span>
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
                <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome Playlist"
                            className="bg-[#282828] text-white p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-white/30 font-medium"
                            autoFocus
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Description</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add an optional description"
                            className="bg-[#282828] text-white p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-white/30 resize-none h-24 text-sm"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-2 pb-4 md:pb-0">
                    <button 
                        type="submit" 
                        disabled={!name.trim() || isLoading}
                        className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2 w-full md:w-auto justify-center"
                    >
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        Create
                    </button>
                </div>

            </form>
        </div>
      </div>
    </div>
  );
};