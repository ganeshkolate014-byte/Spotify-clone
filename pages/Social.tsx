import React, { useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { ChatWindow } from '../components/ChatWindow';
import { UserPlus, Music2, ChevronRight, Search, MessageCircle, X, Loader2, User, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Social: React.FC = () => {
  const { friends, openChat, currentUser, searchUsers, searchResults, addContact } = usePlayerStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'chats' | 'search'>('chats');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (val: string) => {
      setQuery(val);
      if (val.length > 2) {
          setIsSearching(true);
          await searchUsers(val);
          setIsSearching(false);
      }
  };

  const handleMessage = async (email: string) => {
      await addContact(email); // Adds to contact list and opens chat
      setQuery('');
      setActiveTab('chats');
  };

  if (!currentUser) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
              <h2 className="text-xl font-bold text-white">Connect with Friends</h2>
              <p className="text-[#B3B3B3]">Log in to chat and see what friends are listening to.</p>
              <button onClick={() => navigate('/login')} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">Log In</button>
          </div>
      );
  }

  return (
    <div className="min-h-full pb-32 bg-black px-4 pt-4">
        
        {/* Header Tabs */}
        <div className="flex items-center gap-6 mb-6 border-b border-[#282828]">
            <button 
                onClick={() => setActiveTab('chats')}
                className={`text-lg font-bold pb-3 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'chats' ? 'text-white border-[#1DB954]' : 'text-[#B3B3B3] border-transparent hover:text-white'}`}
            >
                Chats
            </button>
            <button 
                onClick={() => setActiveTab('search')}
                className={`text-lg font-bold pb-3 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'search' ? 'text-white border-[#1DB954]' : 'text-[#B3B3B3] border-transparent hover:text-white'}`}
            >
                <Search size={18} /> Find People
            </button>
        </div>

        {activeTab === 'chats' && (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
                {/* --- FRIENDS / CHATS LIST --- */}
                {friends.length === 0 ? (
                    <div className="text-center text-[#777] mt-10 bg-[#181818] p-8 rounded-xl border border-[#282828]">
                        <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg text-white font-bold">No chats yet</p>
                        <p className="text-sm mb-4">Find friends to message and share music.</p>
                        <button onClick={() => setActiveTab('search')} className="px-6 py-2 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">Find People</button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {friends.map((friend) => (
                            <div 
                                key={friend.id} 
                                className="flex items-center gap-4 p-4 bg-[#121212] rounded-xl hover:bg-[#1A1A1A] transition-colors cursor-pointer group border border-transparent hover:border-[#333]"
                                onClick={() => openChat(friend.id)}
                            >
                                <div className="relative">
                                    <img src={friend.image || `https://ui-avatars.com/api/?name=${friend.name}`} alt={friend.name} className="w-14 h-14 rounded-full object-cover shadow-lg" />
                                    {friend.status === 'listening' ? (
                                        <div className="absolute -bottom-1 -right-1 bg-[#1DB954] p-1.5 rounded-full border-4 border-[#121212] animate-pulse">
                                            <Music2 size={12} className="text-black" fill="black" />
                                        </div>
                                    ) : friend.status === 'online' && (
                                        <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#121212]"></div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white text-lg truncate">{friend.name}</span>
                                        <span className="text-[11px] text-[#555] font-medium">{friend.status === 'listening' ? 'Now' : 'Offline'}</span>
                                    </div>
                                    
                                    {friend.status === 'listening' && friend.currentSong ? (
                                        <div className="text-[#1DB954] text-sm truncate flex items-center gap-1.5 font-medium">
                                            <Music2 size={14} />
                                            {friend.currentSong.name} <span className="text-white/40">• {friend.currentSong.artists.primary[0]?.name}</span>
                                        </div>
                                    ) : (
                                        <div className="text-[#777] text-sm flex items-center gap-1 group-hover:text-white transition-colors truncate">
                                            {friend.chatHistory.length > 0 ? (
                                                <span className="truncate">{friend.chatHistory[friend.chatHistory.length-1].text}</span>
                                            ) : (
                                                <span>Start a conversation</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <ChevronRight size={20} className="text-[#333] group-hover:text-white transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'search' && (
            <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                <div>
                     <div className="relative mb-6">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#777]" />
                        <input 
                            type="text" 
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full bg-[#1A1A1A] rounded-full py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-[#555] shadow-inner text-base"
                            autoFocus
                        />
                        {isSearching && <Loader2 size={18} className="animate-spin absolute right-4 top-1/2 -translate-y-1/2 text-[#777]" />}
                    </div>

                    <div className="flex flex-col gap-2">
                        {searchResults.map((user) => {
                            const isContact = friends.some(f => f.id === user.email);

                            return (
                                <div key={user.email} className="flex items-center justify-between p-4 bg-[#121212] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <img src={user.image || `https://ui-avatars.com/api/?name=${user.name}`} className="w-12 h-12 rounded-full object-cover" alt="" />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white text-base">{user.name}</span>
                                            <span className="text-xs text-[#555]">{user.email}</span>
                                        </div>
                                    </div>
                                    
                                    {isContact ? (
                                        <button 
                                            onClick={() => openChat(user.email)}
                                            className="px-4 py-2 bg-[#222] text-white text-xs font-bold rounded-full hover:bg-[#333] transition-colors flex items-center gap-2"
                                        >
                                            <MessageCircle size={14} /> Open Chat
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleMessage(user.email)}
                                            className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2 shadow-md"
                                        >
                                            <Send size={14} /> Message
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {query && searchResults.length === 0 && !isSearching && (
                            <div className="text-center text-[#555] text-sm py-10">
                                No users found matching "{query}"
                            </div>
                        )}
                        {!query && (
                             <div className="text-center text-[#555] text-sm py-20 flex flex-col items-center">
                                 <Search size={32} className="mb-2 opacity-20" />
                                 Type a name to start messaging
                             </div>
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