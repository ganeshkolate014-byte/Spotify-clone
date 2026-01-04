import React, { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { X, Send, PlayCircle, StopCircle, Music, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ChatWindow: React.FC = () => {
  const { activeChatFriendId, friends, openChat, sendMessage, partySession, startParty, stopParty, currentUser, currentSong } = usePlayerStore();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const friend = friends.find(f => f.id === activeChatFriendId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  return (
    <div className="fixed bottom-24 right-4 w-[340px] h-[450px] bg-[#181818] rounded-t-xl rounded-b-lg border border-[#333] shadow-2xl flex flex-col z-[100] overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#282828] p-3 flex items-center justify-between border-b border-[#333]">
            <div className="flex items-center gap-2">
                <div className="relative">
                    <img src={friend.image} className="w-8 h-8 rounded-full object-cover" alt="" />
                    {friend.status === 'listening' && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#1DB954] rounded-full border border-[#282828]"></div>}
                </div>
                <div className="flex flex-col">
                    <span className="text-white font-bold text-sm hover:underline cursor-pointer">{friend.name}</span>
                    {friend.status === 'listening' && friend.currentSong ? (
                        <span className="text-[10px] text-[#1DB954] flex items-center gap-1 animate-pulse">
                            <Music size={8} /> Listening now
                        </span>
                    ) : (
                        <span className="text-[10px] text-[#B3B3B3]">Active now</span>
                    )}
                </div>
            </div>
            <button onClick={() => openChat(null)} className="text-[#B3B3B3] hover:text-white p-1">
                <X size={18} />
            </button>
        </div>

        {/* Party Mode Banner */}
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-2 flex items-center justify-between">
             {isHostingParty ? (
                 <div className="flex items-center gap-2 text-xs text-white px-2">
                     <Radio size={14} className="animate-pulse text-[#1DB954]" />
                     <span>Broadcasting your music...</span>
                 </div>
             ) : (
                 <span className="text-xs text-white/80 px-2 font-medium">Listen together in real-time</span>
             )}
             
             <button 
                onClick={isHostingParty ? stopParty : startParty}
                className={`text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 transition-colors ${isHostingParty ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' : 'bg-[#1DB954] text-black hover:scale-105'}`}
             >
                {isHostingParty ? (
                    <> <StopCircle size={12} /> End Party </>
                ) : (
                    <> <PlayCircle size={12} /> Start Party </>
                )}
             </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#121212]">
             {/* System Msg */}
             <div className="text-[10px] text-center text-[#555] my-2">
                 Chat is encrypted. {friend.name} uses VibeStream.
             </div>

             {friend.chatHistory.map(msg => (
                 <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${msg.senderId === 'me' ? 'bg-[#1DB954] text-black rounded-tr-sm' : 'bg-[#333] text-white rounded-tl-sm'}`}>
                         {msg.text}
                     </div>
                 </div>
             ))}
             <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-[#181818] border-t border-[#333] flex gap-2">
            <input 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Message ${friend.name.split(' ')[0]}...`}
                className="flex-1 bg-[#282828] rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#555]"
            />
            <button type="submit" disabled={!text.trim()} className="p-2 bg-[#1DB954] text-black rounded-full hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all">
                <Send size={16} />
            </button>
        </form>
    </div>
  );
};