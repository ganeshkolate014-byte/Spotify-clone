import React from 'react';
import { Home, Search, Library } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const baseClass = "flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-[#B3B3B3] hover:text-white transition-colors flex-1 pb-4 pt-4";
  const activeClass = "text-white";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-transparent flex items-end justify-around z-40">
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
            <Library size={24} strokeWidth={isActive ? 0 : 2} fill={isActive ? "white" : "none"} />
            <span>Your Library</span>
          </>
        )}
      </NavLink>
    </div>
  );
};