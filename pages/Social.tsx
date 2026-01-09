import React, { useState } from 'react';
import { Search, UserPlus, MessageCircle, Music2, Headphones, Loader2, X } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const Social: React.FC = () => {
  const { friends, searchUsers, searchResults, addContact, openChat, currentUser } = usePlayerStore();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'add'>('friends');

  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;
      setIsSearching(true);
      await searchUsers(query);
      setIsSearching(false);
  };

  const handleAdd = async (email: string) => {
      await addContact(email);
      setQuery('');
      setActiveTab('friends');
  };

  if (!currentUser) {
      return (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
              <h2 className="text-2xl font-bold">Connect with Friends</h2>
              <p className="text-secondary">Log in to see what your friends are listening to and chat with them.</p>
              <button onClick={() => navigate('/login')} className="px-8 py-3 bg-white text-black font-bold rounded-full">Log In</button>
          </div>
      );
  }

  return (
    <div className="min-h-full pb-32 bg-[#121212] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[#121212] border-b border-white/5 p-4">
            <h1 className="text-2xl font-bold mb-4 px-2">Social</h1>
            
            {/* Tabs */}
            <div className="flex bg-[#2A2A2A] p-1 rounded-full w-full max-w-md">
                <button 
                    onClick={() => setActiveTab('friends')}
                    className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'friends' ? 'bg-[#1DB954] text-black shadow-md' : 'text-[#B3B3B3] hover:text-white'}`}
                >
                    Friends ({friends.length})
                </button>
                <button 
                    onClick={() => setActiveTab('add')}
                    className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'add' ? 'bg-white text-black shadow-md' : 'text-[#B3B3B3] hover:text-white'}`}
                >
                    Add Friends
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
            
            <AnimatePresence mode="wait">
                {activeTab === 'friends' ? (
                    <motion.div 
                        key="friends-list"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex flex-col gap-2"
                    >
                        {friends.length === 0 ? (
                            <div className="text-center py-20 text-secondary">
                                <UsersIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>You haven't added any friends yet.</p>
                                <button onClick={() => setActiveTab('add')} className="text-[#1DB954] font-bold mt-2 hover:underline">Find friends</button>
                            </div>
                        ) : (
                            friends.map(friend => (
                                <div 
                                    key={friend.id}
                                    onClick={() => openChat(friend.id)}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#2A2A2A] cursor-pointer group transition-colors bg-[#181818]"
                                >
                                    <div className="relative">
                                        <img 
                                            src={friend.image || `https://ui-avatars.com/api/?name=${friend.name}&background=random`} 
                                            alt={friend.name} 
                                            className="w-12 h-12 rounded-full object-cover shadow-sm"
                                        />
                                        {friend.status === 'listening' ? (
                                            <div className="absolute -top-1 -right-1 bg-[#1DB954] p-1 rounded-full border-2 border-[#181818]">
                                                <Headphones size={10} className="text-black" />
                                            </div>
                                        ) : friend.status === 'online' && (
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#181818]"></div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-white truncate">{friend.name}</span>
                                            <span className="text-[10px] text-secondary">
                                                {friend.lastActive ? new Date(friend.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                            </span>
                                        </div>
                                        
                                        {friend.status === 'listening' && friend.currentSong ? (
                                            <div className="flex items-center gap-1 text-[#1DB954] text-xs mt-1">
                                                <Music2 size={12} />
                                                <span className="truncate">{friend.currentSong.name} • {friend.currentSong.artists.primary[0]?.name}</span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-secondary mt-1 truncate">
                                                {friend.chatHistory.length > 0 
                                                    ? `Last: ${friend.chatHistory[friend.chatHistory.length-1].text}` 
                                                    : 'Tap to chat'}
                                            </p>
                                        )}
                                    </div>

                                    <button className="p-2 rounded-full hover:bg-white/10 text-secondary hover:text-white transition-colors">
                                        <MessageCircle size={20} />
                                    </button>
                                </div>
                            ))
                        )}
                    </motion.div>
                ) : (
                    <motion.div 
                        key="add-friends"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col gap-4"
                    >
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={20} />
                            <input 
                                type="text" 
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by name or email"
                                className="w-full bg-[#2A2A2A] text-white pl-10 pr-10 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1DB954] placeholder:text-secondary"
                            />
                            {query && (
                                <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-white">
                                    <X size={16} />
                                </button>
                            )}
                        </form>

                        {isSearching ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="animate-spin text-[#1DB954]" />
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-2">Results</h3>
                                {searchResults.map((user, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-[#181818] rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-lg font-bold">
                                                {user.image ? <img src={user.image} className="w-full h-full rounded-full object-cover" /> : user.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold">{user.name}</span>
                                                <span className="text-xs text-secondary">{user.email}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleAdd(user.email)}
                                            className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:scale-105 transition-transform flex items-center gap-1"
                                        >
                                            <UserPlus size={14} /> Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : query && !isSearching ? (
                            <div className="text-center py-10 text-secondary">No users found.</div>
                        ) : (
                            <div className="text-center py-10 text-secondary text-sm">
                                Search for friends to add them to your social circle.
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};

const UsersIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);