import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { uploadToCloudinary } from '../services/api';
import { ArrowLeft, Camera, Loader2, Save, LogOut, Cloud } from 'lucide-react';

export const Profile: React.FC = () => {
  const { currentUser, updateUserProfile, logoutUser } = usePlayerStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      // Ensure we use the latest image from state
      setImagePreview(currentUser.image || null);
    } else {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      let imageUrl = imagePreview;
      
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }
      
      // Update logic handles syncing to Cloudinary JSON
      updateUserProfile(name, imageUrl || undefined);
      
      // Force small delay to feel like a save
      await new Promise(r => setTimeout(r, 1000));
      
      alert('Profile updated and synced to cloud! You are now searchable.');
    } catch (error) {
      console.error("Failed to update profile", error);
      alert('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if(window.confirm('Are you sure you want to log out?')) {
        logoutUser();
        navigate('/');
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-full bg-black text-white pb-32">
       {/* Header */}
      <div className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between bg-[#121212] border-b border-white/5">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate(-1)} 
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Edit Profile</h1>
          </div>
          <button 
             onClick={handleLogout}
             className="text-[#B3B3B3] hover:text-white flex items-center gap-2 text-sm font-bold transition-colors"
          >
             <LogOut size={16} />
             Logout
          </button>
      </div>

      <div className="max-w-2xl mx-auto p-6 md:p-10 flex flex-col gap-8">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-40 h-40 rounded-full bg-[#282828] group cursor-pointer overflow-hidden shadow-2xl border-4 border-[#121212]"
              >
                 {imagePreview ? (
                    <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/20">
                        {name.charAt(0).toUpperCase()}
                    </div>
                 )}
                 
                 <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Camera size={32} className="text-white mb-2" />
                     <span className="text-xs font-bold">Change Photo</span>
                 </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageChange}
              />
              <div className="flex items-center gap-2 text-[#1DB954] text-xs font-bold bg-[#1DB954]/10 px-3 py-1 rounded-full">
                  <Cloud size={12} />
                  <span>Cloud Synced</span>
              </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="flex flex-col gap-6">
              
              <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#B3B3B3]">Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-[#2A2A2A] border border-transparent focus:border-white rounded-md p-3 text-white font-medium outline-none transition-all"
                    placeholder="Display Name"
                  />
              </div>

               <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#B3B3B3]">Email</label>
                  <input 
                    type="text" 
                    value={currentUser.email}
                    disabled
                    className="bg-[#1A1A1A] text-white/50 rounded-md p-3 font-medium outline-none cursor-not-allowed border border-transparent"
                  />
                  <span className="text-xs text-[#555]">Email determines your cloud storage ID.</span>
              </div>

              <div className="pt-4 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                     {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                     Save Profile
                  </button>
              </div>

          </form>

      </div>
    </div>
  );
};