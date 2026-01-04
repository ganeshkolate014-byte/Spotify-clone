import React from 'react';
import { Home, Search, Library, Plus, ArrowRight, Heart, Music, UserCircle, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { getImageUrl } from '../services/api';

export const Sidebar: React.FC = () => {
  const activeClass = "text-white";
  const baseClass = "flex items-center gap-5 px-6 py-3 text-[#B3B3B3] hover:text-white font-bold transition-colors";
  const { userPlaylists, currentUser } = usePlayerStore();
  const navigate = useNavigate();

  return (
    <aside className="w-[350px] bg-black flex flex-col h-full gap-2 p-2 hidden md:flex">
      {/* Navigation Block */}
      <div className="bg-[#121212] rounded-lg py-2 flex flex-col">
        <NavLink to="/" className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ''}`}>
          {({ isActive }) => (
             <>
               <Home size={24} strokeWidth={isActive ? 0 : 2} fill={isActive ? "white" : "none"} />
               <span>Home</span>
             </>
          )}
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ''}`}>
          {({ isActive }) => (
             <>
               <Search size={24} strokeWidth={isActive ? 3 : 2} />
               <span>Search</span>
             </>
          )}
        </NavLink>
      </div>

      {/* Library Block */}
      <div className="bg-[#121212] rounded-lg flex-1 flex flex-col overflow-hidden">
        {/* Library Header */}
        <div className="flex items-center justify-between px-4 py-4 shadow-sm z-10">
          <div 
             className="flex items-center gap-2 text-[#B3B3B3] hover:text-white transition-colors cursor-pointer px-2"
             onClick={() => navigate('/library')}
          >
             <Library size={24} strokeWidth={2} />
             <span className="font-bold">Your Library</span>
          </div>
          <div className="flex items-center gap-1">
             <button className="p-2 text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] rounded-full transition-colors">
                <Plus size={20} />
             </button>
             <button className="p-2 text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] rounded-full transition-colors">
                <ArrowRight size={20} />
             </button>
          </div>
        </div>

        {/* Filter Tags */}
        <div className="px-4 pb-2 flex gap-2">
           <button className="px-3 py-1 bg-[#232323] hover:bg-[#2A2A2A] text-white text-xs font-medium rounded-full transition-colors">Playlists</button>
           <button className="px-3 py-1 bg-[#232323] hover:bg-[#2A2A2A] text-white text-xs font-medium rounded-full transition-colors">Artists</button>
        </div>

        {/* Library Items */}
        <div className="flex-1 overflow-y-auto hover:overflow-y-scroll px-2 mt-2">
            {/* Liked Songs */}
            <div 
                onClick={() => navigate('/liked')}
                className="flex items-center gap-3 px-2 py-2 hover:bg-[#1A1A1A] rounded-md cursor-pointer group transition-colors"
            >
                <div className="w-12 h-12 bg-gradient-to-br from-[#450af5] to-[#c4efd9] rounded-sm flex items-center justify-center shrink-0">
                    <Heart size={16} fill="white" className="text-white" />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-white font-medium truncate">Liked Songs</span>
                    <div className="flex items-center gap-1 text-sm text-[#B3B3B3] truncate">
                        <span className="text-[#1DB954] -rotate-45">📌</span>
                        <span>Auto Playlist</span>
                    </div>
                </div>
            </div>

             {/* User Playlists */}
             {userPlaylists.map((playlist) => (
                 <div 
                    key={playlist.id} 
                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                    className="flex items-center gap-3 px-2 py-2 hover:bg-[#1A1A1A] rounded-md cursor-pointer group transition-colors"
                >
                    <div className="w-12 h-12 bg-[#333] rounded-sm shrink-0 overflow-hidden flex items-center justify-center">
                        {playlist.image && playlist.image[0] ? (
                             <img src={getImageUrl(playlist.image)} className="w-full h-full object-cover" alt="" />
                        ) : (
                             <Music size={20} className="text-white/40" />
                        )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-white font-medium truncate">{playlist.title}</span>
                        <span className="text-sm text-[#B3B3B3] truncate">Playlist • {currentUser ? currentUser.name : 'Guest'}</span>
                    </div>
                </div>
             ))}
        </div>
        
        {/* User / Login Section */}
        <div className="p-4 border-t border-[#282828] mt-auto">
             {currentUser ? (
                 <div 
                    onClick={() => navigate('/profile')}
                    className="flex items-center justify-between group cursor-pointer hover:bg-[#2A2A2A] p-2 rounded-md transition-colors"
                 >
                     <div className="flex items-center gap-3">
                         {currentUser.image ? (
                             <img src={currentUser.image} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover" />
                         ) : (
                             <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-bold">
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
                        className="w-full bg-white text-black font-bold py-2 rounded-full hover:scale-105 transition-transform"
                    >
                         Sign Up
                     </button>
                     <button 
                        onClick={() => navigate('/login')}
                        className="w-full border border-[#727272] text-white font-bold py-2 rounded-full hover:border-white transition-colors"
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