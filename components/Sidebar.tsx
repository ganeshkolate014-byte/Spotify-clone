import React from 'react';
import { Home, Search, Library, Plus, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const activeClass = "text-white";
  const baseClass = "flex items-center gap-5 px-6 py-3 text-[#B3B3B3] hover:text-white font-bold transition-colors";

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
          <div className="flex items-center gap-2 text-[#B3B3B3] hover:text-white transition-colors cursor-pointer px-2">
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
            <div className="flex items-center gap-3 px-2 py-2 hover:bg-[#1A1A1A] rounded-md cursor-pointer group transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-[#450af5] to-[#c4efd9] rounded-sm flex items-center justify-center shrink-0">
                    <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 24 24" fill="white"><path d="M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.272 4.272 0 0 0-6.21 5.855l5.916 7.05a1.128 1.128 0 0 0 1.727 0l5.916-7.05a4.228 4.228 0 0 0 .945-3.577z"></path></svg>
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-white font-medium truncate">Liked Songs</span>
                    <div className="flex items-center gap-1 text-sm text-[#B3B3B3] truncate">
                        <span className="text-[#1DB954] -rotate-45">📌</span>
                        <span>Auto Playlist</span>
                    </div>
                </div>
            </div>

             {/* Fake List */}
             {[
                { name: "Chill Hits", type: "Playlist", owner: "Spotify" },
                { name: "Top 50 - Global", type: "Playlist", owner: "Spotify" },
                { name: "Ed Sheeran", type: "Artist", owner: "" },
                { name: "Discover Weekly", type: "Playlist", owner: "Spotify" },
                { name: "Phonk Gaming", type: "Playlist", owner: "User" },
             ].map((item, i) => (
                 <div key={i} className="flex items-center gap-3 px-2 py-2 hover:bg-[#1A1A1A] rounded-md cursor-pointer group transition-colors">
                    <div className={`w-12 h-12 bg-[#333] ${item.type === 'Artist' ? 'rounded-full' : 'rounded-sm'} shrink-0 overflow-hidden`}>
                        <img src={`https://picsum.photos/seed/${item.name}/50`} className="w-full h-full object-cover opacity-80" alt="" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className={`text-white font-medium truncate ${item.name === 'Top 50 - Global' ? 'text-[#1DB954]' : ''}`}>{item.name}</span>
                        <span className="text-sm text-[#B3B3B3] truncate">{item.type} {item.owner ? `• ${item.owner}` : ''}</span>
                    </div>
                </div>
             ))}
        </div>
      </div>
    </aside>
  );
};