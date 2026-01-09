import React, { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { X, Send, PlayCircle, StopCircle, Music, Radio, ChevronDown, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ChatWindow: React.FC = () => {
  const { activeChatFriendId, friends, openChat, sendMessage, partySession, startParty, stopParty, currentUser } = usePlayerStore();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const friend = friends.find(f => f.id === activeChatFriendId);

  useEffect(() => {
    if (friend) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [friend?.chatHistory, activeChatFriendId]);

  if (!activeChatFriendId || !friend || !currentUser) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
        sendMessage(friend.id, text);
        setText('');
    }
  };

  const isHostingParty = partySession?.hostId === 'me' && partySession.isActive;

  const formatTime = (ts: number) => {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-0 md:inset-auto md:bottom-0 md:right-4 md:w-[360px] md:h-[500px] bg-[#121212] md:rounded-t-2xl md:border md:border-[#282828] md:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col z-[200] overflow-hidden font-sans"
    >
        
        {/* Header */}
        <div className="bg-[#181818] p-3 flex items-center justify-between border-b border-[#282828] shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={() => openChat(null)} className="md:hidden p-2 -ml-2 text-white">
                    <ArrowLeft size={24} />
                </button>
                <div className="relative">
                    <img src={friend.image || `https://ui-avatars.com/api/?name=${friend.name}&background=1DB954&color=fff`} className="w-10 h-10 rounded-full object-cover shadow-md" alt="" />
                    {friend.status === 'listening' ? (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#1DB954] rounded-full border-2 border-[#121212] flex items-center justify-center">
                            <Music size={8} fill="black" className="text-black" />
                        </div>
                    ) : friend.status === 'online' ? (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#121212]"></div>
                    ) : null}
                </div>
                <div className="flex flex-col">
                    <span className="text-white font-bold text-sm leading-tight">{friend.name}</span>
                    {friend.status === 'listening' && friend.currentSong ? (
                        <span className="text-[11px] text-[#1DB954] flex items-center gap-1 font-medium truncate max-w-[150px]">
                            Listening to {friend.currentSong.name}
                        </span>
                    ) : (
                        <span className="text-[11px] text-[#777] font-medium">
                            {friend.status === 'online' ? 'Active Now' : 'Offline'}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1">
                 <button 
                    onClick={isHostingParty ? stopParty : startParty}
                    className={`p-2 rounded-full transition-all ${isHostingParty ? 'text-[#1DB954] bg-[#1DB954]/10' : 'text-[#B3B3B3] hover:text-white hover:bg-[#282828]'}`}
                    title="Listen Together"
                >
                    <Radio size={20} className={isHostingParty ? "animate-pulse" : ""} />
                 </button>
                 <button onClick={() => openChat(null)} className="hidden md:block p-2 text-[#B3B3B3] hover:text-white hover:bg-[#282828] rounded-full transition-colors">
                    <ChevronDown size={20} />
                </button>
            </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-[#000000] bg-opacity-40">
             <div className="text-[10px] text-center text-[#444] my-2 uppercase tracking-widest font-bold">
                 Encrypted Chat
             </div>

             {friend.chatHistory.map((msg, i) => {
                 const isMe = msg.senderId === currentUser.email;
                 const isConsecutive = i > 0 && friend.chatHistory[i-1].senderId === msg.senderId;
                 
                 return (
                     <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isConsecutive ? 'mt-0.5' : 'mt-2'}`}>
                         <div 
                            className={`max-w-[75%] px-3.5 py-2 text-[15px] md:text-[13px] shadow-sm leading-relaxed relative group ${
                                isMe 
                                ? 'bg-[#1DB954] text-black rounded-2xl rounded-tr-sm' 
                                : 'bg-[#2A2A2A] text-white rounded-2xl rounded-tl-sm'
                            }`}
                         >
                             {msg.text}
                             <div className={`text-[9px] mt-1 opacity-60 text-right ${isMe ? 'text-black' : 'text-gray-400'}`}>
                                 {formatTime(msg.timestamp)}
                             </div>
                         </div>
                     </div>
                 );
             })}
             <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-3 bg-[#181818] border-t border-[#282828] flex items-center gap-2 mb-safe-bottom">
            <input 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#282828] rounded-full px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#555] transition-all placeholder-[#555]"
            />
            <button 
                type="submit" 
                disabled={!text.trim()} 
                className="p-3 bg-[#1DB954] text-black rounded-full hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg"
            >
                <Send size={18} fill="black" className="ml-0.5" />
            </button>
        </form>
    </motion.div>
  );
};