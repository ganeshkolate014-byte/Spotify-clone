import React from 'react';
import { Hammer, Construction, Bot } from 'lucide-react';

export const Social: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-6 animate-in fade-in duration-500">
        <div className="relative">
            <div className="absolute inset-0 bg-[#1DB954]/20 blur-3xl rounded-full"></div>
            <Construction size={80} className="text-[#1DB954] relative z-10 animate-pulse" />
        </div>
        
        <div className="flex flex-col gap-2 max-w-md">
            <h2 className="text-3xl font-black text-white tracking-tight">Social System Upgrade</h2>
            <p className="text-[#B3B3B3] text-lg leading-relaxed">
                We are currently rebuilding the chat and realtime infrastructure to be faster and more secure.
            </p>
        </div>

        <div className="bg-[#181818] p-6 rounded-xl border border-white/5 max-w-sm w-full mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <Bot size={24} className="text-blue-400" />
                <div className="text-left">
                    <h3 className="font-bold text-white">AI Upgrades</h3>
                    <p className="text-xs text-[#777]">Implementing smarter recommendations</p>
                </div>
            </div>
            <div className="h-[1px] bg-white/10 w-full"></div>
            <div className="flex items-center gap-4">
                <Hammer size={24} className="text-orange-400" />
                <div className="text-left">
                    <h3 className="font-bold text-white">Server Maintenance</h3>
                    <p className="text-xs text-[#777]">Optimizing database performance</p>
                </div>
            </div>
        </div>

        <span className="text-xs font-mono text-[#555] mt-8 uppercase tracking-widest">Estimated Return: Soon</span>
    </div>
  );
};