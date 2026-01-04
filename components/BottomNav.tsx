import React from 'react';
import { Home, Search, Library, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';

export const BottomNav: React.FC = () => {
  const baseClass = "flex flex-col items-center justify-center gap-[4px] text-[10px] font-medium text-[#B3B3B3] hover:text-white transition-colors w-full h-full relative";
  const activeClass = "text-white";
  const { friendRequests } = usePlayerStore();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] z-[100] bg-gradient-to-t from-black via-black to-black/95 border-t border-[#121212]">
       <div className="flex items-center justify-between h-full px-2">
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
          <NavLink to="/library" className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ''}`}>
            {({ isActive }) => (
              <>
                <Library size={24} strokeWidth={isActive ? 3 : 2} />
                <span>Library</span>
              </>
            )}
          </NavLink>
           <NavLink to="/social" className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ''}`}>
            {({ isActive }) => (
              <>
                <div className="relative">
                    <Users size={24} strokeWidth={isActive ? 3 : 2} />
                    {friendRequests.length > 0 && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black animate-pulse"></div>
                    )}
                </div>
                <span>Friends</span>
              </>
            )}
          </NavLink>
      </div>
    </div>
  );
};