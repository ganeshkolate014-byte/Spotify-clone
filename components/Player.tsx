import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, MoreHorizontal, Download, ListMusic, Heart, Loader2, Shuffle, Repeat, PlusCircle, CheckCircle2, Disc, User, Share2, ListPlus, Radio, Mic2, Moon, Info, Sparkles } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { api, getImageUrl } from '../services/api';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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
    addToQueue,
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

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isDownloadExpanded, setIsDownloadExpanded] = useState(false);
  const [sleepTimerId, setSleepTimerId] = useState<number | null>(null);
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

  useEffect(() => {
      if (!isMoreMenuOpen) setIsDownloadExpanded(false);
  }, [isMoreMenuOpen, currentSong?.id]);


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


  // --- ACTIONS ---
  const handleAddToQueue = () => { if(currentSong) { addToQueue(currentSong); setIsMoreMenuOpen(false); } };

  const handleShare = async () => {
      if(!currentSong) return;
      const shareData = { title: currentSong.name, text: `Listen to ${currentSong.name}`, url: window.location.href };
      if (navigator.share) { try { await navigator.share(shareData); } catch(e) {} }
      else { navigator.clipboard.writeText(shareData.url); }
      setIsMoreMenuOpen(false);
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
    if (diffY < -80 && Math.abs(diffY) > Math.abs(diffX) && !isMoreMenuOpen) {
        setFullScreen(false);
    }
    setTouchStart(null);
  };

  const handleDownloadSelect = (url: string, quality: string) => {
      if(!currentSong) return;
      startDownload(currentSong, url, `${currentSong.name}.mp3`);
      setIsMoreMenuOpen(false);
      setIsDownloadExpanded(false);
  };

  if (!currentSong) return null;
  const imageUrl = getImageUrl(currentSong.image);

  return (
    <>
        <AnimatePresence mode="wait">
            {isFullScreen ? (
                <motion.div 
                    key="full-player"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                    className="fixed inset-0 z-[200] flex flex-col bg-[#121212] isolate overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="absolute inset-0 z-[-1]" style={{ background: `linear-gradient(to bottom, ${dominantColor}, #121212)` }} />

                    <div className="relative z-10 flex flex-col h-full px-6 pt-safe-top pb-safe-bottom">
                        {/* Header */}
                        <div className="flex items-center justify-between h-16 shrink-0 mt-2">
                            <button onClick={() => setFullScreen(false)} className="p-2 -ml-2 rounded-full hover:bg-white/10 shrink-0"><ChevronDown size={28} className="text-white" /></button>
                            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/70">Now Playing</span>
                            <button onClick={() => setIsMoreMenuOpen(true)} className="p-2 -mr-2 rounded-full hover:bg-white/10 shrink-0"><MoreHorizontal size={24} className="text-white" /></button>
                        </div>

                        {/* Art */}
                        <div className="flex-1 flex flex-col justify-center min-h-0 relative my-4">
                            <div className="relative w-full aspect-square max-w-[340px] mx-auto shadow-2xl rounded-xl overflow-hidden">
                                <img src={imageUrl} alt="Cover" className="w-full h-full object-cover" />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex flex-col gap-6 mb-10">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col overflow-hidden mr-4 min-w-0">
                                    <h2 className="text-2xl font-bold text-white truncate">{currentSong.name}</h2>
                                    <p className="text-lg text-white/70 truncate">{currentSong.artists?.primary?.[0]?.name}</p>
                                </div>
                                <button onClick={() => toggleLike(currentSong)} className="shrink-0">
                                    {isLiked ? <CheckCircle2 size={28} className="text-[#1DB954] fill-black" /> : <PlusCircle size={28} className="text-white/70" />}
                                </button>
                            </div>

                            {/* CUSTOM SCRUBBER - Fixed Height to be Compact */}
                            <div className="flex flex-col gap-1 pt-2 slider-container">
                                <div
                                    ref={seekBarRef}
                                    className="relative h-4 w-full flex items-center cursor-pointer touch-none"
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerCancel={handlePointerUp}
                                    style={{ touchAction: 'none' }}
                                >
                                     <div className="absolute left-0 right-0 h-1 bg-white/20 rounded-full overflow-hidden pointer-events-none">
                                         <div ref={fullProgressRef} className="h-full bg-white rounded-full" style={{ width: '0%' }} />
                                     </div>
                                     <div ref={fullThumbRef} className="absolute h-3 w-3 bg-white rounded-full shadow-md z-10 pointer-events-none" style={{ left: '-6px' }} />
                                </div>
                                <div className="flex justify-between text-[11px] text-white/50 font-mono font-medium pointer-events-none">
                                    <span ref={fullTimeRef}>0:00</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between px-2">
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
                                <button onClick={prevSong} className="shrink-0"><SkipBack size={32} className="text-white" fill="white" /></button>
                                <button onClick={togglePlay} className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0">
                                    {isBuffering ? <Loader2 size={32} className="animate-spin text-black" /> : isPlaying ? <Pause size={32} fill="black" className="text-black" /> : <Play size={32} fill="black" className="ml-1 text-black" />}
                                </button>
                                <button onClick={nextSong} className="shrink-0"><SkipForward size={32} className="text-white" fill="white" /></button>
                                <button className="text-white/40 shrink-0"><Repeat size={20} /></button>
                            </div>

                            <div className="flex items-center justify-between px-4">
                                <button className="text-white/50 shrink-0 p-2"><Mic2 size={22} /></button>
                                <button className="text-white/50 shrink-0 p-2"><ListMusic size={22} /></button>
                            </div>
                        </div>
                    </div>

                    {/* Menus... */}
                    <AnimatePresence>
                        {isMoreMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 z-[250] bg-black/60 backdrop-blur-sm flex flex-col justify-end"
                                onClick={() => setIsMoreMenuOpen(false)}
                            >
                                <motion.div 
                                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                                    className="bg-[#242424] rounded-t-2xl pb-6 max-h-[85vh] overflow-y-auto"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="w-full flex justify-center pt-4 pb-2"><div className="w-10 h-1 bg-white/20 rounded-full"></div></div>
                                    <div className="p-4 space-y-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <img src={imageUrl} className="w-12 h-12 rounded" alt=""/>
                                            <div><div className="font-bold text-white">{currentSong.name}</div><div className="text-sm text-white/60">{currentSong.artists.primary[0]?.name}</div></div>
                                        </div>
                                        {currentSong.downloadUrl?.map(opt => (
                                            <button key={opt.quality} onClick={() => handleDownloadSelect(opt.url, opt.quality)} className="w-full text-left text-white py-3 border-b border-white/5 flex justify-between">
                                                <span>Download {opt.quality}</span> <Download size={16}/>
                                            </button>
                                        ))}
                                        <button onClick={handleAddToQueue} className="w-full text-left text-white font-medium py-3 border-b border-white/5">Add to Queue</button>
                                        <button onClick={handleShare} className="w-full text-left text-white font-medium py-3 border-b border-white/5">Share</button>
                                        <button onClick={() => navigate(`/artist/${currentSong.artists.primary[0].id}`)} className="w-full text-left text-white font-medium py-3">View Artist</button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <motion.div 
                    key="mini-player"
                    layoutId="mini-player"
                    className="fixed bottom-[68px] md:bottom-4 left-2 right-2 md:left-1/2 md:-translate-x-1/2 md:w-[450px] h-[56px] z-[150] cursor-pointer isolate"
                    onClick={() => setFullScreen(true)}
                >
                    <div className="absolute inset-0 z-[-1] rounded-lg shadow-xl overflow-hidden" style={{ backgroundColor: dominantColor }}><div className="absolute inset-0 bg-black/20" /></div>
                    <div className="flex items-center h-full px-2 gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-[4px] overflow-hidden"><img src={imageUrl} alt="" className="w-full h-full object-cover" /></div>
                        <div className="flex-1 min-w-0 pr-2"><div className="text-white font-bold text-xs truncate">{currentSong.name}</div><div className="text-white/70 text-[10px] truncate">{currentSong.artists.primary[0]?.name}</div></div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); toggleLike(currentSong); }} className="p-1.5"><Heart size={20} fill={isLiked ? "#1DB954" : "none"} className={isLiked ? "text-[#1DB954]" : "text-white"} /></button>
                            <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="p-1.5 text-white">{isBuffering ? <Loader2 size={24} className="animate-spin" /> : isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}</button>
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