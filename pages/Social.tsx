import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { ChatWindow } from '../components/ChatWindow';
import { UserPlus, MessageCircle, Music2, ChevronRight, Search, Check, X, Loader2, User, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Social: React.FC = () => {
  const { friends, friendRequests, openChat, currentUser, searchUsers, searchResults, sendFriendRequest, acceptFriendRequest, refreshFriendsActivity } = usePlayerStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'activity' | 'add'>('activity');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [requestStatus, setRequestStatus] = useState<{[email: string]: 'sent' | 'error' | null}>({});

  useEffect(() => {
      if (currentUser) {
          refreshFriendsActivity();
          const interval = setInterval(refreshFriendsActivity, 30000); // Poll every 30s
          return () => clearInterval(interval);
      }
  }, [currentUser]);

  const handleSearch = async (val: string) => {
      setQuery(val);
      if (val.length > 2) {
          setIsSearching(true);
          await searchUsers(val);
          setIsSearching(false);
      }
  };

  const handleSendRequest = async (email: string) => {
      setRequestStatus(prev => ({...prev, [email]: null}));
      try {
          await sendFriendRequest(email);
          setRequestStatus(prev => ({...prev, [email]: 'sent'}));
      } catch (e) {
          setRequestStatus(prev => ({...prev, [email]: 'error'}));
      }
  };

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
        
        {/* Header Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-[#282828] pb-2">
            <button 
                onClick={() => setActiveTab('activity')}
                className={`text-xl font-bold pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'activity' ? 'text-white border-[#1DB954]' : 'text-[#B3B3B3] border-transparent'}`}
            >
                Activity
                {friendRequests.length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{friendRequests.length}</span>
                )}
            </button>
            <button 
                onClick={() => setActiveTab('add')}
                className={`text-xl font-bold pb-2 border-b-2 transition-colors ${activeTab === 'add' ? 'text-white border-[#1DB954]' : 'text-[#B3B3B3] border-transparent'}`}
            >
                Find Friends
            </button>
        </div>

        {activeTab === 'activity' && (
            <div className="flex flex-col gap-4">
                
                {/* --- PENDING REQUESTS (Visible here for easy Mobile access) --- */}
                {friendRequests.length > 0 && (
                    <div className="bg-[#181818] rounded-xl p-4 border border-[#333]">
                        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                            <UserCheck size={18} className="text-[#1DB954]" />
                            Friend Requests
                        </h3>
                        <div className="flex flex-col gap-3">
                            {friendRequests.map((req, i) => (
                                <div key={i} className="flex items-center justify-between bg-[#121212] p-2 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {req.fromImage ? (
                                            <img src={req.fromImage} className="w-10 h-10 rounded-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-10 h-10 bg-[#333] rounded-full flex items-center justify-center"><User size={20}/></div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-white">{req.fromName}</span>
                                            <span className="text-[10px] text-[#777]">wants to connect</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => acceptFriendRequest(req.fromEmail)} className="p-2 bg-[#1DB954] rounded-full text-black hover:scale-105 active:scale-95 shadow-md">
                                            <Check size={18} strokeWidth={3} />
                                        </button>
                                        <button className="p-2 bg-[#333] rounded-full text-white hover:bg-[#444] active:scale-95">
                                            <X size={18} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- FRIENDS LIST --- */}
                {friends.length === 0 ? (
                    <div className="text-center text-[#777] mt-10">
                        <p>You haven't added any friends yet.</p>
                        <button onClick={() => setActiveTab('add')} className="text-[#1DB954] font-bold mt-2 hover:underline">Find people</button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {friends.map((friend) => (
                            <div 
                                key={friend.id} 
                                className="flex items-center gap-4 p-3 bg-[#121212] rounded-lg active:bg-[#1A1A1A] transition-colors cursor-pointer"
                                onClick={() => openChat(friend.id)}
                            >
                                <div className="relative">
                                    <img src={friend.image || 'https://via.placeholder.com/150'} alt={friend.name} className="w-12 h-12 rounded-full object-cover" />
                                    {friend.status === 'listening' && (
                                        <div className="absolute -bottom-1 -right-1 bg-[#1DB954] p-1 rounded-full border-2 border-[#121212]">
                                            <Music2 size={10} className="text-black" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white text-base truncate">{friend.name}</span>
                                        <span className="text-[10px] text-[#555]">{friend.status === 'listening' ? 'Now' : 'Offline'}</span>
                                    </div>
                                    
                                    {friend.status === 'listening' && friend.currentSong ? (
                                        <div className="text-[#1DB954] text-xs truncate flex items-center gap-1">
                                            <Music2 size={12} />
                                            {friend.currentSong.name}
                                        </div>
                                    ) : (
                                        <div className="text-[#B3B3B3] text-xs">Tap to chat</div>
                                    )}
                                </div>
                                
                                <ChevronRight size={16} className="text-[#333]" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'add' && (
            <div className="flex flex-col gap-6">
                
                {/* Search */}
                <div>
                     <h3 className="text-white font-bold mb-3">Search Users</h3>
                     <div className="relative mb-4">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
                        <input 
                            type="text" 
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Enter name..."
                            className="w-full bg-[#1A1A1A] rounded-md py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-[#333]"
                        />
                        {isSearching && <Loader2 size={16} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-[#777]" />}
                    </div>

                    <div className="flex flex-col gap-2">
                        {searchResults.map((user) => {
                            const isFriend = friends.some(f => f.id === user.email);
                            const status = requestStatus[user.email];

                            return (
                                <div key={user.email} className="flex items-center justify-between p-3 hover:bg-[#121212] rounded-lg transition-colors border border-transparent hover:border-[#333]">
                                    <div className="flex items-center gap-3">
                                        {user.image ? (
                                            <img src={user.image} className="w-10 h-10 rounded-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-10 h-10 bg-[#333] rounded-full flex items-center justify-center"><User size={20}/></div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{user.name}</span>
                                        </div>
                                    </div>
                                    
                                    {isFriend ? (
                                        <span className="text-xs text-[#777] font-medium">Friends</span>
                                    ) : status === 'sent' ? (
                                        <span className="text-xs text-[#1DB954] font-medium flex items-center gap-1"><Check size={12}/> Sent</span>
                                    ) : (
                                        <button 
                                            onClick={() => handleSendRequest(user.email)}
                                            className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-1"
                                        >
                                            <UserPlus size={14} /> Add
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {query && searchResults.length === 0 && !isSearching && (
                            <div className="text-center text-[#555] text-sm py-4">No users found.</div>
                        )}
                    </div>
                </div>
            </div>
        )}
        
        <div className="md:hidden">
             <ChatWindow />
        </div>
    </div>
  );
};