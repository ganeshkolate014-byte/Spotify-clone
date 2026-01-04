import React from 'react';
import { usePlayerStore } from '../store/playerStore';
import { ChatWindow } from '../components/ChatWindow';
import { UserPlus, MessageCircle, Music2, ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Social: React.FC = () => {
  const { friends, openChat, currentUser } = usePlayerStore();
  const navigate = useNavigate();

  if (!currentUser) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
              <h2 className="text-xl font-bold">Connect with Friends</h2>
              <p className="text-[#B3B3B3]">Log in to see what your friends are listening to and chat with them.</p>
              <button onClick={() => navigate('/login')} className="px-8 py-3 bg-white text-black font-bold rounded-full">Log In</button>
          </div>
      );
  }

  return (
    <div className="min-h-full pb-32 bg-black px-4 pt-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Activity</h1>
            <button className="p-2 bg-[#282828] rounded-full hover:bg-[#333] text-white">
                <UserPlus size={20} />
            </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
            <input 
                type="text" 
                placeholder="Find friends by name..."
                className="w-full bg-[#1A1A1A] rounded-md py-2 pl-10 pr-4 text-white focus:outline-none"
            />
        </div>

        {/* Friends List */}
        <div className="flex flex-col gap-2">
            {friends.map((friend) => (
                <div 
                    key={friend.id} 
                    className="flex items-center gap-4 p-3 bg-[#121212] rounded-lg active:bg-[#1A1A1A] transition-colors"
                    onClick={() => openChat(friend.id)}
                >
                    <div className="relative">
                        <img src={friend.image} alt={friend.name} className="w-12 h-12 rounded-full object-cover" />
                        {friend.status === 'listening' && (
                             <div className="absolute -bottom-1 -right-1 bg-[#1DB954] p-1 rounded-full border-2 border-[#121212]">
                                 <Music2 size={10} className="text-black" />
                             </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white text-base truncate">{friend.name}</span>
                            <span className="text-[10px] text-[#555]">{friend.status === 'listening' ? 'Now' : '1h ago'}</span>
                        </div>
                        
                        {friend.status === 'listening' && friend.currentSong ? (
                             <div className="text-[#1DB954] text-xs truncate flex items-center gap-1">
                                 <Music2 size={12} />
                                 {friend.currentSong.name} • {friend.currentSong.artists.primary[0]?.name}
                             </div>
                        ) : (
                             <div className="text-[#B3B3B3] text-xs">Tap to chat</div>
                        )}
                    </div>
                    
                    <ChevronRight size={16} className="text-[#333]" />
                </div>
            ))}
        </div>
        
        {/* Embed Chat for Mobile Logic (Will appear as popup if active) */}
        <ChatWindow />
    </div>
  );
};