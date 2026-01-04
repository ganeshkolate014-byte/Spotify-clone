import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, MoreHorizontal, Share2, ListMusic, Heart, Loader2, Shuffle, Repeat, Mic2, PlusCircle, CheckCircle2 } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { getImageUrl, getAudioUrl, api } from '../services/api';
import { AnimatePresence, motion } from 'framer-motion';

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
    queue,
    setQueue,
    likedSongs,
    toggleLike,
    isShuffling
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dominantColor, setDominantColor] = useState<string>('#121212');
  const [isDragging, setIsDragging] = useState(false);

  // Swipe State
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);

  // Check if current song is liked
  const isLiked = currentSong ? likedSongs.some(s => s.id === currentSong.id) : false;

  // Extract Dominant Color
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
        setDominantColor(`rgb(${r},${g},${b})`);
      } catch (e) {
        setDominantColor('#2a2a2a'); 
      }
    };
    
    img.onerror = () => setDominantColor('#2a2a2a');

  }, [currentSong]);

  // Handle Song Change & Streaming
  useEffect(() => {
    if (!currentSong || !audioRef.current) return;

    const url = getAudioUrl(currentSong.downloadUrl);
    
    // Set source directly for streaming
    if (audioRef.current.src !== url) {
        audioRef.current.src = url;
        audioRef.current.load();
        
        if (isPlaying) {
             const playPromise = audioRef.current.play();
             if (playPromise !== undefined) {
                 playPromise.catch(error => {
                     console.warn("Autoplay prevented:", error);
                     setIsPlaying(false);
                 });
             }
        }
    }
  }, [currentSong?.id]); 

  // Handle Play/Pause State
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && audio.paused) {
      audio.play().catch(e => console.warn("Play interrupted", e));
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = async () => {
    if (currentSong && queue.findIndex(s => s.id === currentSong.id) === queue.length - 1) {
       try {
         const artist = currentSong.artists?.primary?.[0]?.name || "";
         const query = `${artist} ${currentSong.language} songs`; 
         const similarSongs = await api.searchSongs(query);
         const newSongs = similarSongs.filter(s => !queue.some(q => q.id === s.id)).slice(0, 5);
         
         if (newSongs.length > 0) {
            setQueue([...queue, ...newSongs]);
         }
       } catch (e) {
         console.error("Auto-queue failed", e);
       } finally {
         nextSong();
       }
    } else {
      nextSong();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setProgress(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };
  
  const handleSeekStart = () => setIsDragging(true);
  const handleSeekEnd = (e: React.TouchEvent | React.MouseEvent | any) => {
      setIsDragging(false);
       if (audioRef.current) {
         audioRef.current.currentTime = progress;
       }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "-:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchStart.x - touchEndX;
    const diffY = touchStart.y - touchEndY;

    // Horizontal Swipe (Next/Prev)
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) nextSong();
      else prevSong();
    }
    
    // Vertical Swipe (Down -> Close)
    if (diffY < -100 && Math.abs(diffY) > Math.abs(diffX)) {
        setFullScreen(false);
    }

    setTouchStart(null);
  };

  if (!currentSong) return null;

  const imageUrl = getImageUrl(currentSong.image);
  const primaryArtistName = currentSong.artists?.primary?.[0]?.name || currentSong.artists?.all?.[0]?.name || "Unknown Artist";
  
  return (
    <>
        <audio 
            ref={audioRef}
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onCanPlay={() => setIsBuffering(false)}
            onPause={() => {
                // Only sync state if it wasn't a seek/buffer pause
                if (isPlaying && !isBuffering && audioRef.current?.paused && audioRef.current?.readyState > 2) setIsPlaying(false);
            }}
            onPlay={() => !isPlaying && setIsPlaying(true)}
            onError={() => { setIsBuffering(false); setIsPlaying(false); }}
        />

        <AnimatePresence>
        {isFullScreen && (
        <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[200] flex flex-col bg-[#000000] overflow-hidden font-sans"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div 
                    className="absolute inset-0 transition-colors duration-1000 ease-in-out opacity-40"
                    style={{ background: `linear-gradient(to bottom, ${dominantColor}, #121212)` }}
                />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col h-full text-white px-6 pb-8 pt-4 md:px-12 md:pb-12">
                
                {/* Header */}
                <div className="flex items-center justify-between shrink-0 h-16">
                    <button onClick={() => setFullScreen(false)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors active:scale-90">
                        <ChevronDown size={28} className="text-white" />
                    </button>
                    <div className="flex flex-col items-center opacity-0 md:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60">Playing From</span>
                        <span className="text-xs font-bold text-white">Artist Radio</span>
                    </div>
                    <button className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors active:scale-90">
                        <MoreHorizontal size={24} className="text-white" />
                    </button>
                </div>

                {/* Album Art Section */}
                <div className="flex-1 flex items-center justify-center py-6 min-h-0">
                     <div className="relative w-full max-w-[350px] aspect-square group">
                        <img 
                            src={imageUrl} 
                            alt={currentSong.name} 
                            className="relative w-full h-full object-cover rounded-md shadow-2xl transition-transform duration-500 ease-out" 
                        />
                     </div>
                </div>

                {/* Track Info & Controls */}
                <div className="flex flex-col gap-6 shrink-0 w-full max-w-lg mx-auto mb-6 md:mb-10">
                    
                    {/* Metadata */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col overflow-hidden mr-6 flex-1">
                            <div className="h-8 md:h-10 relative overflow-hidden w-full">
                                <h1 className={`text-2xl md:text-3xl font-bold text-white whitespace-nowrap ${currentSong.name.length > 20 ? 'animate-marquee pl-[100%]' : ''}`}>
                                    {currentSong.name}
                                </h1>
                            </div>
                            <p className="text-white/60 text-lg md:text-xl truncate font-medium -mt-1">
                                {primaryArtistName}
                            </p>
                        </div>
                        <button onClick={() => toggleLike(currentSong)} className="transition-all active:scale-75 hover:scale-110 shrink-0">
                            {isLiked ? (
                                <CheckCircle2 size={28} className="text-[#1DB954] fill-[#1DB954] text-black" />
                            ) : (
                                <PlusCircle size={28} className="text-white/60 hover:text-white" />
                            )}
                        </button>
                    </div>

                    {/* Custom Scrubber */}
                    <div className="group flex flex-col gap-2 pt-2">
                        <div className="relative h-1 w-full bg-white/20 rounded-full touch-none group-hover:h-1.5 transition-all duration-300">
                             {/* Fill */}
                             <div 
                                className="absolute left-0 top-0 bottom-0 bg-white rounded-full transition-all duration-100 ease-linear"
                                style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                             >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity scale-0 group-hover:scale-100"></div>
                             </div>
                             {/* Input for interaction */}
                             <input 
                                type="range" 
                                min="0" 
                                max={duration || 100} 
                                value={progress}
                                onChange={handleSeek}
                                onTouchStart={handleSeekStart}
                                onTouchEnd={handleSeekEnd}
                                onMouseDown={handleSeekStart}
                                onMouseUp={handleSeekEnd}
                                disabled={isBuffering}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-wait"
                            />
                        </div>
                        <div className="flex justify-between text-[11px] text-white/40 font-bold tracking-wide font-mono">
                            <span>{formatTime(progress)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Main Controls */}
                    <div className="flex items-center justify-between -mx-2">
                        <button className={`p-2 transition-colors hover:text-white ${isShuffling ? 'text-[#1DB954]' : 'text-white/40'}`}>
                            <Shuffle size={20} />
                        </button>
                        
                        <div className="flex items-center gap-6 md:gap-10">
                            <button onClick={prevSong} className="text-white hover:text-white/70 transition-transform active:scale-75">
                                <SkipBack size={32} fill="currentColor" />
                            </button>
                            
                            <button 
                                onClick={togglePlay}
                                disabled={isBuffering}
                                className="bg-white text-black rounded-full w-16 h-16 md:w-16 md:h-16 flex items-center justify-center hover:scale-105 active:scale-90 transition-all shadow-md disabled:opacity-50 disabled:scale-100"
                            >
                                {isBuffering ? (
                                    <Loader2 size={28} className="animate-spin" />
                                ) : isPlaying ? (
                                    <Pause size={28} fill="currentColor" />
                                ) : (
                                    <Play size={28} fill="currentColor" className="ml-1" />
                                )}
                            </button>

                            <button onClick={nextSong} className="text-white hover:text-white/70 transition-transform active:scale-75">
                                <SkipForward size={32} fill="currentColor" />
                            </button>
                        </div>

                        <button className="p-2 text-white/40 hover:text-white transition-colors">
                            <Repeat size={20} />
                        </button>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between px-2 md:px-6">
                    <button className="text-white/50 hover:text-white transition-colors active:scale-90"><Share2 size={20} /></button>
                    <div className="flex items-center gap-6">
                        <button className="text-white/50 hover:text-white transition-colors active:scale-90"><Mic2 size={20} /></button>
                        <button className="text-white/50 hover:text-white transition-colors active:scale-90"><ListMusic size={22} /></button>
                    </div>
                </div>
            </div>
        </motion.div>
        )}
        </AnimatePresence>

        {/* --- MINI PLAYER --- */}
        <AnimatePresence>
        {!isFullScreen && (
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                onClick={() => setFullScreen(true)}
                className="fixed bottom-[65px] md:bottom-4 left-2 right-2 md:left-[50%] md:right-auto md:translate-x-[-50%] md:w-[420px] h-[56px] bg-[#3E3E3E] rounded-md flex items-center pr-3 shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-[150] cursor-pointer overflow-hidden group transition-colors"
            >
                {/* Artwork */}
                <div className="relative h-10 w-10 rounded-[4px] overflow-hidden ml-2 mr-3 shrink-0">
                   <img src={imageUrl} alt="cover" className="h-full w-full object-cover" />
                </div>
                
                {/* Text */}
                <div className="flex-1 min-w-0 flex flex-col justify-center mr-2">
                    <div className="flex items-center gap-2">
                        <span className={`text-white font-medium text-sm truncate ${isPlaying ? 'text-[#1DB954]' : ''}`}>{currentSong.name}</span>
                        <span className="text-white/60 text-xs truncate">• {primaryArtistName}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                     <button onClick={(e) => { e.stopPropagation(); toggleLike(currentSong); }} className="text-white/40 hover:text-[#1DB954] transition-colors active:scale-90 hidden sm:block">
                        <Heart size={20} fill={isLiked ? "#1DB954" : "transparent"} className={isLiked ? "text-[#1DB954]" : ""} />
                     </button>
                     <button 
                        onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
                        className="text-white h-9 w-9 flex items-center justify-center hover:scale-105 active:scale-90 transition-all"
                    >
                        {isBuffering ? (
                            <Loader2 size={24} className="animate-spin text-white/70" />
                        ) : isPlaying ? (
                            <Pause size={24} fill="currentColor" />
                        ) : (
                            <Play size={24} fill="currentColor" />
                        )}
                     </button>
                </div>
                
                 {/* Progress Bar (Bottom Line) */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
                     <div 
                        className="h-full bg-white/90 rounded-r-full transition-all duration-200" 
                        style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                    ></div>
                </div>
            </motion.div>
        )}
        </AnimatePresence>
    </>
  );
};