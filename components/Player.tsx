import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, MoreHorizontal, Download, ListMusic, Heart, Loader2, Shuffle, Repeat, PlusCircle, CheckCircle2, Disc, User, Share2, ListPlus } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { getImageUrl, getAudioUrl, getOfflineAudioUrl } from '../services/api';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { DownloadQualityModal } from './DownloadQualityModal';
import { Song } from '../types';
import { useNavigate } from 'react-router-dom';

// Faster, snappier transition config for the Player expansion
const transition = {
  type: "spring",
  stiffness: 350,
  damping: 30,
  mass: 0.8
};

export const Player: React.FC = () => {
  const { 
    currentSong, 
    isPlaying, 
    isBuffering,
    isFullScreen,
    setFullScreen,
    togglePlay, 
    setIsPlaying, 
    setIsBuffering,
    nextSong, 
    prevSong,
    likedSongs,
    toggleLike,
    isShuffling,
    streamingQuality,
    isOfflineMode,
    downloadedSongIds,
    addSongToPlaylist
  } = usePlayerStore();

  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dominantColor, setDominantColor] = useState<string>('#121212');
  const [isDragging, setIsDragging] = useState(false);
  
  const [downloadSong, setDownloadSong] = useState<Song | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);

  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);

  const isLiked = currentSong ? likedSongs.some(s => s.id === currentSong.id) : false;
  const isDownloaded = currentSong ? downloadedSongIds.includes(currentSong.id) : false;

  useEffect(() => {
    if (!currentSong) return;
    const imgUrl = getImageUrl(currentSong.image);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imgUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = 1; 
        canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        setDominantColor(`rgb(${Math.max(20, r - 30)},${Math.max(20, g - 30)},${Math.max(20, b - 30)})`);
      } catch (e) {
        setDominantColor('#181818'); 
      }
    };
    img.onerror = () => setDominantColor('#181818');
  }, [currentSong?.id]);

  useEffect(() => {
    if (!currentSong || !audioRef.current) return;
    
    const setAudioSource = async () => {
        let url = '';
        if (isOfflineMode || downloadedSongIds.includes(currentSong.id)) {
            const blobUrl = await getOfflineAudioUrl(currentSong.id);
            if (blobUrl) url = blobUrl;
            else if (isOfflineMode) { setIsPlaying(false); return; }
        }
        if (!url && !isOfflineMode) {
             url = getAudioUrl(currentSong.downloadUrl, streamingQuality);
        }
        if (url && audioRef.current && audioRef.current.src !== url) {
            const wasPlaying = isPlaying;
            audioRef.current.src = url;
            audioRef.current.load();
            if (wasPlaying) {
                 audioRef.current.play().catch(() => setIsPlaying(false));
            }
        }
    };
    setAudioSource();
  }, [currentSong?.id, streamingQuality, isOfflineMode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying && audio.paused) audio.play().catch(e => console.warn("Play interrupted", e));
    else if (!isPlaying && !audio.paused) audio.pause();
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setProgress(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "-:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStart.x - touchEndX;
    const diffY = touchStart.y - touchEndY;

    // Horizontal Swipe for Song Change
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) nextSong();
      else prevSong();
    }
    // Vertical Swipe Down to Close Player (only if not in menu)
    if (diffY < -80 && Math.abs(diffY) > Math.abs(diffX) && !isMoreMenuOpen) {
        setFullScreen(false);
    }
    setTouchStart(null);
  };

  if (!currentSong) return null;

  const imageUrl = getImageUrl(currentSong.image);
  const primaryArtistName = currentSong.artists?.primary?.[0]?.name || "Unknown";

  return (
    <>
        <audio 
            ref={audioRef}
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onEnded={nextSong}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onCanPlay={() => setIsBuffering(false)}
            onPause={() => {
                if (isPlaying && !isBuffering && audioRef.current?.paused) setIsPlaying(false);
            }}
            onPlay={() => !isPlaying && setIsPlaying(true)}
        />

        <MotionConfig transition={transition}>
            <AnimatePresence>
                {isFullScreen ? (
                    <motion.div 
                        key="full-player"
                        layoutId="player-root"
                        className="fixed inset-0 z-[200] flex flex-col overflow-hidden isolate"
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* 1. Shared Background */}
                        <motion.div 
                            layoutId="player-bg"
                            className="absolute inset-0 z-[-1] bg-[#121212]"
                            style={{ 
                                background: `linear-gradient(to bottom, ${dominantColor}, #121212)`,
                            }}
                        />

                        {/* FULL PLAYER CONTENT */}
                        <div className="relative z-10 flex flex-col h-full px-6 pt-safe-top pb-safe-bottom">
                            
                            {/* Header */}
                            <motion.div 
                                className="flex items-center justify-between h-16 shrink-0 mt-2"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            >
                                <button onClick={() => setFullScreen(false)} className="p-2 -ml-2 rounded-full hover:bg-white/10 shrink-0">
                                    <ChevronDown size={28} className="text-white" />
                                </button>
                                <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/70">
                                    Now Playing
                                </span>
                                <button onClick={() => setIsMoreMenuOpen(true)} className="p-2 -mr-2 rounded-full hover:bg-white/10 shrink-0">
                                    <MoreHorizontal size={24} className="text-white" />
                                </button>
                            </motion.div>

                            {/* Main Artwork Area */}
                            <div className="flex-1 flex flex-col justify-center min-h-0 relative my-4">
                                <div className="relative w-full aspect-square max-w-[340px] mx-auto">
                                    <motion.img 
                                        layoutId="player-image"
                                        src={imageUrl} 
                                        alt="Cover"
                                        className="w-full h-full object-cover rounded-xl shadow-2xl"
                                    />
                                </div>
                            </div>

                            {/* Info & Controls */}
                            <div className="flex flex-col gap-6 mb-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col overflow-hidden mr-4 min-w-0">
                                        <motion.h2 
                                            layoutId="player-title"
                                            className="text-2xl font-bold text-white truncate"
                                        >
                                            {currentSong.name}
                                        </motion.h2>
                                        <motion.p 
                                            layoutId="player-artist"
                                            className="text-lg text-white/70 truncate"
                                        >
                                            {primaryArtistName}
                                        </motion.p>
                                    </div>
                                    <button onClick={() => toggleLike(currentSong)} className="shrink-0">
                                        {isLiked ? <CheckCircle2 size={28} className="text-[#1DB954] fill-black" /> : <PlusCircle size={28} className="text-white/70" />}
                                    </button>
                                </div>

                                {/* Scrubber */}
                                <motion.div 
                                    className="flex flex-col gap-2"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                >
                                    <div className="relative h-1 w-full bg-white/20 rounded-full group hover:h-1.5 transition-all">
                                         <div className="absolute left-0 top-0 bottom-0 bg-white rounded-full" style={{ width: `${(progress / (duration || 1)) * 100}%` }}>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100"></div>
                                         </div>
                                         <input 
                                            type="range" min="0" max={duration || 100} value={progress}
                                            onChange={handleSeek}
                                            onMouseDown={() => setIsDragging(true)}
                                            onTouchStart={() => setIsDragging(true)}
                                            onMouseUp={() => setIsDragging(false)}
                                            onTouchEnd={() => setIsDragging(false)}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-white/50 font-mono font-medium">
                                        <span>{formatTime(progress)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </motion.div>

                                {/* Controls */}
                                <motion.div 
                                    className="flex items-center justify-between px-2"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                >
                                    <button className={`shrink-0 ${isShuffling ? 'text-[#1DB954]' : 'text-white/40'}`}><Shuffle size={20} /></button>
                                    <button onClick={prevSong} className="shrink-0"><SkipBack size={32} className="text-white" fill="white" /></button>
                                    <button 
                                        onClick={togglePlay}
                                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0"
                                    >
                                        {isBuffering ? <Loader2 size={32} className="animate-spin text-black" /> : isPlaying ? <Pause size={32} fill="black" className="text-black" /> : <Play size={32} fill="black" className="ml-1 text-black" />}
                                    </button>
                                    <button onClick={nextSong} className="shrink-0"><SkipForward size={32} className="text-white" fill="white" /></button>
                                    <button className="text-white/40 shrink-0"><Repeat size={20} /></button>
                                </motion.div>

                                {/* Bottom Row */}
                                <motion.div 
                                    className="flex items-center justify-between px-4"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                >
                                    <button onClick={() => setDownloadSong(currentSong)} className={`shrink-0 ${isDownloaded ? 'text-[#1DB954]' : 'text-white/50'}`}>
                                        <Download size={22} />
                                    </button>
                                    <button className="text-white/50 shrink-0"><ListMusic size={22} /></button>
                                </motion.div>
                            </div>
                        </div>

                        {/* More Menu (Swipe to Close) - Smooth Tween Animation */}
                        <AnimatePresence>
                            {isMoreMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-[250] bg-black/60 backdrop-blur-sm flex flex-col justify-end"
                                    onClick={() => setIsMoreMenuOpen(false)}
                                >
                                    <motion.div 
                                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                                        transition={{ type: "tween", ease: "circOut", duration: 0.3 }}
                                        drag="y"
                                        dragConstraints={{ top: 0 }}
                                        dragElastic={{ top: 0, bottom: 0.2 }}
                                        onDragEnd={(_, info) => {
                                            if (info.offset.y > 100 || info.velocity.y > 100) {
                                                setIsMoreMenuOpen(false);
                                            }
                                        }}
                                        className="bg-[#1E1E1E] rounded-t-2xl p-4 flex flex-col gap-4 pb-10"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {/* Drag Handle */}
                                        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2 shrink-0"></div>
                                        
                                        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                            <img src={getImageUrl(currentSong.image)} className="w-12 h-12 rounded-md object-cover" alt="" />
                                            <div>
                                                <div className="font-bold text-white">{currentSong.name}</div>
                                                <div className="text-sm text-white/50">{primaryArtistName}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => { setShowPlaylistSelector(true); setIsMoreMenuOpen(false); }} className="flex gap-4 items-center text-white font-medium p-3 hover:bg-white/5 rounded-lg transition-colors"><ListPlus /> Add to Playlist</button>
                                        <button onClick={() => navigate(`/artist/${currentSong.artists.primary[0].id}`, { state: { artist: currentSong.artists.primary[0] } })} className="flex gap-4 items-center text-white font-medium p-3 hover:bg-white/5 rounded-lg transition-colors"><User /> View Artist</button>
                                        <button onClick={() => navigate(`/album/${currentSong.album.id}`)} className="flex gap-4 items-center text-white font-medium p-3 hover:bg-white/5 rounded-lg transition-colors"><Disc /> View Album</button>
                                        <button className="flex gap-4 items-center text-white font-medium p-3 hover:bg-white/5 rounded-lg transition-colors"><Share2 /> Share</button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="mini-player"
                        layoutId="player-root"
                        className="fixed bottom-[68px] md:bottom-4 left-2 right-2 md:left-1/2 md:-translate-x-1/2 md:w-[450px] h-[56px] z-[150] cursor-pointer isolate"
                        onClick={() => setFullScreen(true)}
                    >
                        {/* 1. Shared Background */}
                        <motion.div 
                            layoutId="player-bg"
                            className="absolute inset-0 z-[-1] rounded-lg shadow-xl overflow-hidden"
                            style={{ backgroundColor: dominantColor }}
                        >
                             <div className="absolute inset-0 bg-black/20" />
                        </motion.div>

                        <div className="flex items-center h-full px-2 gap-3">
                            {/* Shared Image */}
                            <motion.div 
                                layoutId="player-image"
                                className="h-10 w-10 shrink-0 rounded-[4px] overflow-hidden shadow-sm"
                            >
                                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                            </motion.div>

                            {/* Text Info */}
                            <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
                                <motion.span 
                                    layoutId="player-title"
                                    className="text-white font-bold text-xs truncate"
                                >
                                    {currentSong.name}
                                </motion.span>
                                <motion.span 
                                    layoutId="player-artist"
                                    className="text-white/70 text-[10px] truncate"
                                >
                                    {primaryArtistName}
                                </motion.span>
                            </div>

                            {/* Controls (No shared layout ID to prevent morphing issues) */}
                            <motion.div 
                                className="flex items-center gap-3 pr-1 shrink-0"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            >
                                <button onClick={(e) => { e.stopPropagation(); toggleLike(currentSong); }} className="shrink-0">
                                    <Heart size={20} fill={isLiked ? "#1DB954" : "none"} className={isLiked ? "text-[#1DB954]" : "text-white"} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="shrink-0">
                                    {isBuffering ? (
                                        <Loader2 size={24} className="animate-spin text-white" />
                                    ) : isPlaying ? (
                                        <Pause size={24} fill="white" className="text-white" />
                                    ) : (
                                        <Play size={24} fill="white" className="text-white" />
                                    )}
                                </button>
                            </motion.div>
                        </div>
                        
                        {/* Progress Bar (Mini only) */}
                        <motion.div 
                            className="absolute bottom-0 left-1 right-1 h-[2px] bg-white/20 rounded-full overflow-hidden"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        >
                            <div className="h-full bg-white rounded-full" style={{ width: `${(progress / (duration || 1)) * 100}%` }}></div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </MotionConfig>

        {downloadSong && (
            <DownloadQualityModal song={downloadSong} onClose={() => setDownloadSong(null)} />
        )}
    </>
  );
};