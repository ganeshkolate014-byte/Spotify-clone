import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, MoreVertical, Share2, ListMusic, Heart, Loader2, Shuffle, Timer, Headphones, PlusCircle, CheckCircle2 } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { getImageUrl, getAudioUrl, api } from '../services/api';

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

        // Resize to 1x1 to get average color
        canvas.width = 1;
        canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);
        
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        // Boost brightness slightly if too dark for the gradient top
        setDominantColor(`rgb(${r},${g},${b})`);
      } catch (e) {
        console.warn("Color extraction failed (likely CORS)", e);
        setDominantColor('#2a2a2a'); // Fallback
      }
    };
    
    img.onerror = () => setDominantColor('#2a2a2a');

  }, [currentSong]);

  // Handle Song Changes and Playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const playAudio = async () => {
      try {
        if (isPlaying) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
             playPromise.catch(error => {
                // Ignore AbortError: The play() request was interrupted by a call to pause() or a new load request.
                // This is common when switching songs quickly or toggling play/pause.
                if (error.name === 'AbortError') {
                   // Do nothing, state is handled elsewhere or by next effect run
                } else {
                   console.error("Playback failed:", error);
                   setIsPlaying(false);
                }
             });
          }
        } else {
          audio.pause();
        }
      } catch (error) {
        console.error("Playback execution error:", error);
      }
    };

    playAudio();

  }, [currentSong, isPlaying, setIsPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = async () => {
    // Intelligent Queue Logic
    if (currentSong && queue.findIndex(s => s.id === currentSong.id) === queue.length - 1) {
       try {
         const artist = currentSong.artists.primary[0]?.name || "";
         const query = `${artist} ${currentSong.language} songs`; 
         const similarSongs = await api.searchSongs(query);
         // Filter out duplicates
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
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
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
      if (diffX > 0) {
        nextSong();
      } else {
        prevSong();
      }
    }
    
    // Vertical Swipe (Down -> Close)
    if (diffY < -100 && Math.abs(diffY) > Math.abs(diffX)) {
        setFullScreen(false);
    }

    setTouchStart(null);
  };

  if (!currentSong) return null;

  const imageUrl = getImageUrl(currentSong.image);
  const audioSrc = getAudioUrl(currentSong.downloadUrl);

  return (
    <>
        <audio 
            ref={audioRef}
            src={audioSrc}
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onWaiting={() => setIsBuffering(true)}
            onCanPlay={() => setIsBuffering(false)}
            onPause={() => {
                // If the audio pauses itself (e.g. buffering, or external interrupt), update state
                // But avoid loops if we triggered the pause
                if (isPlaying && !isBuffering && audioRef.current?.paused) {
                    setIsPlaying(false);
                }
            }}
            onPlay={() => {
                if (!isPlaying) setIsPlaying(true);
            }}
            onError={(e) => {
                console.error("Audio error", e);
                setIsBuffering(false);
                setIsPlaying(false);
            }}
        />

        {/* --- FULL SCREEN PLAYER --- */}
        <div 
            className={`fixed inset-0 z-50 flex flex-col bg-black overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isFullScreen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Dynamic Background with Extracted Color */}
            <div 
                className="absolute inset-0 z-0 transition-colors duration-1000 ease-in-out"
                style={{
                    background: `linear-gradient(to bottom, ${dominantColor} 0%, #121212 100%)`
                }}
            >
                {/* Texture overlay (blurred image) to add depth beyond just solid color */}
                <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                    <img src={imageUrl} className="w-full h-full object-cover blur-[100px]" alt="" />
                </div>
                
                {/* Gradient overlay to ensure text readability at bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#121212]/30 to-[#121212]"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pt-8 md:pt-6">
                    <button onClick={() => setFullScreen(false)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronDown size={32} className="text-white" />
                    </button>
                    <div className="text-center opacity-100">
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/90 block mb-0.5">PLAYING FROM SEARCH</span>
                        <span className="text-xs font-bold text-white block">Recent Searches</span>
                    </div>
                    <button className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors">
                        <MoreVertical size={24} className="text-white" />
                    </button>
                </div>

                {/* Main Body */}
                <div className="flex-1 flex flex-col px-6 md:px-8 pb-8 overflow-y-auto no-scrollbar justify-center">
                    
                    {/* Album Art */}
                    <div className="w-full aspect-square relative mb-8 mx-auto max-w-[360px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] rounded-lg">
                         <img 
                            src={imageUrl} 
                            alt={currentSong.name} 
                            className="w-full h-full object-cover rounded-lg" 
                         />
                    </div>

                    {/* Title & Artist Row */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col overflow-hidden mr-4">
                            <h1 className="text-2xl font-bold text-white truncate leading-snug">{currentSong.name}</h1>
                            <p className="text-white/70 text-base truncate font-normal">{currentSong.artists.primary[0]?.name}, {currentSong.artists.featured?.[0]?.name}</p>
                        </div>
                        <button onClick={() => toggleLike(currentSong)} className="transition-transform active:scale-90 shrink-0">
                            {isLiked ? (
                                <CheckCircle2 size={32} className="text-[#1DB954] fill-[#1DB954] text-white" />
                            ) : (
                                <PlusCircle size={32} className="text-white/90 hover:text-white" />
                            )}
                        </button>
                    </div>

                    {/* Scrubber */}
                    <div className="flex flex-col gap-2 group mb-4 mt-2">
                        <input 
                            type="range" 
                            min="0" 
                            max={duration || 100} 
                            value={progress}
                            onChange={handleSeek}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                        />
                        <div className="flex justify-between text-[11px] text-white/70 font-medium font-mono">
                            <span>{formatTime(progress)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Main Controls */}
                    <div className="flex items-center justify-between px-0 mb-6 mt-2">
                        <button className={`transition-colors ${isShuffling ? 'text-[#1DB954]' : 'text-white/70 hover:text-white'}`}>
                            <Shuffle size={26} />
                        </button>
                        
                        <div className="flex items-center gap-6">
                            <button onClick={prevSong} className="text-white hover:text-white/80 transition-transform active:scale-90">
                                <SkipBack size={40} fill="white" />
                            </button>
                            
                            <button 
                                onClick={togglePlay}
                                className="bg-white rounded-full w-[72px] h-[72px] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                            >
                                {isBuffering ? (
                                    <Loader2 size={32} className="animate-spin text-black" />
                                ) : isPlaying ? (
                                    <Pause size={32} fill="black" className="text-black" />
                                ) : (
                                    <Play size={32} fill="black" className="ml-1 text-black" />
                                )}
                            </button>

                            <button onClick={nextSong} className="text-white hover:text-white/80 transition-transform active:scale-90">
                                <SkipForward size={40} fill="white" />
                            </button>
                        </div>

                        <button className="text-white/70 hover:text-white transition-colors">
                            <Timer size={26} />
                        </button>
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="flex items-center justify-between mb-8 mt-auto">
                        <div className="flex items-center gap-2 text-[#1DB954] bg-[#1DB954]/10 px-3 py-1.5 rounded-full">
                            <Headphones size={16} />
                            <span className="text-xs font-bold tracking-wide">This Device</span>
                        </div>
                        <div className="flex items-center gap-5">
                             <button className="text-white/70 hover:text-white transition-colors"><Share2 size={22} /></button>
                             <button className="text-white/70 hover:text-white transition-colors"><ListMusic size={26} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- MINI PLAYER (Spotify Style) --- */}
        <div 
            onClick={() => setFullScreen(true)}
            className={`fixed bottom-[64px] left-2 right-2 md:left-[50%] md:right-4 md:translate-x-[-50%] md:w-[400px] h-[56px] bg-[#3E3E3E] rounded-md flex items-center p-2 pr-3 shadow-xl z-50 cursor-pointer transition-all duration-300 ${isFullScreen ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}
        >
            <img src={imageUrl} alt="cover" className={`h-10 w-10 rounded-[4px] object-cover mr-3`} />
            
            <div className="flex-1 min-w-0 flex flex-col justify-center mr-2">
                <span className="text-white font-bold text-xs truncate leading-tight">{currentSong.name}</span>
                <span className="text-[#B3B3B3] text-[10px] truncate">{currentSong.artists.primary[0]?.name}</span>
            </div>

            <div className="flex items-center gap-3">
                 <button className="text-[#B3B3B3] hover:text-white transition-colors">
                    <Headphones size={20} />
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); toggleLike(currentSong); }} className="text-[#B3B3B3] hover:text-[#1DB954] transition-colors">
                    <Heart size={20} fill={isLiked ? "#1DB954" : "transparent"} className={isLiked ? "text-[#1DB954]" : ""} />
                 </button>
                 <button 
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
                    className="text-white"
                 >
                    {isBuffering ? (
                        <Loader2 size={24} className="animate-spin" />
                    ) : isPlaying ? (
                        <Pause size={24} fill="white" />
                    ) : (
                        <Play size={24} fill="white" />
                    )}
                 </button>
            </div>
            
             {/* Progress Bar (Bottom of Miniplayer) */}
            <div className="absolute bottom-[0px] left-2 right-2 h-[2px] bg-white/10 rounded-full overflow-hidden mx-1">
                 <div className="h-full bg-white rounded-full transition-all duration-300" style={{ width: `${(progress / (duration || 1)) * 100}%` }}></div>
            </div>
        </div>
    </>
  );
};