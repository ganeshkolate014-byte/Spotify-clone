import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Song } from '../types';

interface PlayerState {
  isPlaying: boolean;
  isBuffering: boolean;
  isFullScreen: boolean;
  currentSong: Song | null;
  queue: Song[];
  history: Song[];
  likedSongs: Song[];
  volume: number;
  isShuffling: boolean;
  
  // Actions
  playSong: (song: Song, newQueue?: Song[]) => void;
  togglePlay: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsBuffering: (isBuffering: boolean) => void;
  setFullScreen: (isFull: boolean) => void;
  nextSong: () => void;
  prevSong: () => void;
  addToQueue: (song: Song) => void;
  setQueue: (songs: Song[]) => void;
  setVolume: (val: number) => void;
  addToHistory: (song: Song) => void;
  toggleLike: (song: Song) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      isBuffering: false,
      isFullScreen: false,
      currentSong: null,
      queue: [],
      history: [],
      likedSongs: [],
      volume: 1,
      isShuffling: false,

      playSong: (song, newQueue) => {
        const { addToHistory } = get();
        addToHistory(song);
        set((state) => ({
          currentSong: song,
          isPlaying: true,
          isBuffering: true, 
          queue: newQueue ? newQueue : state.queue,
          isFullScreen: true,
        }));
      },

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setIsBuffering: (isBuffering) => set({ isBuffering }),
      setFullScreen: (isFullScreen) => set({ isFullScreen }),

      nextSong: () => {
        const { queue, currentSong, isShuffling } = get();
        if (!currentSong) return;

        const currentIndex = queue.findIndex(s => s.id === currentSong.id);
        
        let nextIndex;
        if (isShuffling) {
           nextIndex = Math.floor(Math.random() * queue.length);
        } else {
           nextIndex = currentIndex + 1;
        }

        if (nextIndex < queue.length) {
          get().playSong(queue[nextIndex]);
        } else {
          set({ isPlaying: false });
        }
      },

      prevSong: () => {
        const { queue, currentSong } = get();
        if (!currentSong) return;
        const currentIndex = queue.findIndex(s => s.id === currentSong.id);
        const prevIndex = currentIndex - 1;

        if (prevIndex >= 0) {
          get().playSong(queue[prevIndex]);
        }
      },

      addToQueue: (song) => set((state) => ({ queue: [...state.queue, song] })),
      
      setQueue: (songs) => set({ queue: songs }),

      setVolume: (volume) => set({ volume }),

      addToHistory: (song) => set((state) => {
        const newHistory = [song, ...state.history.filter(s => s.id !== song.id)].slice(0, 20);
        return { history: newHistory };
      }),

      toggleLike: (song) => set((state) => {
        const isLiked = state.likedSongs.some(s => s.id === song.id);
        let newLiked;
        if (isLiked) {
          newLiked = state.likedSongs.filter(s => s.id !== song.id);
        } else {
          newLiked = [song, ...state.likedSongs];
        }
        return { likedSongs: newLiked };
      })
    }),
    {
      name: 'vibestream-storage',
      partialize: (state) => ({ 
        history: state.history, 
        volume: state.volume,
        likedSongs: state.likedSongs
      }), 
    }
  )
);