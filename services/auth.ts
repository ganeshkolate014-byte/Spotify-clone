import { User, FriendRequest, ChatMessage } from '../types';
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
  onSnapshot,
  arrayUnion
} from 'firebase/firestore';

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
        friendRequests: [],
        playlists: [],
      };

      await setDoc(doc(db, "users", uid), {
        ...newUser,
        likedSongs: [],
        history: [],
        chats: {},
        settings: { volume: 1 },
        currentActivity: { status: 'online', timestamp: Date.now() }
      });

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
        friendRequests: userData.friendRequests || [],
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

  // --- REALTIME LISTENERS ---

  // Listen to MY user document (Friend Requests, My Chats, My Playlists)
  subscribeToUserData: (callback: (data: any) => void) => {
    if (!auth.currentUser) return () => {};
    
    const userRef = doc(db, "users", auth.currentUser.uid);
    // onSnapshot fires immediately with current data, and then on every change
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      }
    });
  },

  // Listen to FRIENDS (Online Status, What they are playing)
  subscribeToFriendsActivity: (friendEmails: string[], callback: (friendsData: any[]) => void) => {
    if (!friendEmails || friendEmails.length === 0) {
      callback([]);
      return () => {};
    }

    // Note: Firestore 'in' query supports max 10 values. 
    // For production, you'd batch this or structure data differently.
    const usersRef = collection(db, "users");
    const safeEmails = friendEmails.slice(0, 10); 
    
    const q = query(usersRef, where("email", "in", safeEmails));
    
    return onSnapshot(q, (snapshot) => {
      const friendsData = snapshot.docs.map(d => d.data());
      callback(friendsData);
    });
  },

  // --- ACTIONS ---

  // Send Message (Realtime: Updates both sender and receiver docs)
  sendChatMessage: async (senderEmail: string, receiverEmail: string, message: ChatMessage) => {
    if (!auth.currentUser) return;
    
    // 1. Update Sender (Myself)
    const myRef = doc(db, "users", auth.currentUser.uid);
    // We use dot notation to update a specific key in the map map.key
    // Note: Firestore map keys cannot contain '.' so emails usually work, but careful with special chars.
    // Ideally, we'd use a subcollection, but sticking to existing structure:
    
    // We need to read first to append, or use arrayUnion if the structure allows.
    // Since 'chats' is a Map<Email, Array<Message>>, we can't easily use arrayUnion on a specific map key 
    // without knowing the current state or using a custom object structure.
    
    // OPTIMIZED: We will fetch, append, write. 
    // (For high scale, use subcollections 'users/{id}/chats/{friendId}/messages')
    
    try {
        // Update My Chat History
        const myDoc = await getDoc(myRef);
        if (myDoc.exists()) {
            const myData = myDoc.data();
            const myChats = myData.chats || {};
            const chatWithReceiver = myChats[receiverEmail] || [];
            
            await updateDoc(myRef, {
                [`chats.${receiverEmail}`]: [...chatWithReceiver, message]
            });
        }

        // Update Friend's Chat History
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", receiverEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const friendDoc = querySnapshot.docs[0];
            const friendData = friendDoc.data();
            const friendChats = friendData.chats || {};
            const chatWithSender = friendChats[senderEmail] || [];

            await updateDoc(friendDoc.ref, {
                [`chats.${senderEmail}`]: [...chatWithSender, message]
            });
        }
    } catch (e) {
        console.error("Failed to send message", e);
        throw e;
    }
  },

  updateUserStatus: async (status: 'online' | 'offline' | 'listening', song?: any) => {
     if (!auth.currentUser) return;
     const userRef = doc(db, "users", auth.currentUser.uid);
     
     const activity = {
         status,
         timestamp: Date.now(),
         song: song || null
     };

     await updateDoc(userRef, {
         currentActivity: activity
     });
  },

  // Existing helpers...
  syncPublicProfile: async (user: User, chats?: Record<string, ChatMessage[]>) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    const updates: any = {
      name: user.name,
      image: user.image,
      friends: user.friends,
      friendRequests: user.friendRequests,
      playlists: user.playlists 
    };
    if (chats) updates.chats = chats;
    await updateDoc(userRef, updates);
  },

  syncPrivateData: async (user: User, additionalData: any) => {
     if (!auth.currentUser) return;
     const userRef = doc(db, "users", auth.currentUser.uid);
     await updateDoc(userRef, {
         playlists: user.playlists, 
         likedSongs: additionalData.likedSongs,
         history: additionalData.history
     });
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

  sendFriendRequest: async (toEmail: string, fromUser: User) => {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", toEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) throw new Error("User not found");

      const targetDoc = querySnapshot.docs[0];
      const targetData = targetDoc.data();
      const currentRequests: FriendRequest[] = targetData.friendRequests || [];
      const currentFriends: string[] = targetData.friends || [];

      if (currentFriends.includes(fromUser.email)) throw new Error("Already friends");
      if (currentRequests.find((r) => r.fromEmail === fromUser.email)) throw new Error("Request already sent");

      const newRequest: FriendRequest = {
          fromEmail: fromUser.email,
          fromName: fromUser.name || 'Unknown',
          fromImage: fromUser.image || '',
          timestamp: Date.now()
      };

      await updateDoc(targetDoc.ref, {
          friendRequests: [...currentRequests, newRequest]
      });
  },

  acceptFriendRequest: async (requestFromEmail: string, currentUser: User) => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      const myRef = doc(db, "users", auth.currentUser.uid);
      
      // Update Sender
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", requestFromEmail));
      const senderSnapshot = await getDocs(q);
      
      if (!senderSnapshot.empty) {
          const senderDoc = senderSnapshot.docs[0];
          const senderData = senderDoc.data();
          const senderFriends = senderData.friends || [];
          if (!senderFriends.includes(currentUser.email)) {
             await updateDoc(senderDoc.ref, { friends: [...senderFriends, currentUser.email] });
          }
      }

      // Update Me
      const myDoc = await getDoc(myRef);
      if (myDoc.exists()) {
          const data = myDoc.data();
          const currentRequests = data.friendRequests || [];
          const currentFriends = data.friends || [];
          const newRequests = currentRequests.filter((r: any) => r.fromEmail !== requestFromEmail);
          const newFriends = [...currentFriends];
          if (!newFriends.includes(requestFromEmail)) newFriends.push(requestFromEmail);

          await updateDoc(myRef, {
              friendRequests: newRequests,
              friends: newFriends
          });
          return { ...currentUser, friendRequests: newRequests, friends: newFriends };
      }
      return currentUser;
  },

  getFriendsActivity: async (friendEmails: string[]) => {
      // This is now mostly replaced by subscribeToFriendsActivity, 
      // but kept for initial load or fallback
      if (!friendEmails || friendEmails.length === 0) return [];
      const usersRef = collection(db, "users");
      const safeEmails = [...new Set(friendEmails.filter(e => e))].slice(0, 10);
      if (safeEmails.length === 0) return [];
      
      const q = query(usersRef, where("email", "in", safeEmails));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => d.data());
  },

  logout: async () => {
      if (auth.currentUser) {
          // Set offline
           const userRef = doc(db, "users", auth.currentUser.uid);
           await updateDoc(userRef, { "currentActivity.status": "offline" }).catch(console.error);
      }
      await signOut(auth);
  }
};