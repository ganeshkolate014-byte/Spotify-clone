import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Song, UserPlaylist, User, Friend, ChatMessage, PartySession, FriendRequest } from '../types';
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

  // Social
  friends: Friend[]; // Mapped from currentUser.friends
  friendRequests: FriendRequest[];
  searchResults: { name: string, email: string, image?: string }[];
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
  searchUsers: (query: string) => Promise<void>;
  sendFriendRequest: (toEmail: string) => Promise<void>;
  acceptFriendRequest: (fromEmail: string) => Promise<void>;
  refreshFriendsActivity: () => Promise<void>;
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
      friends: [],
      friendRequests: [],
      searchResults: [],
      activeChatFriendId: null,
      partySession: null,

      playSong: (song, newQueue) => {
        const { addToHistory, partySession, currentUser } = get();
        addToHistory(song);
        
        // Update Cloud Status for Friends to see
        if (currentUser) {
            const updatedUser = { 
                ...currentUser, 
                currentActivity: {
                    song: song,
                    timestamp: Date.now(),
                    status: 'listening' as const
                } 
            };
            set({ currentUser: updatedUser });
            // Sync quietly
            authService.syncUser(updatedUser).catch(console.error);
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
        let nextIndex = isShuffling ? Math.floor(Math.random() * queue.length) : currentIndex + 1;
        if (nextIndex < queue.length) get().playSong(queue[nextIndex]);
        else set({ isPlaying: false });
      },

      prevSong: () => {
        const { queue, currentSong } = get();
        if (!currentSong) return;
        const currentIndex = queue.findIndex(s => s.id === currentSong.id);
        if (currentIndex - 1 >= 0) get().playSong(queue[currentIndex - 1]);
      },

      addToQueue: (song) => set((state) => ({ queue: [...state.queue, song] })),
      setQueue: (songs) => set({ queue: songs }),
      setVolume: (volume) => set({ volume }),

      addToHistory: (song) => set((state) => ({ history: [song, ...state.history.filter(s => s.id !== song.id)].slice(0, 20) })),

      toggleLike: (song) => set((state) => {
        const isLiked = state.likedSongs.some(s => s.id === song.id);
        return { likedSongs: isLiked ? state.likedSongs.filter(s => s.id !== song.id) : [song, ...state.likedSongs] };
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

      loginUser: (user) => {
          set({ 
            currentUser: user, 
            userPlaylists: user.playlists || [],
            friendRequests: user.friendRequests || []
          });
          get().refreshFriendsActivity();
      },

      logoutUser: () => set({ 
        currentUser: null, 
        userPlaylists: [],
        friends: [],
        friendRequests: [],
        partySession: null
      }),
      
      syncUserToCloud: async () => {
         const { currentUser } = get();
         if (currentUser) await authService.syncUser(currentUser);
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

      searchUsers: async (query) => {
          try {
              const results = await authService.searchUsers(query);
              // Filter out self
              const { currentUser } = get();
              const filtered = results.filter(u => u.email !== currentUser?.email);
              set({ searchResults: filtered });
          } catch (e) {
              console.error(e);
          }
      },

      sendFriendRequest: async (toEmail) => {
          const { currentUser } = get();
          if (!currentUser) return;
          await authService.sendFriendRequest(toEmail, currentUser);
          // Optimistic UI update? No, wait for refresh.
      },

      acceptFriendRequest: async (fromEmail) => {
          const { currentUser } = get();
          if (!currentUser) return;
          const updatedUser = await authService.acceptFriendRequest(fromEmail, currentUser);
          set({ currentUser: updatedUser, friendRequests: updatedUser.friendRequests });
          get().refreshFriendsActivity();
      },

      refreshFriendsActivity: async () => {
          const { currentUser } = get();
          if (!currentUser || !currentUser.friends || currentUser.friends.length === 0) {
              set({ friends: [] });
              return;
          }

          try {
              const rawFriends = await authService.getFriendsActivity(currentUser.friends);
              
              // Map raw User objects to the UI Friend type
              const mappedFriends: Friend[] = rawFriends.map(u => ({
                  id: u.email,
                  name: u.name,
                  image: u.image || 'https://via.placeholder.com/150',
                  status: u.currentActivity?.status || 'offline',
                  currentSong: u.currentActivity?.song || null,
                  lastActive: u.currentActivity?.timestamp || 0,
                  chatHistory: [] // Chat history would require a separate persisted file, skipping for this demo complexity
              }));
              
              set({ friends: mappedFriends });
          } catch (e) {
              console.error("Failed to refresh friends", e);
          }
      },

      openChat: (friendId) => set({ activeChatFriendId: friendId }),

      sendMessage: (friendId, text) => set((state) => {
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          senderId: state.currentUser?.email || 'me',
          text,
          timestamp: Date.now()
        };

        const updatedFriends = state.friends.map(f => {
          if (f.id === friendId) {
             return { ...f, chatHistory: [...f.chatHistory, newMessage] };
          }
          return f;
        });

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
        friends: state.friends // Persist friends locally
      }), 
    }
  )
);