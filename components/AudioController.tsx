import React, { useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { api, getAudioUrl, getOfflineAudioUrl, getImageUrl } from '../services/api';

export const AudioController: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { 
    currentSong, 
    isPlaying, 
    setIsPlaying, 
    setIsBuffering, 
    nextSong, 
    prevSong,
    setAudioElement,
    setPlaybackTime,
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

  // Handle Playback State
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && audio.paused) {
        audio.play().catch(e => {
            console.warn("Play blocked or interrupted", e);
            setIsPlaying(false);
        });
    } else if (!isPlaying && !audio.paused) {
        audio.pause();
    }
  }, [isPlaying, setIsPlaying]);

  // Handle Source Loading
  useEffect(() => {
    if (!currentSong || !audioRef.current) return;

    const loadSource = async () => {
        let url = '';
        
        // 1. Check Offline Storage
        if (isOfflineMode || downloadedSongIds.includes(currentSong.id)) {
            const blobUrl = await getOfflineAudioUrl(currentSong.id);
            if (blobUrl) url = blobUrl;
            else if (isOfflineMode) { setIsPlaying(false); return; }
        }
        
        // 2. Check Standard Download URLs
        if (!url && !isOfflineMode && currentSong.downloadUrl && currentSong.downloadUrl.length > 0) {
             url = getAudioUrl(currentSong.downloadUrl, streamingQuality);
        }

        // 3. Lazy Load Stream
        if (!url && !isOfflineMode) {
             try {
                 setIsBuffering(true);
                 const streamData = await api.getStreamInfo(currentSong.id);
                 if (streamData && streamData.stream_url) {
                     url = streamData.stream_url;
                 }
             } catch(e) {
                 console.error("Failed to fetch stream", e);
             }
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

    loadSource();
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
          { src: hqImage, sizes: '96x96', type: 'image/jpeg' },
          { src: hqImage, sizes: '128x128', type: 'image/jpeg' },
          { src: hqImage, sizes: '192x192', type: 'image/jpeg' },
          { src: hqImage, sizes: '256x256', type: 'image/jpeg' },
          { src: hqImage, sizes: '384x384', type: 'image/jpeg' },
          { src: hqImage, sizes: '512x512', type: 'image/jpeg' },
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
    navigator.mediaSession.setActionHandler('previoustrack', prevSong);
    navigator.mediaSession.setActionHandler('nexttrack', nextSong);
    
    // Cleanup
    return () => {
         if ('mediaSession' in navigator) {
             navigator.mediaSession.metadata = null;
         }
    };
  }, [currentSong, setIsPlaying, prevSong, nextSong]);

  const handleTimeUpdate = () => {
      if (audioRef.current) {
          const time = audioRef.current.currentTime;
          const duration = audioRef.current.duration || 0;
          setPlaybackTime(time, duration);
      }
  };

  return (
    <audio 
        ref={audioRef}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextSong}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onPause={() => {
            if (isPlaying && !audioRef.current?.seeking) setIsPlaying(false);
        }}
        onPlay={() => !isPlaying && setIsPlaying(true)}
    />
  );
};