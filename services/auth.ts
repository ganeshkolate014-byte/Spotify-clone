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
  arrayUnion,
  arrayRemove
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
        // Private data fields initialized
      };

      // Create user document in Firestore
      await setDoc(doc(db, "users", uid), {
        ...newUser,
        likedSongs: [],
        history: [],
        chats: {},
        settings: { volume: 1 }
      });

      return {
        ...newUser,
        // @ts-ignore - appending these locally for the store
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

  // 3. SYNC PUBLIC PROFILE
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

    if (chats) {
      updates.chats = chats;
    }

    if (user.currentActivity) {
      updates.currentActivity = user.currentActivity;
    }

    await updateDoc(userRef, updates);
  },

  // 4. SYNC PRIVATE DATA
  syncPrivateData: async (user: User, additionalData: any) => {
     if (!auth.currentUser) return;
     const userRef = doc(db, "users", auth.currentUser.uid);
     
     await updateDoc(userRef, {
         playlists: user.playlists, 
         likedSongs: additionalData.likedSongs,
         history: additionalData.history
     });
  },

  // 5. SEARCH USERS
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

  // 6. SEND REQUEST (UPDATED)
  sendFriendRequest: async (toEmail: string, fromUser: User) => {
      // 1. Find target user by email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", toEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
          throw new Error("User not found");
      }

      const targetDoc = querySnapshot.docs[0];
      const targetData = targetDoc.data();

      // Normalize arrays from DB or default to empty
      const currentRequests: FriendRequest[] = targetData.friendRequests || [];
      const currentFriends: string[] = targetData.friends || [];

      // Check if already friends
      if (currentFriends.includes(fromUser.email)) {
          throw new Error("Already friends");
      }

      // Check if request already sent
      const existingReq = currentRequests.find((r) => r.fromEmail === fromUser.email);
      if (existingReq) {
          throw new Error("Request already sent");
      }

      // Create proper request object - Explicitly handle potential undefined values to satisfy Firestore
      const newRequest: FriendRequest = {
          fromEmail: fromUser.email,
          fromName: fromUser.name || 'Unknown',
          fromImage: fromUser.image || '',
          timestamp: Date.now()
      };

      // Use updateDoc with the new array (safer than arrayUnion for objects)
      await updateDoc(targetDoc.ref, {
          friendRequests: [...currentRequests, newRequest]
      });
  },

  // 7. ACCEPT REQUEST (UPDATED)
  acceptFriendRequest: async (requestFromEmail: string, currentUser: User) => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      
      const myRef = doc(db, "users", auth.currentUser.uid);
      
      // 1. Find Sender to update their friend list
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", requestFromEmail));
      const senderSnapshot = await getDocs(q);
      
      if (!senderSnapshot.empty) {
          const senderDoc = senderSnapshot.docs[0];
          const senderData = senderDoc.data();
          const senderFriends = senderData.friends || [];

          if (!senderFriends.includes(currentUser.email)) {
             await updateDoc(senderDoc.ref, {
                  friends: [...senderFriends, currentUser.email]
             });
          }
      }

      // 2. Update My Doc (Remove request, Add friend)
      const myDoc = await getDoc(myRef);
      if (myDoc.exists()) {
          const data = myDoc.data();
          const currentRequests = data.friendRequests || [];
          const currentFriends = data.friends || [];

          const newRequests = currentRequests.filter((r: any) => r.fromEmail !== requestFromEmail);
          
          const newFriends = [...currentFriends];
          if (!newFriends.includes(requestFromEmail)) {
              newFriends.push(requestFromEmail);
          }

          await updateDoc(myRef, {
              friendRequests: newRequests,
              friends: newFriends
          });

          return {
              ...currentUser,
              friendRequests: newRequests,
              friends: newFriends
          };
      }

      return currentUser;
  },

  // 8. GET FRIENDS STATUS
  getFriendsActivity: async (friendEmails: string[]) => {
      if (!friendEmails || friendEmails.length === 0) return [];
      
      const usersRef = collection(db, "users");
      // Safety check: ensure no empty strings or duplicates
      const safeEmails = [...new Set(friendEmails.filter(e => e))];
      
      if (safeEmails.length === 0) return [];

      if (safeEmails.length <= 10) {
          const q = query(usersRef, where("email", "in", safeEmails));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(d => d.data());
      } else {
          // Fallback: Fetch chunks or query all
          const subset = safeEmails.slice(0, 10);
          const q = query(usersRef, where("email", "in", subset));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(d => d.data());
      }
  },

  logout: async () => {
      await signOut(auth);
  }
};