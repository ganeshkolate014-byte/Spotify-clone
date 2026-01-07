import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { uploadToCloudinary } from '../services/api';
import { ArrowLeft, Camera, Loader2, Save, LogOut, Cloud, SignalHigh, SignalMedium, SignalLow, Music2, Users, ChevronRight, Mail, Shield, RotateCcw, Youtube, Library, Globe, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export const Profile: React.FC = () => {
  const { currentUser, updateUserProfile, logoutUser, streamingQuality, setStreamingQuality, favoriteArtists, musicSource, setMusicSource } = usePlayerStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [scrollOpacity, setScrollOpacity] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setImagePreview(currentUser.image || null);
    } else {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const handleScroll = () => {
        const opacity = Math.min(window.scrollY / 200, 1);
        setScrollOpacity(opacity);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      updateUserProfile(name, imageUrl || undefined);
      await new Promise(r => setTimeout(r, 800)); // UX delay
      alert('Profile updated');
    } catch (error) {
      console.error("Failed to update profile", error);
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
    <div className="min-h-full bg-[#121212] text-white pb-32 relative isolate">
       
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#535353] to-[#121212] -z-10" />

      {/* Sticky Header */}
      <div 
        className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between transition-colors duration-200"
        style={{ backgroundColor: `rgba(18, 18, 18, ${scrollOpacity})` }}
      >
          <button 
              onClick={() => navigate(-1)} 
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
          >
              <ArrowLeft size={20} />
          </button>
          <span 
            className="font-bold text-sm opacity-0 transition-opacity duration-300"
            style={{ opacity: scrollOpacity }}
          >
            {name}
          </span>
          <div className="flex items-center gap-2">
            <button 
                onClick={() => window.location.reload()}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                title="Restart App"
            >
                <RotateCcw size={16} />
            </button>
            <button 
                onClick={handleLogout}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                title="Log Out"
            >
                <LogOut size={16} />
            </button>
          </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 flex flex-col gap-8 -mt-2">
          
          {/* Hero Profile Section */}
          <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-4 duration-500">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-48 h-48 md:w-56 md:h-56 rounded-full shadow-[0_8px_40px_rgba(0,0,0,0.5)] group cursor-pointer"
              >
                 {imagePreview ? (
                    <img src={imagePreview} alt="Profile" className="w-full h-full object-cover rounded-full" />
                 ) : (
                    <div className="w-full h-full rounded-full bg-[#282828] flex items-center justify-center text-6xl font-bold text-white/20">
                        {name.charAt(0).toUpperCase()}
                    </div>
                 )}
                 
                 <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                     <Camera size={32} className="text-white mb-2" />
                     <span className="text-xs font-bold uppercase tracking-widest">Edit Photo</span>
                 </div>
                 <div className="absolute bottom-2 right-4 bg-[#1DB954] text-black p-2 rounded-full border-4 border-[#121212]">
                    <Cloud size={16} />
                 </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />

              <div className="flex flex-col items-center gap-2 w-full">
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent text-center text-4xl md:text-5xl font-black text-white outline-none border-b border-transparent focus:border-white/20 pb-1 w-full max-w-md transition-all placeholder-white/20"
                    placeholder="Name"
                  />
                  <div className="flex items-center gap-6 text-sm font-bold text-white/70 mt-2">
                      <div className="flex flex-col items-center">
                          <span className="text-white">12</span>
                          <span className="text-[10px] uppercase tracking-wider">Playlists</span>
                      </div>
                      <div className="flex flex-col items-center">
                          <span className="text-white">148</span>
                          <span className="text-[10px] uppercase tracking-wider">Followers</span>
                      </div>
                      <div className="flex flex-col items-center">
                          <span className="text-white">23</span>
                          <span className="text-[10px] uppercase tracking-wider">Following</span>
                      </div>
                  </div>
              </div>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-6 mt-4">
              
              {/* Account Card */}
              <div className="bg-[#181818] p-5 rounded-lg">
                   <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Shield size={20} className="text-[#1DB954]"/> Account
                   </h3>
                   <div className="flex items-center gap-4 text-sm">
                      <div className="p-3 bg-[#2A2A2A] rounded-full text-[#B3B3B3]">
                          <Mail size={20} />
                      </div>
                      <div className="flex flex-col flex-1">
                          <span className="text-xs text-[#B3B3B3] font-bold uppercase tracking-wider">Email</span>
                          <span className="text-white/80 font-medium">{currentUser.email}</span>
                      </div>
                      <span className="px-3 py-1 bg-[#2A2A2A] rounded-full text-[10px] font-bold text-[#B3B3B3]">PRIVATE</span>
                   </div>
              </div>

              {/* Taste Profile */}
              <div 
                  onClick={() => navigate('/artists/select')}
                  className="bg-[#181818] p-5 rounded-lg cursor-pointer hover:bg-[#202020] transition-colors group"
              >
                   <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Users size={20} className="text-[#1DB954]"/> Taste Profile
                        </h3>
                        <ChevronRight className="text-[#555] group-hover:text-white transition-colors" />
                   </div>
                   <p className="text-sm text-[#B3B3B3] mb-4">Manage the artists you follow to improve recommendations.</p>
                   
                   <div className="flex items-center gap-2 overflow-hidden">
                       {favoriteArtists.slice(0, 5).map((artist, i) => (
                           <div key={artist.id} className="w-10 h-10 rounded-full bg-[#333] overflow-hidden border border-black relative" style={{ zIndex: 5 - i }}>
                               <img src={artist.image[0]?.url} className="w-full h-full object-cover" alt=""/>
                           </div>
                       ))}
                       {favoriteArtists.length > 5 && (
                           <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center text-xs font-bold text-white border border-black z-0">
                               +{favoriteArtists.length - 5}
                           </div>
                       )}
                       {favoriteArtists.length === 0 && <span className="text-sm font-bold text-[#1DB954]">Select Artists</span>}
                   </div>
              </div>

               {/* Music Source Selection */}
               <div className="bg-[#181818] p-5 rounded-lg">
                   <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Globe size={20} className="text-[#1DB954]"/> Music Source
                   </h3>
                   <div className="flex flex-col gap-2">
                      {[
                          { val: 'both', label: 'Hybrid (Recommended)', sub: 'Results from both sources', Icon: Layers },
                          { val: 'youtube', label: 'YouTube Music', sub: 'Extensive library from YT', Icon: Youtube },
                          { val: 'local', label: 'Local Library', sub: 'High quality official tracks', Icon: Library },
                      ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => setMusicSource(opt.val as any)}
                            className={`flex items-center p-3 rounded-md transition-all ${
                                musicSource === opt.val 
                                ? 'bg-[#2A2A2A] ring-1 ring-[#1DB954]' 
                                : 'hover:bg-[#2A2A2A]/50'
                            }`}
                          >
                              <div className={`p-2 rounded-full mr-4 ${musicSource === opt.val ? 'text-[#1DB954]' : 'text-[#555]'}`}>
                                  <opt.Icon size={20} />
                              </div>
                              <div className="flex flex-col items-start flex-1">
                                  <span className={`text-sm font-bold ${musicSource === opt.val ? 'text-white' : 'text-white/70'}`}>{opt.label}</span>
                                  <span className="text-xs text-[#555]">{opt.sub}</span>
                              </div>
                              {musicSource === opt.val && <div className="w-3 h-3 bg-[#1DB954] rounded-full shadow-[0_0_10px_#1DB954]"></div>}
                          </button>
                      ))}
                   </div>
              </div>

              {/* Audio Quality */}
              <div className="bg-[#181818] p-5 rounded-lg">
                   <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Music2 size={20} className="text-[#1DB954]"/> Audio Quality
                   </h3>
                   <div className="flex flex-col gap-2">
                      {[
                          { val: 'low', label: 'Low (48kbps)', sub: 'Best for saving data', Icon: SignalLow },
                          { val: 'normal', label: 'Normal (96kbps)', sub: 'Standard balance', Icon: SignalMedium },
                          { val: 'high', label: 'High (320kbps)', sub: 'Best listening experience', Icon: SignalHigh },
                      ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => setStreamingQuality(opt.val as any)}
                            className={`flex items-center p-3 rounded-md transition-all ${
                                streamingQuality === opt.val 
                                ? 'bg-[#2A2A2A] ring-1 ring-[#1DB954]' 
                                : 'hover:bg-[#2A2A2A]/50'
                            }`}
                          >
                              <div className={`p-2 rounded-full mr-4 ${streamingQuality === opt.val ? 'text-[#1DB954]' : 'text-[#555]'}`}>
                                  <opt.Icon size={20} />
                              </div>
                              <div className="flex flex-col items-start flex-1">
                                  <span className={`text-sm font-bold ${streamingQuality === opt.val ? 'text-white' : 'text-white/70'}`}>{opt.label}</span>
                                  <span className="text-xs text-[#555]">{opt.sub}</span>
                              </div>
                              {streamingQuality === opt.val && <div className="w-3 h-3 bg-[#1DB954] rounded-full shadow-[0_0_10px_#1DB954]"></div>}
                          </button>
                      ))}
                   </div>
              </div>

              <div className="flex justify-center pt-4 pb-8">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-white text-black font-bold py-3.5 px-12 rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                     {loading ? <Loader2 size={20} className="animate-spin" /> : 'Save Changes'}
                  </button>
              </div>

          </form>

      </div>
    </div>
  );
};