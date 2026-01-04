import React from 'react';
import { usePlayerStore } from '../store/playerStore';
import { UserPlus, MessageCircle, Music2, Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FriendsActivity: React.FC = () => {
  const { friends, openChat, currentUser } = usePlayerStore();
  const navigate = useNavigate();

  if (!currentUser) return null;

  return (
    <aside className="hidden lg:flex w-[280px] bg-black flex-col border-l border-[#282828] h-full p-4 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 text-[#B3B3B3]">
            <span className="font-bold text-base text-white">Friend Activity</span>
            <button className="hover:text-white transition-colors">
                <UserPlus size={20} />
            </button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar flex-1">
            {friends.map((friend) => (
                <div 
                    key={friend.id} 
                    className="flex items-start gap-3 group cursor-pointer p-2 rounded-md hover:bg-[#1A1A1A] transition-colors"
                    onClick={() => openChat(friend.id)}
                >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <img src={friend.image} alt={friend.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        {friend.status === 'listening' && (
                             <div className="absolute -top-1 -right-1 bg-[#1DB954] text-black p-[2px] rounded-full border border-black">
                                 <Headphones size={10} fill="black" />
                             </div>
                        )}
                        {friend.status === 'online' && (
                             <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#1DB954] rounded-full border-2 border-black"></div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className="text-white font-bold text-sm truncate">{friend.name}</span>
                            <MessageCircle size={14} className="text-[#B3B3B3] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        
                        {friend.status === 'listening' && friend.currentSong ? (
                            <div className="flex flex-col mt-1">
                                <span className="text-[#B3B3B3] text-xs truncate">{friend.currentSong.name}</span>
                                <div className="flex items-center gap-1 text-[#B3B3B3] text-[10px]">
                                    <Music2 size={8} />
                                    <span className="truncate">{friend.currentSong.artists.primary[0]?.name}</span>
                                </div>
                            </div>
                        ) : (
                            <span className="text-[#B3B3B3] text-xs mt-0.5">Online</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-[#282828]">
            <button className="w-full py-3 rounded-full border border-[#555] text-white text-sm font-bold hover:border-white transition-colors">
                Find Friends
            </button>
        </div>
    </aside>
  );
};