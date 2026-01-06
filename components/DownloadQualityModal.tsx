import React from 'react';
import { X, Download, Zap, Wifi, HardDrive, Music2, Check } from 'lucide-react';
import { Song } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { motion } from 'framer-motion';

interface DownloadQualityModalProps {
  song: Song;
  onClose: () => void;
}

export const DownloadQualityModal: React.FC<DownloadQualityModalProps> = ({ song, onClose }) => {
  const { startDownload } = usePlayerStore();

  const handleDownload = (url: string, quality: string) => {
      const filename = `${song.name} (${quality}) - ${song.artists.primary[0]?.name || 'Artist'}.mp3`;
      startDownload(song, url, filename);
      onClose();
  };

  // Helper to map quality to metadata
  const getMetadata = (quality: string) => {
      const bitrate = parseInt(quality.replace(/\D/g, '')) || 0;
      if (bitrate >= 320) return { label: 'Lossless-like', icon: Zap, color: 'from-purple-500 to-indigo-500', size: '~8 MB' };
      if (bitrate >= 160) return { label: 'High Quality', icon: Music2, color: 'from-green-400 to-emerald-600', size: '~4 MB' };
      if (bitrate >= 96)  return { label: 'Standard', icon: Wifi, color: 'from-blue-400 to-blue-600', size: '~2.5 MB' };
      return { label: 'Data Saver', icon: HardDrive, color: 'from-orange-400 to-red-500', size: '< 1 MB' };
  };

  const sortedQualities = song.downloadUrl.slice().sort((a, b) => {
      const getBitrate = (q: string) => parseInt(q.replace(/\D/g, '')) || 0;
      return getBitrate(b.quality) - getBitrate(a.quality);
  });

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-[#121212] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative"
        >
            {/* Header */}
            <div className="p-8 pb-4 flex items-start justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Select Quality</h2>
                    <p className="text-white/60 text-lg line-clamp-1">{song.name} • {song.artists.primary[0]?.name}</p>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Grid Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 pt-4">
                {sortedQualities.map((option, idx) => {
                    const meta = getMetadata(option.quality);
                    const Icon = meta.icon;
                    
                    return (
                        <motion.button
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDownload(option.url, option.quality)}
                            className="relative overflow-hidden group rounded-2xl p-1 text-left"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${meta.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                            <div className="relative bg-[#1E1E1E] h-full p-5 rounded-xl border border-white/5 group-hover:border-white/20 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-lg`}>
                                        <Icon size={20} className="text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-lg">{meta.label}</span>
                                        <div className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider">
                                            <span>{option.quality}</span>
                                            <span>•</span>
                                            <span>{meta.size}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#1DB954] group-hover:text-black transition-all">
                                    <Download size={20} />
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="bg-[#181818] p-4 text-center text-xs text-white/30 border-t border-white/5 uppercase tracking-widest font-bold">
                Downloads are saved to your browser cache
            </div>
        </motion.div>
    </div>
  );
};