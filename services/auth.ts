import { User, FriendRequest, ChatMessage } from '../types';

// Cloudinary Configuration
// We reuse the same cloud name and preset from your api.ts
const CLOUD_NAME = 'dj5hhott5';
const UPLOAD_PRESET = 'My smallest server';
const DB_FOLDER = 'vibestream_db';
const USERS_FILE = 'users_list'; // Will be stored as vibestream_db/users_list.json

// --- HELPERS ---

export const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateDataFilename = (email: string) => {
  // Sanitize email to be a valid filename
  return `data_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
};

// --- CLOUDINARY RAW JSON API ---

const getDbUrl = (filename: string) => 
    `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${DB_FOLDER}/${filename}.json`;

const fetchJson = async (filename: string) => {
    try {
        // Add timestamp to bypass strict Cloudinary caching
        const response = await fetch(`${getDbUrl(filename)}?t=${Date.now()}`, {
            cache: 'no-store'
        });
        
        if (response.status === 404) return null;
        if (!response.ok) throw new Error('Network error');
        
        return await response.json();
    } catch (error) {
        // If file doesn't exist yet (first run), return null gracefully
        return null;
    }
};

const uploadJson = async (data: any, filename: string) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`;
    
    const formData = new FormData();
    // Create a Blob from the JSON data
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    
    formData.append('file', blob, `${filename}.json`);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('public_id', `${DB_FOLDER}/${filename}`);
    formData.append('folder', DB_FOLDER);

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Cloudinary Error: ${err.error?.message || 'Unknown error'}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Database Save Failed:", error);
        throw error;
    }
};

// --- AUTH SERVICE ---

export const authService = {

  // 1. SIGN UP
  signup: async (name: string, email: string, password: string): Promise<User> => {
    // A. Fetch Global Users List
    let globalUsers = await fetchJson(USERS_FILE);
    
    if (!globalUsers) globalUsers = [];
    if (!Array.isArray(globalUsers)) throw new Error("Database corrupted.");

    // B. Check duplicates
    if (globalUsers.find((u: any) => u.email === email)) {
        throw new Error('User already exists.');
    }

    const passwordHash = await hashPassword(password);

    // C. Create Public Profile Object
    const newUserProfile = {
        name,
        email,
        passwordHash,
        image: '',
        friends: [],
        friendRequests: [],
        chats: {} 
    };

    // D. Create Private Data Object (Playlists, History, etc.)
    const newUserData = {
        playlists: [],
        likedSongs: [],
        history: [],
        settings: { volume: 1 }
    };

    // E. Save Everything
    globalUsers.push(newUserProfile);
    
    // Upload Global List
    await uploadJson(globalUsers, USERS_FILE);
    // Upload Private Data File
    await uploadJson(newUserData, generateDataFilename(email));

    // F. Return merged User object
    return {
        ...newUserProfile,
        playlists: newUserData.playlists,
        likedSongs: newUserData.likedSongs, 
        history: newUserData.history
    } as any;
  },

  // 2. LOGIN
  login: async (email: string, password: string): Promise<User & { chats?: any }> => {
    // A. Fetch Users
    const globalUsers = await fetchJson(USERS_FILE);
    if (!globalUsers || !Array.isArray(globalUsers)) {
        throw new Error('User database empty or not found. Please sign up.');
    }

    // B. Find User
    const userProfile = globalUsers.find((u: any) => u.email === email);
    if (!userProfile) throw new Error('User not found.');

    // C. Verify Password
    const inputHash = await hashPassword(password);
    if (userProfile.passwordHash !== inputHash) throw new Error('Invalid password.');

    // D. Fetch Private Data
    let userData = await fetchJson(generateDataFilename(email));

    if (!userData) {
        // Fallback if private data is missing
        userData = { playlists: [], likedSongs: [], history: [] };
    }

    // E. Return Merged Object
    return {
        ...userProfile,
        playlists: userData.playlists || [],
        likedSongs: userData.likedSongs || [],
        history: userData.history || [],
        chats: userProfile.chats || {}
    } as any;
  },

  // 3. SYNC PUBLIC PROFILE
  syncPublicProfile: async (user: User, chats?: Record<string, ChatMessage[]>) => {
    let globalUsers = await fetchJson(USERS_FILE);
    if (!globalUsers || !Array.isArray(globalUsers)) globalUsers = [];

    const idx = globalUsers.findIndex((u: any) => u.email === user.email);
    
    const profileData = {
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        image: user.image,
        friends: user.friends,
        friendRequests: user.friendRequests,
        chats: chats || (idx !== -1 ? globalUsers[idx].chats : {})
    };

    if (idx !== -1) {
        globalUsers[idx] = profileData;
    } else {
        globalUsers.push(profileData);
    }

    await uploadJson(globalUsers, USERS_FILE);
  },

  // 4. SYNC PRIVATE DATA
  syncPrivateData: async (user: User, additionalData: any) => {
     const dataPayload = {
         playlists: user.playlists,
         likedSongs: additionalData.likedSongs,
         history: additionalData.history
     };
     await uploadJson(dataPayload, generateDataFilename(user.email));
  },

  // 5. SEARCH USERS
  searchUsers: async (query: string) => {
      const globalUsers = await fetchJson(USERS_FILE);
      if (!globalUsers || !Array.isArray(globalUsers)) return [];
      
      const lowerQ = query.toLowerCase();
      return globalUsers
        .filter((u: any) => u.name.toLowerCase().includes(lowerQ))
        .map((u: any) => ({
            name: u.name,
            email: u.email,
            image: u.image
        }));
  },

  // 6. SEND REQUEST
  sendFriendRequest: async (toEmail: string, fromUser: User) => {
      const globalUsers = await fetchJson(USERS_FILE);
      if (!globalUsers || !Array.isArray(globalUsers)) return;

      const targetIdx = globalUsers.findIndex((u: any) => u.email === toEmail);
      if (targetIdx === -1) throw new Error("User not found");

      const targetUser = globalUsers[targetIdx];
      
      if (targetUser.friends && targetUser.friends.includes(fromUser.email)) throw new Error("Already friends");
      if (targetUser.friendRequests && targetUser.friendRequests.some((r: any) => r.fromEmail === fromUser.email)) throw new Error("Request already sent");

      if (!targetUser.friendRequests) targetUser.friendRequests = [];
      
      targetUser.friendRequests.push({
          fromEmail: fromUser.email,
          fromName: fromUser.name,
          fromImage: fromUser.image,
          timestamp: Date.now()
      });

      globalUsers[targetIdx] = targetUser;
      await uploadJson(globalUsers, USERS_FILE);
  },

  // 7. ACCEPT REQUEST
  acceptFriendRequest: async (requestFromEmail: string, currentUser: User) => {
      const globalUsers = await fetchJson(USERS_FILE);
      if (!globalUsers || !Array.isArray(globalUsers)) return currentUser;

      // Update Current User in Global DB
      const myIdx = globalUsers.findIndex((u: any) => u.email === currentUser.email);
      if (myIdx !== -1) {
          const me = globalUsers[myIdx];
          if (!me.friendRequests) me.friendRequests = [];
          if (!me.friends) me.friends = [];

          me.friendRequests = me.friendRequests.filter((r: any) => r.fromEmail !== requestFromEmail);
          if (!me.friends.includes(requestFromEmail)) me.friends.push(requestFromEmail);
          globalUsers[myIdx] = me;
      }

      // Update Sender in Global DB
      const senderIdx = globalUsers.findIndex((u: any) => u.email === requestFromEmail);
      if (senderIdx !== -1) {
          const sender = globalUsers[senderIdx];
          if (!sender.friends) sender.friends = [];
          if (!sender.friends.includes(currentUser.email)) sender.friends.push(currentUser.email);
          globalUsers[senderIdx] = sender;
      }

      await uploadJson(globalUsers, USERS_FILE);

      // Return updated local user object
      const updatedUser = { ...currentUser };
      updatedUser.friendRequests = updatedUser.friendRequests.filter(r => r.fromEmail !== requestFromEmail);
      if (!updatedUser.friends.includes(requestFromEmail)) updatedUser.friends.push(requestFromEmail);
      
      return updatedUser;
  },

  // 8. GET FRIENDS STATUS
  getFriendsActivity: async (friendEmails: string[]) => {
      const globalUsers = await fetchJson(USERS_FILE);
      if (!globalUsers || !Array.isArray(globalUsers)) return [];
      
      return globalUsers.filter((u: any) => friendEmails.includes(u.email));
  }
};