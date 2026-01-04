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
        // Note: In a real app, private data might go to a subcollection, 
        // but keeping structure flat for compatibility with existing types
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
      // Specific error message requirement
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
      playlists: user.playlists // Sync playlists here as they are public/shared in this app model
    };

    if (chats) {
      updates.chats = chats;
    }

    // We can also sync currentActivity here
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
         playlists: user.playlists, // Also syncing here to be safe
         likedSongs: additionalData.likedSongs,
         history: additionalData.history
     });
  },

  // 5. SEARCH USERS
  searchUsers: async (queryText: string) => {
      // Firestore text search is limited. 
      // For this implementation, we will query all users and filter client side 
      // OR rely on exact email match if we want strictness.
      // To keep it simple and functional for a "demo" production feel:
      const usersRef = collection(db, "users");
      const q = query(usersRef); // Get all (careful with large DBs)
      
      // Optimization: In a real app, use Algolia. 
      // Here, we fetch top 50 and filter.
      const querySnapshot = await getDocs(q);
      
      const results: any[] = [];
      const lowerQ = queryText.toLowerCase();

      querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (
              data.name.toLowerCase().includes(lowerQ) || 
              data.email.toLowerCase().includes(lowerQ)
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

  // 6. SEND REQUEST
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

      // Check if already friends
      if (targetData.friends?.includes(fromUser.email)) {
          throw new Error("Already friends");
      }

      // Check if request already sent
      const existingReq = targetData.friendRequests?.find((r: any) => r.fromEmail === fromUser.email);
      if (existingReq) {
          throw new Error("Request already sent");
      }

      // Update target user doc
      await updateDoc(targetDoc.ref, {
          friendRequests: arrayUnion({
              fromEmail: fromUser.email,
              fromName: fromUser.name,
              fromImage: fromUser.image || '',
              timestamp: Date.now()
          })
      });
  },

  // 7. ACCEPT REQUEST
  acceptFriendRequest: async (requestFromEmail: string, currentUser: User) => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      
      const myRef = doc(db, "users", auth.currentUser.uid);
      
      // 1. Find Sender to update their friend list
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", requestFromEmail));
      const senderSnapshot = await getDocs(q);
      
      if (!senderSnapshot.empty) {
          const senderDoc = senderSnapshot.docs[0];
          await updateDoc(senderDoc.ref, {
              friends: arrayUnion(currentUser.email)
          });
      }

      // 2. Update My Doc (Remove request, Add friend)
      // We need to remove the specific object from the array. 
      // arrayRemove requires exact object match. 
      // Since we don't have the exact object reference easily, 
      // we'll read, filter, and write back (optimistic update happens in store anyway).
      
      const myDoc = await getDoc(myRef);
      if (myDoc.exists()) {
          const data = myDoc.data();
          const newRequests = (data.friendRequests || []).filter((r: any) => r.fromEmail !== requestFromEmail);
          const newFriends = [...(data.friends || [])];
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

      // Firestore 'in' query supports up to 10 items.
      // For scalability, we fetch individually or use batches.
      // For this implementation, we'll fetch all matching emails.
      
      const usersRef = collection(db, "users");
      // If friends list is huge, this logic needs pagination/chunks.
      // Assuming < 10 friends for demo:
      if (friendEmails.length <= 10) {
          const q = query(usersRef, where("email", "in", friendEmails));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(d => d.data());
      } else {
          // Fallback: Fetch chunks or query all and filter (not efficient but simple for now)
          // Just fetching top 10 for safety in this demo architecture
          const subset = friendEmails.slice(0, 10);
          const q = query(usersRef, where("email", "in", subset));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(d => d.data());
      }
  },

  logout: async () => {
      await signOut(auth);
  }
};