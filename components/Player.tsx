import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, MoreHorizontal, Download, ListMusic, Heart, Loader2, Shuffle, Repeat, PlusCircle, CheckCircle2, Disc, User, Share2, ListPlus, Radio, Mic2, Moon, Info, Volume2, VolumeX, Volume1 } from 'lucide-react';
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
    isShuffling,
    downloadedSongIds,
    addToQueue,
    startDownload,
    duration, 
    audioElement,
    volume,
    setVolume
  } = usePlayerStore();

  const navigate = useNavigate();
  
  const [dominantColor, setDominantColor] = useState<string>('#121212');
  const [isDragging, setIsDragging] = useState(false);
  
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isDownloadExpanded, setIsDownloadExpanded] = useState(false);
  
  const [sleepTimerId, setSleepTimerId] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);

  // Direct DOM Refs for High Performance (Zero React Re-renders during playback)
  const fullProgressRef = useRef<HTMLDivElement>(null);
  const fullThumbRef = useRef<HTMLDivElement>(null);
  const fullTimeRef = useRef<HTMLSpanElement>(null);
  const fullRangeRef = useRef<HTMLInputElement>(null);
  const miniProgressRef = useRef<HTMLDivElement>(null);

  const isLiked = currentSong ? likedSongs.some(s => s.id === currentSong.id) : false;
  const isDownloaded = currentSong ? downloadedSongIds.includes(currentSong.id) : false;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "-:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // PERFORMANCE CORE: Direct DOM updates via requestAnimationFrame
  useEffect(() => {
    let rafId: number;
    
    const updateUI = () => {
        if (!audioElement || isDragging) return;
        
        const time = audioElement.currentTime;
        const percent = (time / (duration || 1)) * 100;
        const formattedTime = formatTime(time);

        // Update Full Player
        if (fullProgressRef.current) fullProgressRef.current.style.width = `${percent}%`;
        if (fullThumbRef.current) fullThumbRef.current.style.left = `calc(${percent}% - 7px)`;
        if (fullTimeRef.current) fullTimeRef.current.innerText = formattedTime;
        if (fullRangeRef.current) fullRangeRef.current.value = time.toString();

        // Update Mini Player
        if (miniProgressRef.current) miniProgressRef.current.style.width = `${percent}%`;

        if (isPlaying) {
            rafId = requestAnimationFrame(updateUI);
        }
    };

    if (isPlaying) {
        rafId = requestAnimationFrame(updateUI);
    } else if (audioElement) {
        // Run once to sync UI if paused
        updateUI();
    }

    return () => {
        if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isPlaying, audioElement, duration, isDragging, isFullScreen]);

  // Extract color from image
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

  // Reset download expansion when menu closes or song changes
  useEffect(() => {
      if (!isMoreMenuOpen) setIsDownloadExpanded(false);
  }, [isMoreMenuOpen, currentSong?.id]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    
    // Immediate visual update to prevent jumpiness
    if (fullTimeRef.current) fullTimeRef.current.innerText = formatTime(time);
    const percent = (time / (duration || 1)) * 100;
    if (fullProgressRef.current) fullProgressRef.current.style.width = `${percent}%`;
    if (fullThumbRef.current) fullThumbRef.current.style.left = `calc(${percent}% - 7px)`;
    if (miniProgressRef.current) miniProgressRef.current.style.width = `${percent}%`;

    // Seek Audio
    if (audioElement) {
        audioElement.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setVolume(val);
  };

  // --- ACTIONS FOR MORE MENU ---
  const handleAddToQueue = () => {
      if(currentSong) {
          addToQueue(currentSong);
          setIsMoreMenuOpen(false);
      }
  };

  const handleShare = async () => {
      if(!currentSong) return;
      const shareData = {
          title: currentSong.name,
          text: `Listen to ${currentSong.name} by ${currentSong.artists.primary[0].name}`,
          url: window.location.href
      };
      
      if (navigator.share) {
          try {
              await navigator.share(shareData);
          } catch(e) { console.log(e); }
      } else {
          navigator.clipboard.writeText(shareData.url);
      }
      setIsMoreMenuOpen(false);
  };

  const handleSleepTimer = () => {
      if (sleepTimerId) {
          clearTimeout(sleepTimerId);
          setSleepTimerId(null);
      } else {
          // Set for 30 mins
          const id = window.setTimeout(() => {
              if (audioElement) audioElement.pause();
              setSleepTimerId(null);
          }, 30 * 60 * 1000); 
          setSleepTimerId(id);
      }
      setIsMoreMenuOpen(false);
  };

  const handleGoToRadio = async () => {
      if(!currentSong) return;
      setIsMoreMenuOpen(false);
      
      try {
         const recommendations = await api.getRecommendations(currentSong.id);
         if (recommendations.length > 0) {
             recommendations.forEach(s => addToQueue(s));
             alert(`Added ${recommendations.length} recommended songs to queue.`);
         } else {
             const query = currentSong.artists.primary[0]?.name || currentSong.name;
             const songs = await api.searchSongs(query);
             const newSongs = songs.filter(s => s.id !== currentSong.id);
             if (newSongs.length > 0) {
                 newSongs.slice(0, 10).forEach(s => addToQueue(s));
             }
         }
      } catch(e) {
          console.error("Radio failed", e);
      }
  };

  const handleDownloadSelect = (url: string, quality: string) => {
      if(!currentSong) return;
      const filename = `${currentSong.name} (${quality}) - ${currentSong.artists.primary[0]?.name || 'Artist'}.mp3`;
      startDownload(currentSong, url, filename);
      setIsMoreMenuOpen(false);
      setIsDownloadExpanded(false);
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

    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) nextSong();
      else prevSong();
    }
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
                    {/* Background */}
                    <div 
                        className="absolute inset-0 z-[-1]"
                        style={{ 
                            background: `linear-gradient(to bottom, ${dominantColor}, #121212)`,
                        }}
                    />

                    {/* FULL PLAYER CONTENT */}
                    <div className="relative z-10 flex flex-col h-full px-6 pt-safe-top pb-safe-bottom">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between h-16 shrink-0 mt-2">
                            <button onClick={() => setFullScreen(false)} className="p-2 -ml-2 rounded-full hover:bg-white/10 shrink-0">
                                <ChevronDown size={28} className="text-white" />
                            </button>
                            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/70">
                                Now Playing
                            </span>
                            <button onClick={() => setIsMoreMenuOpen(true)} className="p-2 -mr-2 rounded-full hover:bg-white/10 shrink-0">
                                <MoreHorizontal size={24} className="text-white" />
                            </button>
                        </div>

                        {/* Main Artwork Area */}
                        <div className="flex-1 flex flex-col justify-center min-h-0 relative my-4">
                            <div className="relative w-full aspect-square max-w-[340px] mx-auto shadow-2xl rounded-xl overflow-hidden">
                                <img 
                                    src={imageUrl} 
                                    alt="Cover"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Info & Controls */}
                        <div className="flex flex-col gap-6 mb-10">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col overflow-hidden mr-4 min-w-0">
                                    <h2 className="text-2xl font-bold text-white truncate">
                                        {currentSong.name}
                                    </h2>
                                    <p className="text-lg text-white/70 truncate">
                                        {primaryArtistName}
                                    </p>
                                </div>
                                <button onClick={() => toggleLike(currentSong)} className="shrink-0">
                                    {isLiked ? <CheckCircle2 size={28} className="text-[#1DB954] fill-black" /> : <PlusCircle size={28} className="text-white/70" />}
                                </button>
                            </div>

                            {/* Scrubber - Improved Hit Area */}
                            <div className="flex flex-col gap-2 pt-2">
                                {/* Container with larger height for touch target */}
                                <div className="relative h-6 w-full flex items-center group cursor-pointer">
                                     
                                     {/* Background Track */}
                                     <div className="absolute left-0 right-0 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                         {/* Progress Fill */}
                                         <div 
                                            ref={fullProgressRef}
                                            className="h-full bg-white rounded-full transition-all duration-75 ease-out" 
                                            style={{ width: '0%' }}
                                         />
                                     </div>

                                     {/* Thumb (Dot) - Positioned based on progress */}
                                     <div 
                                        ref={fullThumbRef}
                                        className="absolute h-3.5 w-3.5 bg-white rounded-full shadow-md scale-100 transition-transform active:scale-125 z-10 pointer-events-none"
                                        style={{ left: '-7px' }}
                                     />
                                     
                                     {/* Interaction Layer (Invisible Input) */}
                                     <input 
                                        ref={fullRangeRef}
                                        type="range" 
                                        min="0" 
                                        max={duration || 100} 
                                        step="any"
                                        defaultValue="0"
                                        onChange={handleSeek}
                                        onMouseDown={(e) => { e.stopPropagation(); setIsDragging(true); }}
                                        onTouchStart={(e) => { e.stopPropagation(); setIsDragging(true); }}
                                        onMouseUp={(e) => { e.stopPropagation(); setIsDragging(false); }}
                                        onTouchEnd={(e) => { e.stopPropagation(); setIsDragging(false); }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] text-white/50 font-mono font-medium -mt-1">
                                    <span ref={fullTimeRef}>0:00</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between px-2">
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
                            </div>

                            {/* Bottom Row */}
                            <div className="flex items-center justify-between px-4">
                                <button className="text-white/50 shrink-0 hover:text-white transition-colors p-2">
                                    <Mic2 size={22} />
                                </button>

                                {/* Volume Control */}
                                <div className="flex items-center gap-2 flex-1 max-w-[140px] px-2 justify-center">
                                    <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-white/70 hover:text-white">
                                        {volume === 0 ? <VolumeX size={20} /> : volume < 0.5 ? <Volume1 size={20} /> : <Volume2 size={20} />}
                                    </button>
                                    <div className="relative h-1 bg-white/20 rounded-full flex-1 group cursor-pointer max-w-[100px]">
                                        <div
                                            className="absolute left-0 top-0 bottom-0 bg-white rounded-full group-hover:bg-[#1DB954] transition-colors"
                                            style={{ width: `${volume * 100}%` }}
                                        />
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={volume}
                                            onChange={handleVolumeChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <button className="text-white/50 shrink-0 hover:text-white transition-colors p-2"><ListMusic size={22} /></button>
                            </div>
                        </div>
                    </div>

                    {/* More Menu (Enhanced) */}
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
                                    className="bg-[#242424] rounded-t-2xl flex flex-col max-h-[85vh] overflow-y-auto pb-6"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {/* Drag Handle */}
                                    <div className="w-full flex justify-center pt-4 pb-2">
                                        <div className="w-10 h-1 bg-white/20 rounded-full"></div>
                                    </div>
                                    
                                    {/* Song Context Info */}
                                    <div className="flex items-center gap-3 px-6 pb-4">
                                        <img src={getImageUrl(currentSong.image)} className="w-12 h-12 rounded-md object-cover shadow-lg" alt="" />
                                        <div>
                                            <div className="font-bold text-white text-[15px]">{currentSong.name}</div>
                                            <div className="text-sm text-white/60">{primaryArtistName}</div>
                                        </div>
                                    </div>

                                    {/* Inline Accordion Download UI */}
                                    <div className="px-6 py-2">
                                        <div className={`rounded-xl transition-all border overflow-hidden ${isDownloadExpanded ? 'bg-[#2A2A2A] border-white/10' : 'bg-[#333] border-white/5'}`}>
                                            <button 
                                                onClick={() => { 
                                                    if(isDownloaded) return; // Already downloaded
                                                    setIsDownloadExpanded(!isDownloadExpanded);
                                                }} 
                                                className={`w-full flex items-center justify-between p-4 ${isDownloaded ? 'cursor-default' : 'cursor-pointer'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                      <div className={`p-2 rounded-full ${isDownloaded ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-white/10 text-white'}`}>
                                                      <Download size={20} />
                                                      </div>
                                                      <div className="flex flex-col items-start">
                                                          <span className={`text-sm font-bold ${isDownloaded ? 'text-[#1DB954]' : 'text-white'}`}>
                                                              {isDownloaded ? 'Downloaded' : 'Download'}
                                                          </span>
                                                          <span className="text-[10px] text-white/50 font-medium">
                                                          {isDownloaded ? 'Available offline' : (isDownloadExpanded ? 'Select Quality' : 'Tap to choose quality')}
                                                          </span>
                                                      </div>
                                                </div>
                                                {isDownloaded ? <CheckCircle2 size={20} className="text-[#1DB954]" /> : (
                                                    <ChevronDown size={20} className={`text-white/50 transition-transform ${isDownloadExpanded ? 'rotate-180' : ''}`} />
                                                )}
                                            </button>

                                            {/* Expanded Options */}
                                            <AnimatePresence>
                                                {isDownloadExpanded && !isDownloaded && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="border-t border-white/5 bg-[#252525]"
                                                    >
                                                        {(currentSong.downloadUrl && currentSong.downloadUrl.length > 0) ? currentSong.downloadUrl.slice().sort((a,b) => parseInt(b.quality.replace(/\D/g, '')) - parseInt(a.quality.replace(/\D/g, ''))).map((opt) => (
                                                            <button
                                                                key={opt.quality}
                                                                onClick={() => handleDownloadSelect(opt.url, opt.quality)}
                                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group border-b border-white/5 last:border-0"
                                                            >
                                                                <div className="flex flex-col items-start">
                                                                    <span className="text-white font-medium text-sm">{opt.quality}</span>
                                                                    <span className="text-[10px] text-white/40 group-hover:text-white/60">
                                                                        {opt.quality.includes('320') ? 'Best Quality (~8MB)' : opt.quality.includes('160') ? 'Good Balance (~4MB)' : 'Data Saver'}
                                                                    </span>
                                                                </div>
                                                                <Download size={16} className="text-white/20 group-hover:text-white" />
                                                            </button>
                                                        )) : (
                                                            <button
                                                                onClick={async () => {
                                                                    const info = await api.getStreamInfo(currentSong.id);
                                                                    if(info?.stream_url) handleDownloadSelect(info.stream_url, 'Standard');
                                                                }}
                                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group"
                                                            >
                                                                <div className="flex flex-col items-start">
                                                                    <span className="text-white font-medium text-sm">Download High Quality</span>
                                                                    <span className="text-[10px] text-white/40 group-hover:text-white/60">Fetch & Save</span>
                                                                </div>
                                                                <Download size={16} className="text-white/20 group-hover:text-white" />
                                                            </button>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Menu Actions List */}
                                    <div className="flex flex-col py-2">
                                        
                                        <button onClick={() => { toggleLike(currentSong); setIsMoreMenuOpen(false); }} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/5 active:bg-black/20 transition-colors">
                                            <Heart size={24} className={isLiked ? "text-[#1DB954] fill-[#1DB954]" : "text-white/80"} />
                                            <span className="text-white font-medium">{isLiked ? 'Liked' : 'Like'}</span>
                                        </button>

                                        <button onClick={handleAddToQueue} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/5 active:bg-black/20 transition-colors">
                                            <ListPlus size={24} className="text-white/80" />
                                            <span className="text-white font-medium">Add to queue</span>
                                        </button>

                                        <button onClick={handleShare} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/5 active:bg-black/20 transition-colors">
                                            <Share2 size={24} className="text-white/80" />
                                            <span className="text-white font-medium">Share</span>
                                        </button>

                                        <button onClick={() => { setIsMoreMenuOpen(false); navigate(`/artist/${currentSong.artists.primary[0].id}`, { state: { artist: currentSong.artists.primary[0] } }); }} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/5 active:bg-black/20 transition-colors">
                                            <User size={24} className="text-white/80" />
                                            <span className="text-white font-medium">View Artist</span>
                                        </button>

                                        <button onClick={() => { setIsMoreMenuOpen(false); navigate(`/album/${currentSong.album.id}`); }} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/5 active:bg-black/20 transition-colors">
                                            <Disc size={24} className="text-white/80" />
                                            <span className="text-white font-medium">View Album</span>
                                        </button>

                                        <button onClick={handleSleepTimer} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/5 active:bg-black/20 transition-colors">
                                            <Moon size={24} className={sleepTimerId ? "text-[#1DB954]" : "text-white/80"} />
                                            <span className="text-white font-medium">{sleepTimerId ? 'Stop Sleep Timer' : 'Sleep Timer (30 mins)'}</span>
                                        </button>
                                        
                                        <button onClick={handleGoToRadio} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/5 active:bg-black/20 transition-colors">
                                            <Radio size={24} className="text-white/80" />
                                            <span className="text-white font-medium">Go to Song Radio</span>
                                        </button>

                                        <button className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/5 active:bg-black/20 transition-colors">
                                            <Info size={24} className="text-white/80" />
                                            <span className="text-white font-medium">Show credits</span>
                                        </button>

                                    </div>
                                    
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <motion.div 
                    key="mini-player"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="fixed bottom-[68px] md:bottom-4 left-2 right-2 md:left-1/2 md:-translate-x-1/2 md:w-[450px] h-[56px] z-[150] cursor-pointer isolate"
                    onClick={() => setFullScreen(true)}
                >
                    {/* Background */}
                    <div 
                        className="absolute inset-0 z-[-1] rounded-lg shadow-xl overflow-hidden"
                        style={{ backgroundColor: dominantColor }}
                    >
                         <div className="absolute inset-0 bg-black/20" />
                    </div>

                    <div className="flex items-center h-full px-2 gap-3">
                        {/* Image */}
                        <div className="h-10 w-10 shrink-0 rounded-[4px] overflow-hidden shadow-sm">
                            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
                            <span className="text-white font-bold text-xs truncate">
                                {currentSong.name}
                            </span>
                            <span className="text-white/70 text-[10px] truncate">
                                {primaryArtistName}
                            </span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5 pr-1 shrink-0">
                            {/* Like Button */}
                            <button onClick={(e) => { e.stopPropagation(); toggleLike(currentSong); }} className="shrink-0 p-1.5">
                                <Heart size={20} fill={isLiked ? "#1DB954" : "none"} className={isLiked ? "text-[#1DB954]" : "text-white"} />
                            </button>
                            
                            {/* Previous Button (Hidden on very small screens if needed, but fitting here) */}
                            <button onClick={(e) => { e.stopPropagation(); prevSong(); }} className="shrink-0 p-1.5 text-white/90 hover:text-white">
                                <SkipBack size={22} fill="white" />
                            </button>

                            {/* Play/Pause Button */}
                            <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="shrink-0 p-1.5">
                                {isBuffering ? (
                                    <Loader2 size={24} className="animate-spin text-white" />
                                ) : isPlaying ? (
                                    <Pause size={24} fill="white" className="text-white" />
                                ) : (
                                    <Play size={24} fill="white" className="text-white" />
                                )}
                            </button>

                            {/* Next Button */}
                            <button onClick={(e) => { e.stopPropagation(); nextSong(); }} className="shrink-0 p-1.5 text-white/90 hover:text-white">
                                <SkipForward size={22} fill="white" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Progress Bar (Mini only) */}
                    <div className="absolute bottom-0 left-1 right-1 h-[2px] bg-white/20 rounded-full overflow-hidden">
                        <div 
                            ref={miniProgressRef}
                            className="h-full bg-white rounded-full" 
                            style={{ width: '0%' }}
                        ></div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </>
  );
};