import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Song, UserPlaylist, User } from '../types';
import { authService } from '../services/auth';

interface PlayerState {
  isPlaying: boolean;
  isBuffering: boolean;
  isFullScreen: boolean;
  currentSong: Song | null;
  queue: Song[];
  history: Song[];
  likedSongs: Song[];
  userPlaylists: UserPlaylist[];
  volume: number;
  isShuffling: boolean;
  
  // Auth
  currentUser: User | null;

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
  createPlaylist: (playlist: UserPlaylist) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removePlaylist: (id: string) => void;
  
  // Auth Actions
  loginUser: (user: User) => void;
  logoutUser: () => void;
  syncUserToCloud: () => void;
  updateUserProfile: (name: string, image?: string) => void;
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
      userPlaylists: [],
      volume: 1,
      isShuffling: false,
      currentUser: null,

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
      }),

      createPlaylist: (playlist) => {
        set((state) => {
           const newPlaylists = [playlist, ...state.userPlaylists];
           // Sync if user logged in
           if (state.currentUser) {
             const updatedUser = { ...state.currentUser, playlists: newPlaylists };
             // Fire and forget sync
             authService.syncUser(updatedUser).catch(console.error);
             return { userPlaylists: newPlaylists, currentUser: updatedUser };
           }
           return { userPlaylists: newPlaylists };
        });
      },

      addSongToPlaylist: (playlistId, song) => {
        set((state) => {
          const newPlaylists = state.userPlaylists.map(p => {
            if (p.id === playlistId) {
               if (p.songs.some(s => s.id === song.id)) return p;
               return { ...p, songs: [...p.songs, song] };
            }
            return p;
          });

          if (state.currentUser) {
             const updatedUser = { ...state.currentUser, playlists: newPlaylists };
             authService.syncUser(updatedUser).catch(console.error);
             return { userPlaylists: newPlaylists, currentUser: updatedUser };
          }
          return { userPlaylists: newPlaylists };
        });
      },

      removePlaylist: (id) => {
        set((state) => {
           const newPlaylists = state.userPlaylists.filter(p => p.id !== id);
           if (state.currentUser) {
             const updatedUser = { ...state.currentUser, playlists: newPlaylists };
             authService.syncUser(updatedUser).catch(console.error);
             return { userPlaylists: newPlaylists, currentUser: updatedUser };
           }
           return { userPlaylists: newPlaylists };
        });
      },

      loginUser: (user) => set({ 
        currentUser: user, 
        userPlaylists: user.playlists || [] // Load user playlists
      }),

      logoutUser: () => set({ 
        currentUser: null, 
        userPlaylists: [] 
      }),
      
      syncUserToCloud: async () => {
         const { currentUser } = get();
         if (currentUser) {
            await authService.syncUser(currentUser);
         }
      },

      updateUserProfile: (name, image) => {
        set((state) => {
          if (!state.currentUser) return {};
          const updatedUser = { 
              ...state.currentUser, 
              name: name,
              image: image !== undefined ? image : state.currentUser.image 
          };
          
          authService.syncUser(updatedUser).catch(console.error);
          return { currentUser: updatedUser };
        });
      }
    }),
    {
      name: 'vibestream-storage',
      partialize: (state) => ({ 
        history: state.history, 
        volume: state.volume,
        likedSongs: state.likedSongs,
        userPlaylists: state.userPlaylists,
        currentUser: state.currentUser
      }), 
    }
  )
);