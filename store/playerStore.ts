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
  loginUser: (user: User & { likedSongs?: Song[], history?: Song[], chats?: any }) => void;
  logoutUser: () => void;
  syncUserToCloud: (type?: 'public' | 'private' | 'both') => void;
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
        const { addToHistory, currentUser } = get();
        addToHistory(song);
        
        // Update Cloud Status (This is ephemeral, so we handle it lightly or skip for now to save bandwidth)
        // If we want real-time status in the global file, we would sync here.
        
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

      addToHistory: (song) => {
          set((state) => {
            const newHistory = [song, ...state.history.filter(s => s.id !== song.id)].slice(0, 20);
            // Trigger private sync
            setTimeout(() => get().syncUserToCloud('private'), 1000);
            return { history: newHistory };
          });
      },

      toggleLike: (song) => {
          set((state) => {
            const isLiked = state.likedSongs.some(s => s.id === song.id);
            const newLiked = isLiked ? state.likedSongs.filter(s => s.id !== song.id) : [song, ...state.likedSongs];
            
            // Trigger private sync
            setTimeout(() => get().syncUserToCloud('private'), 1000);
            
            return { likedSongs: newLiked };
          });
      },

      createPlaylist: (playlist) => {
        set((state) => {
           const newPlaylists = [playlist, ...state.userPlaylists];
           if (state.currentUser) {
             const updatedUser = { ...state.currentUser, playlists: newPlaylists };
             // Trigger private sync
             setTimeout(() => get().syncUserToCloud('private'), 1000);
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
             setTimeout(() => get().syncUserToCloud('private'), 1000);
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
             setTimeout(() => get().syncUserToCloud('private'), 1000);
             return { userPlaylists: newPlaylists, currentUser: updatedUser };
           }
           return { userPlaylists: newPlaylists };
        });
      },

      loginUser: (user) => {
          set({ 
            currentUser: user, 
            userPlaylists: user.playlists || [],
            likedSongs: user.likedSongs || [],
            history: user.history || [],
            friendRequests: user.friendRequests || []
          });
          
          // Hydrate friends with chats if available
          get().refreshFriendsActivity().then(() => {
              if (user.chats) {
                 set((state) => {
                     const friendsWithChats = state.friends.map(f => ({
                         ...f,
                         chatHistory: user.chats[f.id] || []
                     }));
                     return { friends: friendsWithChats };
                 });
              }
          });
      },

      logoutUser: () => set({ 
        currentUser: null, 
        userPlaylists: [],
        friends: [],
        friendRequests: [],
        partySession: null,
        likedSongs: [],
        history: []
      }),
      
      syncUserToCloud: async (type = 'both') => {
         const { currentUser, userPlaylists, likedSongs, history, friends } = get();
         if (!currentUser) return;

         // Ensure the currentUser object has the latest playlists
         const updatedUser = { ...currentUser, playlists: userPlaylists };

         try {
             if (type === 'public' || type === 'both') {
                // Collect chats to save
                const chats: Record<string, ChatMessage[]> = {};
                friends.forEach(f => {
                    if (f.chatHistory && f.chatHistory.length > 0) {
                        chats[f.id] = f.chatHistory;
                    }
                });
                
                await authService.syncPublicProfile(updatedUser, chats);
             }
             
             if (type === 'private' || type === 'both') {
                 // We pass the loose data explicitly
                 await authService.syncPrivateData(updatedUser, { likedSongs, history });
             }
         } catch (e) {
             console.error("Sync failed", e);
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
          
          // Profile updates are public
          setTimeout(() => {
              // We need to manually call the service here because get().syncUserToCloud reads from state,
              // and state updates might be batched.
              // Note: We don't have access to latest chats here easily without full sync, 
              // so we trigger full syncPublic for simplicity
              get().syncUserToCloud('public');
          }, 100);

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
      },

      acceptFriendRequest: async (fromEmail) => {
          const { currentUser } = get();
          if (!currentUser) return;
          const updatedUser = await authService.acceptFriendRequest(fromEmail, currentUser);
          set({ currentUser: updatedUser, friendRequests: updatedUser.friendRequests });
          get().refreshFriendsActivity();
      },

      refreshFriendsActivity: async () => {
          const { currentUser, friends } = get();
          if (!currentUser || !currentUser.friends || currentUser.friends.length === 0) {
              set({ friends: [] });
              return;
          }

          try {
              const rawFriends = await authService.getFriendsActivity(currentUser.friends);
              
              // Map raw User objects to the UI Friend type
              const mappedFriends: Friend[] = rawFriends.map(u => {
                  // Preserve existing chats if we already have this friend loaded
                  const existing = friends.find(f => f.id === u.email);
                  
                  return {
                      id: u.email,
                      name: u.name,
                      image: u.image || 'https://via.placeholder.com/150',
                      status: u.currentActivity?.status || 'offline',
                      currentSong: u.currentActivity?.song || null,
                      lastActive: u.currentActivity?.timestamp || 0,
                      chatHistory: existing ? existing.chatHistory : [] 
                  };
              });
              
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
        
        // Trigger sync to save chat
        setTimeout(() => get().syncUserToCloud('public'), 1000);

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