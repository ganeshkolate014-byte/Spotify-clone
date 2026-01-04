import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Song, UserPlaylist, User, Friend, ChatMessage, PartySession } from '../types';
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
  friends: Friend[]; // Unified list
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
  addContact: (email: string) => Promise<void>;
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
      searchResults: [],
      activeChatFriendId: null,
      partySession: null,
      unsubscribers: [],

      playSong: (song, newQueue) => {
        const { addToHistory, currentUser } = get();
        addToHistory(song);
        
        if (currentUser) {
            authService.updateUserStatus('listening', song);
        }
        
        set((state) => ({
          currentSong: song,
          isPlaying: true,
          isBuffering: true, 
          queue: newQueue ? newQueue : state.queue,
          isFullScreen: false, // Changed: Do not auto-open full player
        }));
      },

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      
      setIsPlaying: (isPlaying) => {
          set({ isPlaying });
          const { currentUser, currentSong } = get();
          if (currentUser && !isPlaying) {
             authService.updateUserStatus('online', currentSong);
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

      loginUser: (user) => {
          set({ 
            currentUser: user, 
            userPlaylists: user.playlists || [],
            likedSongs: user.likedSongs || [],
            history: user.history || [],
          });
          get().initRealtimeListeners();
      },

      initRealtimeListeners: () => {
         const { unsubscribers, currentUser } = get();
         // Cleanup old listeners
         unsubscribers.forEach(unsub => unsub());
         
         if (!currentUser) {
             set({ unsubscribers: [] });
             return;
         }

         const newUnsubscribers: Function[] = [];

         // 1. Listen to MY DATA (Chats, Contact List changes)
         const unsubUser = authService.subscribeToUserData((data) => {
             set((state) => {
                 const updatedUser = { ...state.currentUser, ...data } as User;
                 
                 const existingFriends = state.friends;
                 const serverContactEmails = data.friends || [];
                 const serverChats = data.chats || {};

                 // Reconstruct friends array based on server email list
                 const mergedFriends: Friend[] = serverContactEmails.map((email: string) => {
                     // Find existing state for this friend to keep status/song
                     const existing = existingFriends.find(f => f.id === email);
                     
                     // Get chats from my doc
                     const chatHistory = serverChats[email] || serverChats[email.replace(/\./g, '_dot_')] || [];

                     return {
                         id: email,
                         name: existing?.name || email.split('@')[0], 
                         image: existing?.image || '',
                         status: existing?.status || 'offline', 
                         currentSong: existing?.currentSong || null, 
                         lastActive: existing?.lastActive || 0,
                         chatHistory: chatHistory
                     };
                 });

                 return {
                     currentUser: updatedUser,
                     friends: mergedFriends,
                     userPlaylists: data.playlists || state.userPlaylists
                 };
             });
         });
         newUnsubscribers.push(unsubUser);

         // 2. Listen to CONTACTS ACTIVITY (Status, Song)
         if (currentUser.friends && currentUser.friends.length > 0) {
             const unsubFriends = authService.subscribeToFriendsActivity(currentUser.friends, (friendsData) => {
                 set((state) => {
                     const updatedFriends = state.friends.map(f => {
                         const liveData = friendsData.find((d: any) => d.email === f.id);
                         if (liveData) {
                             return {
                                 ...f,
                                 name: liveData.name || f.name,
                                 image: liveData.image || f.image,
                                 status: liveData.currentActivity?.status || 'offline',
                                 currentSong: liveData.currentActivity?.song || null,
                                 lastActive: liveData.currentActivity?.timestamp || 0
                             };
                         }
                         return f;
                     });
                     return { friends: updatedFriends };
                 });
             });
             newUnsubscribers.push(unsubFriends);
         }

         set({ unsubscribers: newUnsubscribers });
      },

      logoutUser: async () => {
        get().unsubscribers.forEach(unsub => unsub());
        await authService.logout();
        set({ 
            currentUser: null, 
            userPlaylists: [],
            friends: [],
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
             if (type === 'public' || type === 'both') await authService.syncPublicProfile(updatedUser);
             if (type === 'private' || type === 'both') await authService.syncPrivateData(updatedUser, { likedSongs, history });
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
          setTimeout(() => get().syncUserToCloud('public'), 100);
          return { currentUser: updatedUser };
        });
      },

      searchUsers: async (query) => {
          try {
              const results = await authService.searchUsers(query);
              const { currentUser } = get();
              const filtered = results.filter(u => u.email !== currentUser?.email);
              set({ searchResults: filtered });
          } catch (e) { console.error(e); }
      },

      addContact: async (email) => {
          const { currentUser } = get();
          if (!currentUser) return;
          
          await authService.addContact(email);
          
          // Optimistically update
          set((state) => {
              if (state.friends.some(f => f.id === email)) return {};
              const newFriend: Friend = {
                  id: email,
                  name: email.split('@')[0],
                  image: '',
                  status: 'offline',
                  lastActive: 0,
                  chatHistory: []
              };
              return { 
                  friends: [...state.friends, newFriend],
                  activeChatFriendId: email // Open chat immediately
              };
          });
          
          // Re-init listeners to subscribe to new friend's status
          setTimeout(() => {
              get().initRealtimeListeners();
          }, 500);
      },

      refreshFriendsActivity: async () => {
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

          set((state) => {
              const updatedFriends = state.friends.map(f => {
                  if (f.id === friendId) {
                      return { ...f, chatHistory: [...f.chatHistory, newMessage] };
                  }
                  return f;
              });
              return { friends: updatedFriends };
          });

          await authService.sendChatMessage(currentUser.email, friendId, newMessage);
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
      }), 
    }
  )
);