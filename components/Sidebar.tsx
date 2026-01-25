import React from 'react';
import { Home, Search, Library, Plus, ArrowRight, Heart, Music, UserCircle, LogOut, Sparkles, Rocket } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { getImageUrl } from '../services/api';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

export const Sidebar: React.FC = () => {
  const { userPlaylists, currentUser } = usePlayerStore();
  const navigate = useNavigate();

  return (
    <aside className="w-[320px] bg-black flex flex-col h-full gap-2 p-3 hidden md:flex">
      {/* Navigation Block - Material 3 Style */}
      <div className="bg-[#121212] rounded-[24px] py-4 px-3 flex flex-col gap-1">
        <div className="px-5 py-2 mb-2">
            <img 
                src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" 
                alt="Spotify" 
                className="h-7 w-auto cursor-pointer" 
                onClick={() => navigate('/')}
            />
        </div>
        
        <NavLink to="/" className={({ isActive }) => `flex items-center gap-5 px-5 py-3 rounded-full transition-all duration-200 group ${isActive ? 'bg-white/10 text-white font-bold' : 'text-[#B3B3B3] hover:text-white hover:bg-white/5 font-medium'}`}>
          {({ isActive }) => (
             <>
               <Home size={24} strokeWidth={isActive ? 0 : 2} fill={isActive ? "white" : "none"} />
               <span>Home</span>
             </>
          )}
        </NavLink>
        
        <NavLink to="/search" className={({ isActive }) => `flex items-center gap-5 px-5 py-3 rounded-full transition-all duration-200 group ${isActive ? 'bg-white/10 text-white font-bold' : 'text-[#B3B3B3] hover:text-white hover:bg-white/5 font-medium'}`}>
          {({ isActive }) => (
             <>
               <Search size={24} strokeWidth={isActive ? 3 : 2} />
               <span>Search</span>
             </>
          )}
        </NavLink>

        <NavLink to="/why-us" className={({ isActive }) => `flex items-center gap-5 px-5 py-3 rounded-full transition-all duration-200 group ${isActive ? 'bg-white/10 text-white font-bold' : 'text-[#B3B3B3] hover:text-white hover:bg-white/5 font-medium'}`}>
          {({ isActive }) => (
             <>
               <Rocket size={24} className={isActive ? "text-[#1DB954]" : ""} />
               <span className={isActive ? "text-[#1DB954]" : ""}>Why us?</span>
             </>
          )}
        </NavLink>
      </div>

      {/* Library Block */}
      <div className="bg-[#121212] rounded-[24px] flex-1 flex flex-col overflow-hidden">
        {/* Library Header */}
        <div className="flex items-center justify-between px-6 py-4 z-10">
          <div 
             className="flex items-center gap-2 text-[#B3B3B3] hover:text-white transition-colors cursor-pointer"
             onClick={() => navigate('/library')}
          >
             <Library size={24} strokeWidth={2} />
             <span className="font-bold text-lg">Your Library</span>
          </div>
          <div className="flex items-center gap-1">
             <button onClick={() => navigate('/premium')} className="p-2 text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] rounded-full transition-colors" title="Premium">
                <Sparkles size={20} />
             </button>
             <button className="p-2 text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] rounded-full transition-colors">
                <Plus size={20} />
             </button>
          </div>
        </div>

        {/* Filter Tags as Pills */}
        <div className="px-5 pb-2 flex gap-2">
           <button className="px-4 py-1.5 bg-[#232323] hover:bg-[#2A2A2A] text-white text-xs font-medium rounded-full transition-colors border border-transparent hover:border-white/10">Playlists</button>
           <button className="px-4 py-1.5 bg-[#232323] hover:bg-[#2A2A2A] text-white text-xs font-medium rounded-full transition-colors border border-transparent hover:border-white/10">Artists</button>
        </div>

        {/* Library Items */}
        <motion.div 
            className="flex-1 overflow-y-auto hover:overflow-y-scroll px-3 mt-2 pb-4"
            initial="hidden"
            animate="visible"
            variants={{
                visible: { transition: { staggerChildren: 0.05 } }
            }}
        >
            {/* Liked Songs */}
            <motion.div 
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/liked')}
                className="flex items-center gap-4 px-3 py-2 hover:bg-[#1A1A1A] rounded-[16px] cursor-pointer group transition-colors"
            >
                <div className="w-14 h-14 bg-gradient-to-br from-[#450af5] to-[#c4efd9] rounded-[12px] flex items-center justify-center shrink-0">
                    <Heart size={20} fill="white" className="text-white" />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-white font-medium truncate text-[15px]">Liked Songs</span>
                    <div className="flex items-center gap-1 text-sm text-[#B3B3B3] truncate">
                        <span className="text-[#1DB954] -rotate-45">📌</span>
                        <span>Auto Playlist</span>
                    </div>
                </div>
            </motion.div>

             {/* User Playlists */}
             {userPlaylists.map((playlist) => (
                 <motion.div 
                    key={playlist.id} 
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                    className="flex items-center gap-4 px-3 py-2 hover:bg-[#1A1A1A] rounded-[16px] cursor-pointer group transition-colors"
                >
                    <div className="w-14 h-14 bg-[#333] rounded-[12px] shrink-0 overflow-hidden flex items-center justify-center">
                        {playlist.image && playlist.image[0] ? (
                             <img src={getImageUrl(playlist.image)} className="w-full h-full object-cover" alt="" />
                        ) : (
                             <Music size={24} className="text-white/40" />
                        )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-white font-medium truncate text-[15px]">{playlist.title}</span>
                        <span className="text-sm text-[#B3B3B3] truncate">Playlist • {currentUser ? currentUser.name : 'Guest'}</span>
                    </div>
                </motion.div>
             ))}
        </motion.div>
        
        {/* User / Login Section */}
        <div className="p-4 border-t border-[#282828] mt-auto">
             {currentUser ? (
                 <div 
                    onClick={() => navigate('/profile')}
                    className="flex items-center justify-between group cursor-pointer hover:bg-[#2A2A2A] p-2 rounded-full transition-colors"
                >
                     <div className="flex items-center gap-3">
                         {currentUser.image ? (
                             <img src={currentUser.image} alt={currentUser.name} className="w-9 h-9 rounded-full object-cover" />
                         ) : (
                             <div className="w-9 h-9 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-bold">
                                {currentUser.name.charAt(0).toUpperCase()}
                             </div>
                         )}
                         <div className="flex flex-col">
                             <span className="text-sm font-bold truncate max-w-[120px] text-white">{currentUser.name}</span>
                             <span className="text-[10px] text-[#B3B3B3] truncate max-w-[120px]">View Profile</span>
                         </div>
                     </div>
                 </div>
             ) : (
                 <div className="flex flex-col gap-2">
                     <button 
                        onClick={() => navigate('/signup')} 
                        className="w-full bg-white text-black font-bold py-3 rounded-full hover:scale-105 transition-transform"
                    >
                         Sign Up
                     </button>
                     <button 
                        onClick={() => navigate('/login')}
                        className="w-full border border-[#727272] text-white font-bold py-3 rounded-full hover:border-white transition-colors"
                    >
                         Log In
                     </button>
                 </div>
             )}
        </div>
      </div>
    </aside>
  );
};