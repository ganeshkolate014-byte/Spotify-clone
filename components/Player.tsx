import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, Download, Heart, Loader2, Shuffle, Repeat, CheckCircle2, PlusCircle, Sparkles } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { api, getImageUrl } from '../services/api';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Smooth Tween Animation (No Spring) - Native iOS-like Slide
const transitionSpec = {
  type: "tween",
  ease: [0.32, 0.72, 0, 1],
  duration: 0.4
};

export const Player: React.FC = () => {
  const { 
    currentSong, 
    isPlaying, 
    isBuffering,
    isFullScreen,
    setFullScreen,
    togglePlay, 
    nextSong, 
    prevSong,
    likedSongs,
    toggleLike,
    shuffleMode,
    toggleShuffle,
    downloadedSongIds,
    startDownload,
    duration, 
    audioElement,
    seek
  } = usePlayerStore();

  const navigate = useNavigate();
  
  const [dominantColor, setDominantColor] = useState<string>('#121212');
  
  // Refs for State
  const isDragging = useRef(false);
  const isSeeking = useRef(false); 
  const seekBarRef = useRef<HTMLDivElement>(null);

  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);

  // Direct DOM Refs for High Performance UI
  const fullProgressRef = useRef<HTMLDivElement>(null);
  const fullThumbRef = useRef<HTMLDivElement>(null);
  const fullTimeRef = useRef<HTMLSpanElement>(null);
  const miniProgressRef = useRef<HTMLDivElement>(null);

  const isLiked = currentSong ? likedSongs.some(s => s.id === currentSong.id) : false;
  const isDownloaded = currentSong ? downloadedSongIds.includes(currentSong.id) : false;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "-:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const safeDuration = duration > 0 ? duration : 1;
  const isInteractive = duration > 0;

  // --- UI UPDATE LOOP ---
  useEffect(() => {
    let rafId: number;
    
    const updateUI = () => {
        if (isDragging.current || isSeeking.current) {
            if (isPlaying) rafId = requestAnimationFrame(updateUI);
            return;
        }

        if (!audioElement) return;
        
        const time = audioElement.currentTime;
        const percent = (time / safeDuration) * 100;
        
        if (fullProgressRef.current) fullProgressRef.current.style.width = `${percent}%`;
        if (fullThumbRef.current) fullThumbRef.current.style.left = `calc(${percent}% - 6px)`;
        if (fullTimeRef.current) fullTimeRef.current.innerText = formatTime(time);
        
        if (miniProgressRef.current) miniProgressRef.current.style.width = `${percent}%`;

        if (isPlaying) {
            rafId = requestAnimationFrame(updateUI);
        }
    };

    if (isPlaying) {
        rafId = requestAnimationFrame(updateUI);
    } else if (audioElement) {
        updateUI();
    }

    return () => {
        if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isPlaying, audioElement, safeDuration, isFullScreen]);

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
        canvas.width = 1; canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        setDominantColor(`rgb(${Math.max(20, r - 30)},${Math.max(20, g - 30)},${Math.max(20, b - 30)})`);
      } catch (e) { setDominantColor('#181818'); }
    };
    img.onerror = () => setDominantColor('#181818');
  }, [currentSong?.id]);


  // --- CUSTOM SEEKER LOGIC (NO INPUT RANGE) ---

  const calculateProgress = (clientX: number) => {
      if (!seekBarRef.current) return 0;
      const rect = seekBarRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      return x / rect.width;
  };

  const updateVisualsFromInteraction = (percent: number) => {
      const time = percent * safeDuration;
      if (fullProgressRef.current) fullProgressRef.current.style.width = `${percent * 100}%`;
      if (fullThumbRef.current) fullThumbRef.current.style.left = `calc(${percent * 100}% - 6px)`;
      if (fullTimeRef.current) fullTimeRef.current.innerText = formatTime(time);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isInteractive) return;
      e.stopPropagation(); // Stop background swipes
      e.preventDefault(); // Stop default browser actions
      
      isDragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);

      // Immediate visual update
      const percent = calculateProgress(e.clientX);
      updateVisualsFromInteraction(percent);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      e.stopPropagation();
      e.preventDefault();
      
      const percent = calculateProgress(e.clientX);
      updateVisualsFromInteraction(percent);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      e.stopPropagation();
      isDragging.current = false;
      isSeeking.current = true; // Lock UI updates from audio engine

      const percent = calculateProgress(e.clientX);
      const time = percent * safeDuration;
      
      if (!isNaN(time) && isFinite(time)) {
          seek(time);
      }
      
      // Release capture
      e.currentTarget.releasePointerCapture(e.pointerId);
      
      // Delay unlocking UI to prevent snap-back
      setTimeout(() => { isSeeking.current = false; }, 500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow swipe if NOT touching the slider container
    if ((e.target as HTMLElement).closest('.slider-container')) return;
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStart.x - touchEndX;
    const diffY = touchStart.y - touchEndY;

    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) nextSong(); else prevSong();
    }
    if (diffY < -80 && Math.abs(diffY) > Math.abs(diffX)) {
        setFullScreen(false);
    }
    setTouchStart(null);
  };

  if (!currentSong) return null;
  const imageUrl = getImageUrl(currentSong.image);

  return (
    <>
        <AnimatePresence mode="popLayout">
            {isFullScreen ? (
                <motion.div 
                    key="full-player"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={transitionSpec}
                    className="fixed inset-0 z-[200] flex flex-col bg-[#121212] isolate overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    style={{ transform: 'translateZ(0)' }}
                >
                    <motion.div 
                        className="absolute inset-0 z-[-1]" 
                        animate={{ backgroundColor: dominantColor }}
                        style={{ background: `linear-gradient(to bottom, ${dominantColor}80, #121212)` }} 
                    />

                    {/* Main Flex Container - Adjusted for small screens */}
                    <div className="relative z-10 flex flex-col h-full px-6 pt-safe-top pb-8 md:pb-12">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between h-14 shrink-0 mt-2">
                            <button onClick={() => setFullScreen(false)} className="p-2 -ml-2 rounded-full hover:bg-white/10 shrink-0"><ChevronDown size={28} className="text-white" /></button>
                            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/70">Now Playing</span>
                            <div className="w-10"></div> {/* Spacer for alignment since 3 dots are removed */}
                        </div>

                        {/* Art - Flexible Height with min-h-0 to allow shrinking */}
                        <div className="flex-1 flex flex-col justify-center items-center min-h-0 py-4 md:py-8">
                            <div className="relative w-full aspect-square max-h-full max-w-[340px] shadow-2xl rounded-2xl overflow-hidden bg-[#222]">
                                <img src={imageUrl} alt="Cover" className="w-full h-full object-cover" />
                            </div>
                        </div>

                        {/* Info & Controls - Shrinkable but content stays visible */}
                        <div className="flex flex-col shrink-0 gap-6">
                            
                            {/* Title Row */}
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col overflow-hidden mr-4 min-w-0">
                                    <h2 className="text-2xl font-bold text-white truncate leading-tight">{currentSong.name}</h2>
                                    <p className="text-lg text-white/70 truncate">{currentSong.artists?.primary?.[0]?.name}</p>
                                </div>
                                <button onClick={() => toggleLike(currentSong)} className="shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors">
                                    {isLiked ? <CheckCircle2 size={28} className="text-[#1DB954] fill-black" /> : <PlusCircle size={28} className="text-white/70" />}
                                </button>
                            </div>

                            {/* Scrubber */}
                            <div className="flex flex-col gap-2 pt-2 slider-container">
                                <div 
                                    ref={seekBarRef}
                                    className="relative h-4 w-full flex items-center cursor-pointer touch-none group"
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerCancel={handlePointerUp}
                                    style={{ touchAction: 'none' }} 
                                >
                                     <div className="absolute left-0 right-0 h-1 bg-white/20 rounded-full overflow-hidden pointer-events-none group-hover:h-1.5 transition-all">
                                         <div ref={fullProgressRef} className="h-full bg-white rounded-full" style={{ width: '0%' }} />
                                     </div>
                                     <div ref={fullThumbRef} className="absolute h-3 w-3 bg-white rounded-full shadow-md z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: '-6px' }} />
                                </div>
                                <div className="flex justify-between text-[11px] text-white/50 font-mono font-medium pointer-events-none">
                                    <span ref={fullTimeRef}>0:00</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Main Controls */}
                            <div className="flex items-center justify-between px-2 mb-4">
                                <button 
                                    onClick={toggleShuffle} 
                                    className={`shrink-0 relative group p-2 rounded-full transition-colors ${shuffleMode !== 'off' ? 'text-[#1DB954]' : 'text-white/40 hover:text-white'}`}
                                >
                                    <Shuffle size={20} />
                                    {shuffleMode === 'smart' && (
                                        <div className="absolute -top-1 -right-1">
                                            <Sparkles size={8} fill="#1DB954" className="text-[#1DB954]" />
                                        </div>
                                    )}
                                </button>
                                <button onClick={prevSong} className="shrink-0 p-2 hover:bg-white/5 rounded-full transition-colors"><SkipBack size={32} className="text-white" fill="white" /></button>
                                <button 
                                    onClick={togglePlay} 
                                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0 shadow-lg"
                                >
                                    {isBuffering ? <Loader2 size={32} className="animate-spin text-black" /> : isPlaying ? <Pause size={32} fill="black" className="text-black" /> : <Play size={32} fill="black" className="ml-1 text-black" />}
                                </button>
                                <button onClick={nextSong} className="shrink-0 p-2 hover:bg-white/5 rounded-full transition-colors"><SkipForward size={32} className="text-white" fill="white" /></button>
                                <button className="text-white/40 shrink-0 p-2 hover:text-white transition-colors"><Repeat size={20} /></button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    key="mini-player"
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={transitionSpec}
                    // Updated: bottom-24 for mobile (approx 96px) to sit above nav, md:bottom-4 for desktop
                    className="fixed bottom-24 md:bottom-4 left-2 right-2 md:left-1/2 md:-translate-x-1/2 md:w-[450px] h-[56px] z-[150] cursor-pointer isolate"
                    onClick={() => setFullScreen(true)}
                    style={{ transform: 'translateZ(0)' }}
                >
                    <motion.div 
                        className="absolute inset-0 z-[-1] rounded-lg shadow-xl overflow-hidden bg-[#222]" 
                        animate={{ backgroundColor: dominantColor }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <div className="absolute inset-0 bg-black/20" />
                    </motion.div>
                    
                    <div className="flex items-center h-full px-2 gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-[4px] overflow-hidden bg-[#333]">
                            <img 
                                src={imageUrl} 
                                alt="" 
                                className="w-full h-full object-cover" 
                            />
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center">
                            <div className="text-white font-bold text-xs truncate">
                                {currentSong.name}
                            </div>
                            <div className="text-white/70 text-[10px] truncate">
                                {currentSong.artists.primary[0]?.name}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); toggleLike(currentSong); }} className="p-1.5"><Heart size={20} fill={isLiked ? "#1DB954" : "none"} className={isLiked ? "text-[#1DB954]" : "text-white"} /></button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
                                className="p-1.5 text-white"
                            >
                                {isBuffering ? <Loader2 size={24} className="animate-spin" /> : isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                            </button>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-1 right-1 h-[2px] bg-white/20 rounded-full overflow-hidden">
                        <div ref={miniProgressRef} className="h-full bg-white rounded-full" style={{ width: '0%' }}></div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </>
  );
};