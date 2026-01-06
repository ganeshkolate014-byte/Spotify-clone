import React from 'react';
import { X, Download, Check, FileAudio } from 'lucide-react';
import { Song } from '../types';
import { usePlayerStore } from '../store/playerStore';

interface DownloadQualityModalProps {
  song: Song;
  onClose: () => void;
}

export const DownloadQualityModal: React.FC<DownloadQualityModalProps> = ({ song, onClose }) => {
  const { startDownload } = usePlayerStore();

  const qualities = song.downloadUrl.slice().sort((a, b) => {
      // Sort by bitrate (assuming simple string comparison of quality names like "320kbps", "160kbps")
      // Extract number
      const getBitrate = (q: string) => parseInt(q.replace(/\D/g, '')) || 0;
      return getBitrate(b.quality) - getBitrate(a.quality);
  });

  const handleDownload = (url: string, quality: string) => {
      const filename = `${song.name} (${quality}) - ${song.artists.primary[0]?.name || 'Artist'}.mp3`;
      startDownload(song, url, filename);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#1E1E1E] w-full max-w-md rounded-2xl md:rounded-xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3 overflow-hidden">
                    <FileAudio className="text-[#1DB954] shrink-0" size={24} />
                    <div className="flex flex-col overflow-hidden">
                         <span className="font-bold text-white truncate">Download Quality</span>
                         <span className="text-xs text-[#B3B3B3] truncate">{song.name}</span>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white">
                    <X size={20} />
                </button>
            </div>
            
            <div className="p-2 flex flex-col gap-1">
                {qualities.map((option, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleDownload(option.url, option.quality)}
                        className="flex items-center justify-between p-3 hover:bg-[#2A2A2A] rounded-lg group transition-colors text-left"
                    >
                        <div className="flex flex-col">
                            <span className="text-white font-medium text-sm">
                                {option.quality.toUpperCase()}
                            </span>
                            <span className="text-xs text-[#777]">
                                {option.quality.includes('320') ? 'Very High (Best)' : 
                                 option.quality.includes('160') ? 'High' : 
                                 option.quality.includes('96') ? 'Normal' : 'Low (Data Saver)'}
                            </span>
                        </div>
                        <div className="bg-[#2A2A2A] group-hover:bg-[#3E3E3E] p-2 rounded-full text-[#B3B3B3] group-hover:text-white transition-colors">
                            <Download size={18} />
                        </div>
                    </button>
                ))}
            </div>
            
             <div className="p-4 bg-[#181818] text-center">
                <button onClick={onClose} className="text-sm font-bold text-white/50 hover:text-white">Cancel</button>
            </div>
        </div>
    </div>
  );
};