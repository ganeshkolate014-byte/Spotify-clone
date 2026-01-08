import React, { useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { api, getAudioUrl, getOfflineAudioUrl, getImageUrl } from '../services/api';

export const AudioController: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  // Ref to suppress pause events during source change to prevent state thrashing
  const isSwitchingTrack = useRef(false);
  
  const { 
    currentSong, 
    isPlaying, 
    setIsPlaying, 
    setIsBuffering, 
    nextSong, 
    prevSong,
    setAudioElement,
    setDuration,
    duration,
    streamingQuality,
    isOfflineMode,
    downloadedSongIds
  } = usePlayerStore();

  // Register audio element in store on mount
  useEffect(() => {
    if (audioRef.current) {
        setAudioElement(audioRef.current);
    }
  }, [setAudioElement]);

  // Handle Playback State (Play/Pause)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const attemptPlay = async () => {
        try {
            await audio.play();
        } catch (e: any) {
            // AbortError is expected when we interrupt play with pause/load. Ignore it.
            if (e.name !== 'AbortError') {
                console.warn("Play blocked or interrupted", e);
                setIsPlaying(false);
            }
        }
    };

    if (isPlaying && audio.paused) {
        attemptPlay();
    } else if (!isPlaying && !audio.paused) {
        audio.pause();
    }
  }, [isPlaying, setIsPlaying]);

  // Handle Source Loading
  useEffect(() => {
    if (!currentSong || !audioRef.current) return;

    let isCancelled = false;

    const loadSource = async () => {
        let url = '';
        
        // 1. Check Offline Storage
        if (isOfflineMode || downloadedSongIds.includes(currentSong.id)) {
            const blobUrl = await getOfflineAudioUrl(currentSong.id);
            if (blobUrl) url = blobUrl;
            else if (isOfflineMode) { 
                if (!isCancelled) setIsPlaying(false); 
                return; 
            }
        }
        
        // 2. Check Standard Download URLs
        if (!url && !isOfflineMode && currentSong.downloadUrl && currentSong.downloadUrl.length > 0) {
             url = getAudioUrl(currentSong.downloadUrl, streamingQuality);
        }

        // 3. Lazy Load Stream
        if (!url && !isOfflineMode) {
             try {
                 if (!isCancelled) setIsBuffering(true);
                 const streamData = await api.getStreamInfo(currentSong.id);
                 if (streamData && streamData.stream_url) {
                     url = streamData.stream_url;
                 }
             } catch(e) {
                 console.error("Failed to fetch stream", e);
             }
        }

        if (isCancelled) return;

        if (url && audioRef.current) {
            // Avoid reloading if same src
            if (audioRef.current.src === url) {
                 if (usePlayerStore.getState().isPlaying && audioRef.current.paused) {
                      audioRef.current.play().catch(() => {});
                 }
                 return;
            }

            // Flag that we are switching tracks to prevent onPause from triggering
            isSwitchingTrack.current = true;

            const shouldPlay = usePlayerStore.getState().isPlaying;
            audioRef.current.src = url;
            // Note: src assignment triggers loading automatically
            
            if (shouldPlay) {
                 try {
                     await audioRef.current.play();
                 } catch(e: any) {
                     if (e.name !== 'AbortError') {
                         console.warn("Autoplay blocked", e);
                         if (!isCancelled) setIsPlaying(false);
                     }
                 }
            } else {
                 setIsPlaying(false);
            }

            // Reset switching flag after a short delay
            setTimeout(() => {
                isSwitchingTrack.current = false;
            }, 200);
        }
    };

    loadSource();

    return () => {
        isCancelled = true;
    };
  }, [currentSong?.id, streamingQuality, isOfflineMode, downloadedSongIds]);

  // Handle Media Session (Notification Controls)
  useEffect(() => {
    if (!currentSong || !('mediaSession' in navigator)) return;

    const artistName = currentSong.artists?.primary?.[0]?.name || "Unknown";
    const hqImage = getImageUrl(currentSong.image);

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.name,
      artist: artistName,
      album: currentSong.album?.name || "Single",
      artwork: [
          { src: hqImage, sizes: '512x512', type: 'image/jpeg' },
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
    navigator.mediaSession.setActionHandler('previoustrack', prevSong);
    navigator.mediaSession.setActionHandler('nexttrack', nextSong);
    
  }, [currentSong, setIsPlaying, prevSong, nextSong]);

  const handleTimeUpdate = () => {
      // PERFORMANCE: Only update store if duration changes significantly
      if (audioRef.current) {
          const dur = audioRef.current.duration;
          if (dur && dur !== Infinity && !isNaN(dur) && Math.abs(dur - duration) > 1) {
              setDuration(dur);
          }
      }
  };

  const handlePause = () => {
      // Ignore pause events caused by track switching
      if (isSwitchingTrack.current) return;
      
      if (isPlaying && !audioRef.current?.seeking) {
          setIsPlaying(false);
      }
  };

  return (
    <audio 
        ref={audioRef}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={nextSong}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onPause={handlePause}
        onPlay={() => !isPlaying && setIsPlaying(true)}
        onError={(e) => {
            console.error("Audio playback error", e);
            setIsBuffering(false);
        }}
    />
  );
};