
import { User, ChatMessage, UserPlaylist } from '../types';
import { auth, db, rtdb } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { 
  ref, 
  set, 
  push, 
  onValue, 
  off, 
  get as getRtdb, 
  onDisconnect,
  serverTimestamp
} from 'firebase/database';

// Helper to remove undefined values
const cleanData = (obj: any) => {
  return JSON.parse(JSON.stringify(obj));
};

// Helper to sanitize email for RTDB paths
const sanitize = (email: string) => email.replace(/\./g, '_');

export const authService = {

  // 1. SIGN UP
  signup: async (name: string, email: string, password: string): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const newUser: User = {
        name,
        email,
        image: '',
        friends: [],
        playlists: [],
        likedSongs: [],
        favoriteArtists: [],
        history: [],
        chats: {}
      };

      // Create User Profile in Firestore
      await setDoc(doc(db, "users", uid), cleanData({
        ...newUser,
        settings: { volume: 1 }
      }));
      
      // Initialize Status in RTDB
      const sanitizedEmail = sanitize(email);
      await set(ref(rtdb, `status/${sanitizedEmail}`), {
          status: 'online',
          timestamp: serverTimestamp(),
          song: null
      });

      return newUser;

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('User already exists.');
      }
      throw new Error(error.message || 'Signup failed');
    }
  },

  // 2. LOGIN
  login: async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const sanitizedEmail = sanitize(email);

      // Set status to online in RTDB
      const statusRef = ref(rtdb, `status/${sanitizedEmail}`);
      await set(statusRef, {
          status: 'online',
          timestamp: serverTimestamp()
      });
      onDisconnect(statusRef).set({
          status: 'offline',
          timestamp: serverTimestamp()
      });

      // Get Profile from Firestore
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("User data not found");
      }

      const userData = userDoc.data();

      // Get Chats from RTDB
      const chatsRef = ref(rtdb, `chats/${sanitizedEmail}`);
      const chatsSnap = await getRtdb(chatsRef);
      const rtdbChats = chatsSnap.exists() ? chatsSnap.val() : {};
      
      // Transform RTDB chats object to array format expected by app
      const formattedChats: Record<string, ChatMessage[]> = {};
      Object.keys(rtdbChats).forEach(key => {
          if (rtdbChats[key]) {
              formattedChats[key] = Object.values(rtdbChats[key]);
          }
      });

      return {
        email: userData.email,
        name: userData.name,
        image: userData.image,
        friends: userData.friends || [],
        playlists: userData.playlists || [],
        likedSongs: userData.likedSongs || [],
        history: userData.history || [],
        favoriteArtists: userData.favoriteArtists || [],
        chats: formattedChats,
        currentActivity: { status: 'online', timestamp: Date.now(), song: null } // Initial state
      };

    } catch (error: any) {
      if (
        error.code === 'auth/invalid-credential' || 
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-email'
      ) {
        throw new Error("Password or Email Incorrect");
      }
      throw error;
    }
  },

  // 3. GOOGLE LOGIN
  loginWithGoogle: async (): Promise<User> => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const uid = user.uid;
        const email = user.email || '';
        const sanitizedEmail = sanitize(email);

        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);
        
        // Set Status in RTDB
        const statusRef = ref(rtdb, `status/${sanitizedEmail}`);
        await set(statusRef, {
            status: 'online',
            timestamp: serverTimestamp()
        });
        onDisconnect(statusRef).set({
            status: 'offline',
            timestamp: serverTimestamp()
        });

        if (!userDoc.exists()) {
            // Create new user
            const newUser: User = {
                name: user.displayName || 'User',
                email: email,
                image: user.photoURL || '',
                friends: [],
                playlists: [],
                likedSongs: [],
                favoriteArtists: [],
                history: [],
                chats: {}
            };
            
            await setDoc(doc(db, "users", uid), cleanData({
                ...newUser,
                settings: { volume: 1 }
            }));
            
            return newUser;
        } else {
            const userData = userDoc.data();
            
            // Get Chats from RTDB
            const chatsRef = ref(rtdb, `chats/${sanitizedEmail}`);
            const chatsSnap = await getRtdb(chatsRef);
            const rtdbChats = chatsSnap.exists() ? chatsSnap.val() : {};

            const formattedChats: Record<string, ChatMessage[]> = {};
            Object.keys(rtdbChats).forEach(key => {
                if (rtdbChats[key]) {
                    formattedChats[key] = Object.values(rtdbChats[key]);
                }
            });
            
            return {
                email: userData.email,
                name: userData.name,
                image: userData.image || user.photoURL || '',
                friends: userData.friends || [],
                playlists: userData.playlists || [],
                likedSongs: userData.likedSongs || [],
                history: userData.history || [],
                favoriteArtists: userData.favoriteArtists || [],
                chats: formattedChats,
                currentActivity: { status: 'online', timestamp: Date.now(), song: null }
            };
        }
    } catch (error: any) {
        throw new Error(error.message || 'Google Login failed');
    }
  },

  // --- PLAYLIST SHARING ---

  savePublicPlaylist: async (playlist: UserPlaylist) => {
    try {
      await setDoc(doc(db, "global_playlists", playlist.id), cleanData(playlist));
    } catch (e) {
      console.error("Failed to save public playlist", e);
    }
  },

  getPublicPlaylist: async (playlistId: string): Promise<UserPlaylist | null> => {
    try {
      const docRef = doc(db, "global_playlists", playlistId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserPlaylist;
      }
      return null;
    } catch (e) {
      console.error("Failed to fetch public playlist", e);
      return null;
    }
  },

  // --- REALTIME LISTENERS ---

  // Listen to User Data (Merged Firestore Profile + RTDB Chats)
  subscribeToUserData: (callback: (data: any) => void) => {
    if (!auth.currentUser || !auth.currentUser.email) return () => {};
    
    const uid = auth.currentUser.uid;
    const email = auth.currentUser.email;
    const sanitizedEmail = sanitize(email);

    let firestoreData: any = null;
    let rtdbChatsData: any = null;

    const mergeAndCallback = () => {
        if (firestoreData) {
            const merged = { ...firestoreData };
            
            if (rtdbChatsData) {
                const formattedChats: Record<string, ChatMessage[]> = {};
                Object.keys(rtdbChatsData).forEach(key => {
                    if (rtdbChatsData[key]) {
                        formattedChats[key] = Object.values(rtdbChatsData[key]);
                    }
                });
                merged.chats = formattedChats;
            } else {
                merged.chats = {};
            }
            callback(merged);
        }
    };

    // 1. Listen to Firestore Profile
    const userRef = doc(db, "users", uid);
    const unsubFirestore = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        firestoreData = doc.data();
        mergeAndCallback();
      }
    });

    // 2. Listen to RTDB Chats
    const chatsRef = ref(rtdb, `chats/${sanitizedEmail}`);
    const onChatsValue = onValue(chatsRef, (snapshot) => {
        rtdbChatsData = snapshot.val();
        mergeAndCallback();
    });

    return () => {
        unsubFirestore();
        off(chatsRef, 'value', onChatsValue);
    };
  },

  // Listen to CONTACTS (RTDB Status)
  subscribeToFriendsActivity: (friendEmails: string[], callback: (friendsData: any[]) => void) => {
    if (!friendEmails || friendEmails.length === 0) {
      callback([]);
      return () => {};
    }

    const listeners: Function[] = [];
    const friendsStatusMap = new Map<string, any>();

    friendEmails.forEach(email => {
        const sEmail = sanitize(email);
        const statusRef = ref(rtdb, `status/${sEmail}`);
        
        const onStatusValue = onValue(statusRef, (snapshot) => {
            if (snapshot.exists()) {
                const val = snapshot.val();
                friendsStatusMap.set(email, {
                    email: email,
                    currentActivity: {
                        status: val.status,
                        timestamp: val.timestamp,
                        song: val.song
                    },
                    // We don't get name/image from RTDB status, relying on store to have that from profile or previous data
                });
            } else {
                // If no status, assume offline
                friendsStatusMap.set(email, {
                    email: email,
                    currentActivity: { status: 'offline', timestamp: 0 }
                });
            }
            callback(Array.from(friendsStatusMap.values()));
        });
        
        listeners.push(() => off(statusRef, 'value', onStatusValue));
    });

    return () => {
        listeners.forEach(unsub => unsub());
    };
  },

  // --- ACTIONS ---

  addContact: async (contactEmail: string) => {
    if (!auth.currentUser) throw new Error("Not authenticated");
    const myRef = doc(db, "users", auth.currentUser.uid);
    const myDoc = await getDoc(myRef);
    
    if (myDoc.exists()) {
      const data = myDoc.data();
      const currentFriends = data.friends || [];
      if (!currentFriends.includes(contactEmail)) {
        await updateDoc(myRef, {
          friends: [...currentFriends, contactEmail]
        });
      }
    }
  },

  sendChatMessage: async (senderEmail: string, receiverEmail: string, message: ChatMessage) => {
    if (!auth.currentUser) return;
    
    const sEmail = sanitize(senderEmail);
    const rEmail = sanitize(receiverEmail);
    const msgData = cleanData(message);

    // Write to RTDB for both users
    const senderChatRef = ref(rtdb, `chats/${sEmail}/${rEmail}`);
    const receiverChatRef = ref(rtdb, `chats/${rEmail}/${sEmail}`);

    await push(senderChatRef, msgData);
    await push(receiverChatRef, msgData);

    // Update friend lists in Firestore if not already friends
    // 1. My Friend List
    const myRef = doc(db, "users", auth.currentUser.uid);
    const myDoc = await getDoc(myRef);
    if (myDoc.exists()) {
        const myFriends = myDoc.data().friends || [];
        if (!myFriends.includes(receiverEmail)) {
            await updateDoc(myRef, { friends: [...myFriends, receiverEmail] });
        }
    }

    // 2. Their Friend List
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", receiverEmail));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const friendDoc = querySnapshot.docs[0];
        const friendFriends = friendDoc.data().friends || [];
        if (!friendFriends.includes(senderEmail)) {
            await updateDoc(friendDoc.ref, { friends: [...friendFriends, senderEmail] });
        }
    }
  },

  updateUserStatus: async (status: 'online' | 'offline' | 'listening', song?: any) => {
     if (!auth.currentUser || !auth.currentUser.email) return;
     
     const sEmail = sanitize(auth.currentUser.email);
     const statusRef = ref(rtdb, `status/${sEmail}`);
     
     const activity = cleanData({
         status,
         timestamp: serverTimestamp(),
         song: song || null
     });

     await set(statusRef, activity);
     
     if (status !== 'offline') {
         onDisconnect(statusRef).set({
             status: 'offline',
             timestamp: serverTimestamp(),
             song: null
         });
     }
  },

  syncPublicProfile: async (user: User) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    const updates: any = {
      name: user.name,
      image: user.image,
      friends: user.friends,
      playlists: user.playlists 
    };
    await updateDoc(userRef, cleanData(updates));
  },

  syncPrivateData: async (user: User, additionalData: any) => {
     if (!auth.currentUser) return;
     const userRef = doc(db, "users", auth.currentUser.uid);
     await updateDoc(userRef, cleanData({
         playlists: user.playlists, 
         likedSongs: additionalData.likedSongs,
         history: additionalData.history,
         favoriteArtists: additionalData.favoriteArtists
     }));
  },

  searchUsers: async (queryText: string) => {
      const usersRef = collection(db, "users");
      const q = query(usersRef); 
      const querySnapshot = await getDocs(q);
      const results: any[] = [];
      const lowerQ = queryText.toLowerCase();

      querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (
              (data.name && data.name.toLowerCase().includes(lowerQ)) || 
              (data.email && data.email.toLowerCase().includes(lowerQ))
          ) {
              results.push({
                  name: data.name,
                  email: data.email,
                  image: data.image
              });
          }
      });
      return results.slice(0, 10);
  },

  logout: async () => {
      if (auth.currentUser && auth.currentUser.email) {
           const sEmail = sanitize(auth.currentUser.email);
           const statusRef = ref(rtdb, `status/${sEmail}`);
           await set(statusRef, { 
               status: 'offline', 
               timestamp: serverTimestamp() 
           });
      }
      await signOut(auth);
  }
};
