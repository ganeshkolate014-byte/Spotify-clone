import React from 'react';
import { Home, Search, Library, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

export const BottomNav: React.FC = () => {
  // Material 3 style: Active state has a pill around the icon
  
  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
      className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] z-[160] bg-[#121212] border-t border-white/5 pb-4"
    >
       <div className="flex items-center justify-around h-full px-2">
          <NavLink to="/" className="flex flex-col items-center gap-1 w-full text-[#B3B3B3]">
            {({ isActive }) => (
              <>
                <div className={`px-5 py-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-white text-black' : 'bg-transparent text-[#B3B3B3]'}`}>
                    <Home size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-white' : 'text-[#B3B3B3]'}`}>Home</span>
              </>
            )}
          </NavLink>

          <NavLink to="/search" className="flex flex-col items-center gap-1 w-full text-[#B3B3B3]">
            {({ isActive }) => (
              <>
                <div className={`px-5 py-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-white text-black' : 'bg-transparent text-[#B3B3B3]'}`}>
                    <Search size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-white' : 'text-[#B3B3B3]'}`}>Search</span>
              </>
            )}
          </NavLink>

          <NavLink to="/library" className="flex flex-col items-center gap-1 w-full text-[#B3B3B3]">
            {({ isActive }) => (
              <>
                <div className={`px-5 py-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-white text-black' : 'bg-transparent text-[#B3B3B3]'}`}>
                    <Library size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-white' : 'text-[#B3B3B3]'}`}>Library</span>
              </>
            )}
          </NavLink>

           <NavLink to="/social" className="flex flex-col items-center gap-1 w-full text-[#B3B3B3]">
            {({ isActive }) => (
              <>
                <div className={`px-5 py-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-white text-black' : 'bg-transparent text-[#B3B3B3]'}`}>
                    <Users size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-white' : 'text-[#B3B3B3]'}`}>Social</span>
              </>
            )}
          </NavLink>
      </div>
    </motion.div>
  );
};