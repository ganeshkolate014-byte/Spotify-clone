import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Song, UserPlaylist, User, Friend, ChatMessage, PartySession } from '../types';
import { authService } from '../services/auth';

// Mock Data for Friends to demonstrate UI
const MOCK_FRIENDS: Friend[] = [
  {
    id: 'f1',
    name: 'Anjali Sharma',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    status: 'listening',
    lastActive: Date.now(),
    currentSong: {
      id: 'mock1',
      name: 'Kesariya',
      type: 'song',
      album: { id: 'a1', name: 'Brahmastra', url: '' },
      year: '2022',
      duration: '292',
      language: 'Hindi',
      genre: 'Pop',
      image: [{ quality: 'high', url: 'https://c.saavncdn.com/191/Kesariya-From-Brahmastra-Hindi-2022-20220717092820-500x500.jpg' }],
      artists: { primary: [{ id: 'ar1', name: 'Arijit Singh', role: 'Singer', image: [] }], featured: [], all: [] },
      downloadUrl: []
    },
    chatHistory: [
      { id: 'm1', senderId: 'f1', text: 'Have you heard this new track?', timestamp: Date.now() - 100000 }
    ]
  },
  {
    id: 'f2',
    name: 'Rahul Verma',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    status: 'online',
    lastActive: Date.now(),
    currentSong: null,
    chatHistory: []
  },
  {
    id: 'f3',
    name: 'Priya Patel',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    status: 'listening',
    lastActive: Date.now(),
    currentSong: {
      id: 'mock2',
      name: 'Starboy',
      type: 'song',
      album: { id: 'a2', name: 'Starboy', url: '' },
      year: '2016',
      duration: '230',
      language: 'English',
      genre: 'Pop',
      image: [{ quality: 'high', url: 'https://i.scdn.co/image/ab67616d0000b2734718e28d24527d9774635ded' }],
      artists: { primary: [{ id: 'ar2', name: 'The Weeknd', role: 'Singer', image: [] }], featured: [], all: [] },
      downloadUrl: []
    },
    chatHistory: []
  }
];

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

  // Social
  friends: Friend[];
  activeChatFriendId: string | null;
  partySession: PartySession | null;

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

  // Social Actions
  openChat: (friendId: string | null) => void;
  sendMessage: (friendId: string, text: string) => void;
  startParty: () => void;
  stopParty: () => void;
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
      
      // Social Initial State
      friends: MOCK_FRIENDS,
      activeChatFriendId: null,
      partySession: null,

      playSong: (song, newQueue) => {
        const { addToHistory, partySession } = get();
        addToHistory(song);
        
        // If hosting a party, this song would theoretically sync to others here
        if (partySession && partySession.hostId === 'me') {
            console.log("Broadcasting song change to party...");
        }

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
           if (state.currentUser) {
             const updatedUser = { ...state.currentUser, playlists: newPlaylists };
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
        userPlaylists: user.playlists || []
      }),

      logoutUser: () => set({ 
        currentUser: null, 
        userPlaylists: [],
        partySession: null
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
      },

      // --- SOCIAL ACTIONS ---

      openChat: (friendId) => set({ activeChatFriendId: friendId }),

      sendMessage: (friendId, text) => set((state) => {
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          senderId: 'me',
          text,
          timestamp: Date.now()
        };

        const updatedFriends = state.friends.map(f => {
          if (f.id === friendId) {
             return { ...f, chatHistory: [...f.chatHistory, newMessage] };
          }
          return f;
        });

        // Mock Reply for demo
        setTimeout(() => {
            get().openChat(friendId); // refresh
            set(prev => ({
                friends: prev.friends.map(f => {
                    if (f.id === friendId) {
                         return {
                             ...f,
                             chatHistory: [...f.chatHistory, {
                                 id: `reply-${Date.now()}`,
                                 senderId: f.id,
                                 text: 'That sounds awesome! Let\'s listen together.',
                                 timestamp: Date.now()
                             }]
                         }
                    }
                    return f;
                })
            }))
        }, 1500);

        return { friends: updatedFriends };
      }),

      startParty: () => set((state) => {
         if (!state.currentUser) return {};
         return {
             partySession: {
                 isActive: true,
                 hostId: 'me',
                 hostName: state.currentUser.name,
                 listeners: state.activeChatFriendId ? [state.activeChatFriendId] : []
             }
         }
      }),

      stopParty: () => set({ partySession: null })
    }),
    {
      name: 'vibestream-storage',
      partialize: (state) => ({ 
        history: state.history, 
        volume: state.volume,
        likedSongs: state.likedSongs,
        userPlaylists: state.userPlaylists,
        currentUser: state.currentUser,
        friends: state.friends // Persist mock friends for demo consistency
      }), 
    }
  )
);