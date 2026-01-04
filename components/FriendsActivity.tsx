import React from 'react';
import { usePlayerStore } from '../store/playerStore';
import { UserPlus, MessageCircle, Music2, Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FriendsActivity: React.FC = () => {
  const { friends, openChat, currentUser } = usePlayerStore();
  const navigate = useNavigate();

  if (!currentUser) return null;

  return (
    <aside className="hidden lg:flex w-[300px] bg-black flex-col border-l border-[#282828] h-full p-0 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 mb-2 text-[#B3B3B3]">
            <span className="font-bold text-base text-white">Friend Activity</span>
            <button className="hover:text-white transition-colors" onClick={() => navigate('/social')}>
                <UserPlus size={20} />
            </button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar flex-1 px-2">
            {friends.map((friend) => (
                <div 
                    key={friend.id} 
                    className="flex items-center gap-3 group cursor-pointer p-3 rounded-lg hover:bg-[#1A1A1A] transition-colors"
                    onClick={() => openChat(friend.id)}
                >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <img src={friend.image || `https://ui-avatars.com/api/?name=${friend.name}&background=random`} alt={friend.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                        
                        {/* Status Indicators */}
                        {friend.status === 'listening' ? (
                             <div className="absolute -top-1 -right-1 bg-[#1DB954] text-black w-4 h-4 rounded-full border-2 border-black flex items-center justify-center">
                                 <Headphones size={8} fill="black" />
                             </div>
                        ) : friend.status === 'online' && (
                             <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#1DB954] rounded-full border-2 border-black"></div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className="text-white font-bold text-sm truncate">{friend.name}</span>
                        </div>
                        
                        {friend.status === 'listening' && friend.currentSong ? (
                            <div className="flex flex-col">
                                <span className="text-[#1DB954] text-xs truncate font-medium">{friend.currentSong.name}</span>
                                <div className="flex items-center gap-1 text-[#B3B3B3] text-[10px] mt-0.5">
                                    <span className="truncate">• {friend.currentSong.artists.primary[0]?.name}</span>
                                </div>
                            </div>
                        ) : (
                            <span className="text-[#B3B3B3] text-xs mt-0.5 font-medium">
                                {friend.status === 'online' ? 'Online' : 'Offline'}
                            </span>
                        )}
                    </div>
                    
                    {/* Equalizer Animation if listening */}
                    {friend.status === 'listening' && (
                        <div className="flex gap-[2px] h-3 items-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-[3px] bg-[#1DB954] animate-[bounce_1s_infinite] h-2"></div>
                            <div className="w-[3px] bg-[#1DB954] animate-[bounce_1.2s_infinite] h-3"></div>
                            <div className="w-[3px] bg-[#1DB954] animate-[bounce_0.8s_infinite] h-1.5"></div>
                        </div>
                    )}
                </div>
            ))}
            
            {friends.length === 0 && (
                <div className="text-center px-6 mt-10">
                    <p className="text-[#B3B3B3] text-sm">Let friends and followers see what you're listening to.</p>
                </div>
            )}
        </div>
        
        <div className="p-4 border-t border-[#282828] mt-auto">
             <button 
                onClick={() => navigate('/social')}
                className="w-full py-3 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-transform"
            >
                Find Friends
            </button>
        </div>
    </aside>
  );
};