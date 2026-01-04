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
  
  // Realtime Cleanup
  unsubscribers: Function[];

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
  initRealtimeListeners: () => void;

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
      unsubscribers: [],

      playSong: (song, newQueue) => {
        const { addToHistory, currentUser } = get();
        addToHistory(song);
        
        // Update Cloud Status Realtime
        if (currentUser) {
            authService.updateUserStatus('listening', song);
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
      
      setIsPlaying: (isPlaying) => {
          set({ isPlaying });
          const { currentUser, currentSong } = get();
          if (currentUser && !isPlaying) {
             authService.updateUserStatus('online', currentSong); // Paused
          }
      },

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
            setTimeout(() => get().syncUserToCloud('private'), 1000);
            return { history: newHistory };
          });
      },

      toggleLike: (song) => {
          set((state) => {
            const isLiked = state.likedSongs.some(s => s.id === song.id);
            const newLiked = isLiked ? state.likedSongs.filter(s => s.id !== song.id) : [song, ...state.likedSongs];
            setTimeout(() => get().syncUserToCloud('private'), 1000);
            return { likedSongs: newLiked };
          });
      },

      createPlaylist: (playlist) => {
        set((state) => {
           const newPlaylists = [playlist, ...state.userPlaylists];
           if (state.currentUser) {
             const updatedUser = { ...state.currentUser, playlists: newPlaylists };
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

      // --- AUTH ACTIONS ---

      loginUser: (user) => {
          set({ 
            currentUser: user, 
            userPlaylists: user.playlists || [],
            likedSongs: user.likedSongs || [],
            history: user.history || [],
            friendRequests: user.friendRequests || []
          });
          
          // Hydrate initial chat history
          if (user.chats) {
              set((state) => {
                  // Map raw chat objects to friends
                  // We need to temporarily create friend objects if they don't exist in 'friends' state yet
                  // but typically 'initRealtimeListeners' will handle this better.
                  return state; 
              });
          }

          // Start Realtime Listeners
          get().initRealtimeListeners();
      },

      initRealtimeListeners: () => {
         // 1. Unsubscribe existing
         const { unsubscribers, currentUser } = get();
         unsubscribers.forEach(unsub => unsub());
         set({ unsubscribers: [] });

         if (!currentUser) return;

         // 2. Subscribe to My User Data (Friend Requests, My Profile Changes, Incoming Chats)
         const unsubUser = authService.subscribeToUserData((data) => {
             set((state) => {
                 const updatedUser = { ...state.currentUser, ...data } as User;
                 
                 // Handle incoming chats
                 let updatedFriends = [...state.friends];
                 if (data.chats) {
                     updatedFriends = updatedFriends.map(f => ({
                         ...f,
                         chatHistory: data.chats[f.id] || []
                     }));
                 }

                 return {
                     currentUser: updatedUser,
                     friendRequests: data.friendRequests || [],
                     friends: updatedFriends,
                     // If playlists updated from another device
                     userPlaylists: data.playlists || state.userPlaylists
                 };
             });
         });

         // 3. Subscribe to Friends' Activity (Status, Song)
         let unsubFriends = () => {};
         if (currentUser.friends && currentUser.friends.length > 0) {
             unsubFriends = authService.subscribeToFriendsActivity(currentUser.friends, (friendsData) => {
                 set((state) => {
                     // Merge live data with existing friend list
                     const mappedFriends: Friend[] = friendsData.map((u: any) => {
                         const existing = state.friends.find(f => f.id === u.email);
                         const chats = state.currentUser?.chats ? state.currentUser.chats[u.email] : [];

                         return {
                             id: u.email,
                             name: u.name,
                             image: u.image || '',
                             status: u.currentActivity?.status || 'offline',
                             currentSong: u.currentActivity?.song || null,
                             lastActive: u.currentActivity?.timestamp || 0,
                             chatHistory: existing?.chatHistory || chats || []
                         };
                     });
                     return { friends: mappedFriends };
                 });
             });
         }

         set({ unsubscribers: [unsubUser, unsubFriends] });
      },

      logoutUser: async () => {
        // Cleanup listeners
        get().unsubscribers.forEach(unsub => unsub());
        
        await authService.logout();

        set({ 
            currentUser: null, 
            userPlaylists: [],
            friends: [],
            friendRequests: [],
            partySession: null,
            likedSongs: [],
            history: [],
            unsubscribers: []
        });
      },
      
      syncUserToCloud: async (type = 'both') => {
         const { currentUser, userPlaylists, likedSongs, history } = get();
         if (!currentUser) return;

         const updatedUser = { ...currentUser, playlists: userPlaylists };

         try {
             if (type === 'public' || type === 'both') {
                // Chats are now handled via sendMessage atomic updates
                await authService.syncPublicProfile(updatedUser);
             }
             if (type === 'private' || type === 'both') {
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
          
          // Trigger sync immediately
          setTimeout(() => {
              get().syncUserToCloud('public');
          }, 100);

          return { currentUser: updatedUser };
        });
      },

      // --- SOCIAL ACTIONS ---

      searchUsers: async (query) => {
          try {
              const results = await authService.searchUsers(query);
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
          // Note: No need to manually update requests, the listener on the OTHER user will handle it, 
          // and if we listed sent requests, we'd need to listen to that too. 
          // Current app only shows RECEIVED requests.
      },

      acceptFriendRequest: async (fromEmail) => {
          const { currentUser } = get();
          if (!currentUser) return;
          
          await authService.acceptFriendRequest(fromEmail, currentUser);
          
          // Re-init listeners to pick up the new friend in the Friends Activity listener
          setTimeout(() => {
              get().initRealtimeListeners();
          }, 1000);
      },

      refreshFriendsActivity: async () => {
          // Deprecated in favor of initRealtimeListeners, 
          // but kept as a manual fallback if needed
          get().initRealtimeListeners();
      },

      openChat: (friendId) => set({ activeChatFriendId: friendId }),

      sendMessage: async (friendId, text) => {
          const { currentUser } = get();
          if (!currentUser) return;

          const newMessage: ChatMessage = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              senderId: currentUser.email,
              text,
              timestamp: Date.now()
          };

          // Optimistic Update
          set((state) => {
              const updatedFriends = state.friends.map(f => {
                  if (f.id === friendId) {
                      return { ...f, chatHistory: [...f.chatHistory, newMessage] };
                  }
                  return f;
              });
              return { friends: updatedFriends };
          });

          // Send to Cloud (Updates both users)
          try {
              await authService.sendChatMessage(currentUser.email, friendId, newMessage);
          } catch (e) {
              console.error("Failed to send message", e);
              // In production, revert optimistic update here
          }
      },

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
        // Don't persist friends heavily, let listeners hydrate them
      }), 
    }
  )
);