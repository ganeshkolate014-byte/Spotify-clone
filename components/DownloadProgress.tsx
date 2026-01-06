import React from 'react';
import { usePlayerStore } from '../store/playerStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowDown } from 'lucide-react';
import { getImageUrl } from '../services/api';

export const DownloadProgress: React.FC = () => {
  const { activeDownload, downloadProgress } = usePlayerStore();

  if (!activeDownload) return null;

  const isComplete = downloadProgress >= 100;

  // Calculate circumference for circle progress
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (downloadProgress / 100) * circumference;

  return (
    <AnimatePresence>
        <div className="fixed bottom-24 md:bottom-28 left-0 right-0 z-[200] flex justify-center pointer-events-none">
            <motion.div
                initial={{ y: 50, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 50, opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-full pl-2 pr-6 py-2 shadow-2xl flex items-center gap-4 min-w-[280px]"
            >
                {/* Album Art & Progress Circle */}
                <div className="relative w-12 h-12 shrink-0">
                    {/* Background Circle */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="24"
                            cy="24"
                            r={radius}
                            fill="transparent"
                            stroke="#333"
                            strokeWidth="3"
                        />
                        <motion.circle
                            cx="24"
                            cy="24"
                            r={radius}
                            fill="transparent"
                            stroke={isComplete ? "#1DB954" : "#1DB954"}
                            strokeWidth="3"
                            strokeDasharray={circumference}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 0.2 }}
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Image or Checkmark */}
                    <div className="absolute inset-[6px] rounded-full overflow-hidden bg-[#222] flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {isComplete ? (
                                <motion.div
                                    key="check"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-full h-full bg-[#1DB954] flex items-center justify-center"
                                >
                                    <Check size={20} className="text-black" strokeWidth={3} />
                                </motion.div>
                            ) : (
                                <motion.img
                                    key="img"
                                    src={getImageUrl(activeDownload.image)}
                                    alt=""
                                    className="w-full h-full object-cover opacity-80"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.8 }}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Loading Icon Overlay */}
                    {!isComplete && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ArrowDown size={14} className="text-white drop-shadow-md animate-bounce" />
                        </div>
                    )}
                </div>

                {/* Text Info */}
                <div className="flex flex-col flex-1 min-w-0">
                    <motion.span 
                        layout
                        className="text-white font-bold text-sm truncate"
                    >
                        {isComplete ? "Downloaded" : "Downloading..."}
                    </motion.span>
                    <motion.span 
                        layout
                        className="text-[#B3B3B3] text-xs truncate"
                    >
                        {isComplete ? activeDownload.name : `${Math.round(downloadProgress)}% • ${activeDownload.name}`}
                    </motion.span>
                </div>

            </motion.div>
        </div>
    </AnimatePresence>
  );
};