import React, { useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { api, getAudioUrl, getOfflineAudioUrl, getImageUrl } from '../services/api';

export const AudioController: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { 
    currentSong, 
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
                 // Check if it was paused but state says playing (desync fix)
                 if (usePlayerStore.getState().isPlaying && audioRef.current.paused) {
                      audioRef.current.play().catch(() => {});
                 }
                 return;
            }

            const shouldPlay = usePlayerStore.getState().isPlaying;
            audioRef.current.src = url;
            
            if (shouldPlay) {
                 audioRef.current.play().catch(e => {
                     // AbortError is normal during rapid skips
                     if (e.name !== 'AbortError') {
                         console.warn("Autoplay blocked", e);
                         if (!isCancelled) setIsPlaying(false);
                     }
                 });
            } else {
                 setIsPlaying(false);
            }
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

    // We use the store actions to ensure UI updates correctly
    navigator.mediaSession.setActionHandler('play', () => usePlayerStore.getState().togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => usePlayerStore.getState().togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', prevSong);
    navigator.mediaSession.setActionHandler('nexttrack', nextSong);
    
  }, [currentSong, prevSong, nextSong]);

  const handleTimeUpdate = () => {
      // Check duration validity regularly
      if (audioRef.current) {
          const dur = audioRef.current.duration;
          // Update if store duration is invalid (0) or different enough
          if (dur && dur !== Infinity && !isNaN(dur) && (duration === 0 || Math.abs(dur - duration) > 0.5)) {
              setDuration(dur);
          }
      }
  };
  
  const handleDurationChange = () => {
      if (audioRef.current) {
          const dur = audioRef.current.duration;
          if (dur && dur !== Infinity && !isNaN(dur)) {
              setDuration(dur);
          }
      }
  };

  const handlePause = () => {
     // Sync store if paused externally (e.g. bluetooth headset)
     const store = usePlayerStore.getState();
     if (store.isPlaying && !audioRef.current?.seeking) {
         store.setIsPlaying(false);
     }
  };

  const handlePlay = () => {
      // Sync store if played externally
      const store = usePlayerStore.getState();
      if (!store.isPlaying) {
          store.setIsPlaying(true);
      }
  };

  return (
    <audio 
        ref={audioRef}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleDurationChange}
        onDurationChange={handleDurationChange}
        onEnded={nextSong}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onPause={handlePause}
        onPlay={handlePlay}
        onError={(e) => {
            console.error("Audio playback error", e);
            setIsBuffering(false);
        }}
    />
  );
};