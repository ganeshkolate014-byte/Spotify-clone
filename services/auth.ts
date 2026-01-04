import { User, ChatMessage, UserPlaylist } from '../types';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
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

// Helper to remove undefined values which Firestore hates
const cleanData = (obj: any) => {
  return JSON.parse(JSON.stringify(obj));
};

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
      };

      await setDoc(doc(db, "users", uid), cleanData({
        ...newUser,
        likedSongs: [],
        history: [],
        chats: {},
        settings: { volume: 1 },
        currentActivity: { status: 'online', timestamp: Date.now() }
      }));

      return {
        ...newUser,
        // @ts-ignore 
        likedSongs: [],
        history: [],
        chats: {}
      };

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('User already exists.');
      }
      throw new Error(error.message || 'Signup failed');
    }
  },

  // 2. LOGIN
  login: async (email: string, password: string): Promise<User & { chats?: any, likedSongs?: any[], history?: any[] }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Set status to online immediately
      await updateDoc(doc(db, "users", uid), {
        "currentActivity.status": "online",
        "currentActivity.timestamp": Date.now()
      });

      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("User data not found");
      }

      const userData = userDoc.data();

      return {
        email: userData.email,
        name: userData.name,
        image: userData.image,
        friends: userData.friends || [],
        playlists: userData.playlists || [],
        likedSongs: userData.likedSongs || [],
        history: userData.history || [],
        chats: userData.chats || {},
        currentActivity: userData.currentActivity
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

  // --- PLAYLIST SHARING ---

  savePublicPlaylist: async (playlist: UserPlaylist) => {
    try {
      // Save to a global 'playlists' collection so it can be fetched by ID by anyone
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

  // Listen to MY user document
  subscribeToUserData: (callback: (data: any) => void) => {
    if (!auth.currentUser) return () => {};
    
    const userRef = doc(db, "users", auth.currentUser.uid);
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      }
    });
  },

  // Listen to CONTACTS (Online Status, Song)
  subscribeToFriendsActivity: (friendEmails: string[], callback: (friendsData: any[]) => void) => {
    if (!friendEmails || friendEmails.length === 0) {
      callback([]);
      return () => {};
    }

    // Firestore 'in' query supports max 10. 
    // We slice to 10 for safety in this demo.
    const usersRef = collection(db, "users");
    const safeEmails = friendEmails.slice(0, 10); 
    
    const q = query(usersRef, where("email", "in", safeEmails));
    
    return onSnapshot(q, (snapshot) => {
      const friendsData = snapshot.docs.map(d => d.data());
      callback(friendsData);
    });
  },

  // --- ACTIONS ---

  // Add Contact (Directly adds to friend list)
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
    
    // 1. Update Me
    const myRef = doc(db, "users", auth.currentUser.uid);
    const safeMessage = cleanData(message);

    try {
        const myDoc = await getDoc(myRef);
        if (myDoc.exists()) {
            const myData = myDoc.data();
            const myChats = myData.chats || {};
            const chatWithReceiver = myChats[receiverEmail] || [];
            const myFriends = myData.friends || [];

            // Add receiver to my friends list if not there (Automatic contact addition)
            const updates: any = {
                 [`chats.${receiverEmail.replace(/\./g, '_dot_')}`]: [...chatWithReceiver, safeMessage]
            };
            
            if (!myFriends.includes(receiverEmail)) {
                updates.friends = [...myFriends, receiverEmail];
            }

            await updateDoc(myRef, updates).catch(async () => {
                 // Fallback for dot notation
                 myChats[receiverEmail] = [...chatWithReceiver, safeMessage];
                 const fallbackUpdates: any = { chats: myChats };
                 if (!myFriends.includes(receiverEmail)) {
                     fallbackUpdates.friends = [...myFriends, receiverEmail];
                 }
                 await updateDoc(myRef, fallbackUpdates);
            });
        }

        // 2. Update Friend (Receiver)
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", receiverEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const friendDoc = querySnapshot.docs[0];
            const friendData = friendDoc.data();
            const friendChats = friendData.chats || {};
            const friendFriends = friendData.friends || [];
            const chatWithSender = friendChats[senderEmail] || [];
            
            const updatedFriendChats = {
                ...friendChats,
                [senderEmail]: [...chatWithSender, safeMessage]
            };

            const friendUpdates: any = {
                chats: updatedFriendChats
            };

            // Add sender to receiver's friends list if not there (Reciprocal contact addition)
            if (!friendFriends.includes(senderEmail)) {
                friendUpdates.friends = [...friendFriends, senderEmail];
            }

            await updateDoc(friendDoc.ref, friendUpdates);
        }
    } catch (e) {
        console.error("Failed to send message", e);
        throw e;
    }
  },

  updateUserStatus: async (status: 'online' | 'offline' | 'listening', song?: any) => {
     if (!auth.currentUser) return;
     const userRef = doc(db, "users", auth.currentUser.uid);
     
     const activity = cleanData({
         status,
         timestamp: Date.now(),
         song: song || null
     });

     await updateDoc(userRef, {
         currentActivity: activity
     });
  },

  syncPublicProfile: async (user: User, chats?: Record<string, ChatMessage[]>) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    const updates: any = {
      name: user.name,
      image: user.image,
      friends: user.friends,
      playlists: user.playlists 
    };
    if (chats) updates.chats = chats;
    await updateDoc(userRef, cleanData(updates));
  },

  syncPrivateData: async (user: User, additionalData: any) => {
     if (!auth.currentUser) return;
     const userRef = doc(db, "users", auth.currentUser.uid);
     await updateDoc(userRef, cleanData({
         playlists: user.playlists, 
         likedSongs: additionalData.likedSongs,
         history: additionalData.history
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
      if (auth.currentUser) {
           const userRef = doc(db, "users", auth.currentUser.uid);
           await updateDoc(userRef, { "currentActivity.status": "offline" }).catch(console.error);
      }
      await signOut(auth);
  }
};