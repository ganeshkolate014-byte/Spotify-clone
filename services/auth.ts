import { User, FriendRequest, Song, UserPlaylist, ChatMessage } from '../types';

const CLOUD_NAME = 'dj5hhott5';
const UPLOAD_PRESET = 'My smallest server';

// The "Mega File" that holds all users, friends, and chats
const GLOBAL_USERS_FILE = 'vibestream_users'; 

// Simple Hashing
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

// --- API HELPERS ---

const uploadJson = async (data: any, publicId: string) => {
    // Cloudinary raw files often require the extension in the public_id to be accessible via that extension URL
    const fullPublicId = publicId.endsWith('.json') ? publicId : `${publicId}.json`;
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const file = new File([blob], fullPublicId, { type: 'application/json' });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('public_id', fullPublicId);
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
    }
    return await res.json();
};

const fetchJson = async (publicId: string) => {
    const resourceName = publicId.endsWith('.json') ? publicId : `${publicId}.json`;
    const url = `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${resourceName}`;
    
    // STRICT Cache busting to prevent overwriting data due to stale reads
    try {
        const res = await fetch(url + `?t=${Date.now()}&v=${Math.random()}`, {
            cache: 'no-store',
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
        
        // 404 means the file genuinely doesn't exist yet -> Return null to signal "Create New"
        if (res.status === 404) return null;
        
        // Any other error (500, CORS, etc) -> Throw Error to ABORT operations
        if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
        
        return await res.json();
    } catch (e) {
        // We re-throw here so the calling function knows IT IS NOT SAFE TO WRITE.
        // If we returned null here, the app would think the DB is empty and overwrite it.
        console.error("Critical DB Read Error:", e);
        throw e;
    }
};

// --- MAIN SERVICE ---

export const authService = {

  // 1. SIGN UP
  signup: async (name: string, email: string, password: string): Promise<User> => {
    let globalUsers;

    try {
        globalUsers = await fetchJson(GLOBAL_USERS_FILE);
    } catch (e) {
        // STOP! Do not proceed if we can't read the DB.
        throw new Error("Could not connect to user database. Please check your connection and try again.");
    }
    
    // Automatic banado: If missing (strictly 404 null), start empty array
    if (globalUsers === null) {
        globalUsers = [];
    } else if (!Array.isArray(globalUsers)) {
        throw new Error("Database corrupted.");
    }

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

    // D. Create Private Data Object
    const newUserData = {
        playlists: [],
        likedSongs: [],
        history: [],
        settings: { volume: 1 }
    };

    // E. Save Everything - Add to list
    globalUsers.push(newUserProfile);
    
    // Upload Global File First
    await uploadJson(globalUsers, GLOBAL_USERS_FILE);
    // Then Upload Private Data
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
    let globalUsers;
    try {
        globalUsers = await fetchJson(GLOBAL_USERS_FILE);
    } catch (e) {
        throw new Error("Connection error. Please try again.");
    }

    if (!Array.isArray(globalUsers)) throw new Error('User database empty or not found. Please sign up.');

    // B. Find User
    const userProfile = globalUsers.find((u: any) => u.email === email);
    if (!userProfile) throw new Error('User not found.');

    // C. Verify Password
    const inputHash = await hashPassword(password);
    if (userProfile.passwordHash !== inputHash) throw new Error('Invalid password.');

    // D. Fetch Private Data
    let userData = null;
    try {
        userData = await fetchJson(generateDataFilename(email));
    } catch (e) {
        // It's okay if private data fails, we can recover
        console.warn("Could not fetch private data");
    }

    if (!userData) {
        // Fallback/Auto-fix if data file is missing
        userData = { playlists: [], likedSongs: [], history: [] };
    }

    // E. Return Merged Object
    return {
        ...userProfile,
        playlists: userData.playlists || [],
        likedSongs: userData.likedSongs || [],
        history: userData.history || [],
        // Include chats so store can hydrate
        chats: userProfile.chats || {}
    } as any;
  },

  // 3. SYNC PUBLIC PROFILE
  syncPublicProfile: async (user: User, chats?: Record<string, ChatMessage[]>) => {
    let globalUsers;
    try {
        globalUsers = await fetchJson(GLOBAL_USERS_FILE);
    } catch (e) {
        console.error("Sync skip: Cannot read global DB");
        return; // Skip sync if we can't read, to avoid overwrite
    }

    if (!Array.isArray(globalUsers)) globalUsers = [];

    const idx = globalUsers.findIndex((u: any) => u.email === user.email);
    if (idx !== -1) {
        // Update existing
        globalUsers[idx].name = user.name;
        globalUsers[idx].image = user.image;
        globalUsers[idx].friends = user.friends;
        globalUsers[idx].friendRequests = user.friendRequests;
        if (chats) {
            globalUsers[idx].chats = chats;
        }
    } else {
        // Self-repair: add if missing (rare case)
        globalUsers.push({
            name: user.name,
            email: user.email,
            passwordHash: user.passwordHash,
            image: user.image,
            friends: user.friends,
            friendRequests: user.friendRequests,
            chats: chats || {}
        });
    }

    await uploadJson(globalUsers, GLOBAL_USERS_FILE);
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
      let globalUsers;
      try {
        globalUsers = await fetchJson(GLOBAL_USERS_FILE);
      } catch (e) { return []; }

      if (!Array.isArray(globalUsers)) return [];
      
      const lowerQ = query.toLowerCase();
      return globalUsers.filter((u: any) => u.name.toLowerCase().includes(lowerQ)).map((u: any) => ({
          name: u.name,
          email: u.email,
          image: u.image
      }));
  },

  // 6. SEND REQUEST
  sendFriendRequest: async (toEmail: string, fromUser: User) => {
      let globalUsers;
      try {
         globalUsers = await fetchJson(GLOBAL_USERS_FILE);
      } catch (e) { throw new Error("Connection failed"); }

      if (!Array.isArray(globalUsers)) return;

      const targetIdx = globalUsers.findIndex((u: any) => u.email === toEmail);
      if (targetIdx === -1) throw new Error("User not found");

      const targetUser = globalUsers[targetIdx];
      
      if (targetUser.friends.includes(fromUser.email)) throw new Error("Already friends");
      if (targetUser.friendRequests.some((r: any) => r.fromEmail === fromUser.email)) throw new Error("Request already sent");

      targetUser.friendRequests.push({
          fromEmail: fromUser.email,
          fromName: fromUser.name,
          fromImage: fromUser.image,
          timestamp: Date.now()
      });

      globalUsers[targetIdx] = targetUser;
      await uploadJson(globalUsers, GLOBAL_USERS_FILE);
  },

  // 7. ACCEPT REQUEST
  acceptFriendRequest: async (requestFromEmail: string, currentUser: User) => {
      let globalUsers;
      try {
        globalUsers = await fetchJson(GLOBAL_USERS_FILE);
      } catch (e) { throw new Error("Connection failed"); }

      if (!Array.isArray(globalUsers)) return currentUser;

      // Update Current User in Global DB
      const myIdx = globalUsers.findIndex((u: any) => u.email === currentUser.email);
      if (myIdx !== -1) {
          const me = globalUsers[myIdx];
          me.friendRequests = me.friendRequests.filter((r: any) => r.fromEmail !== requestFromEmail);
          if (!me.friends.includes(requestFromEmail)) me.friends.push(requestFromEmail);
          globalUsers[myIdx] = me;
      }

      // Update Sender in Global DB
      const senderIdx = globalUsers.findIndex((u: any) => u.email === requestFromEmail);
      if (senderIdx !== -1) {
          const sender = globalUsers[senderIdx];
          if (!sender.friends.includes(currentUser.email)) sender.friends.push(currentUser.email);
          globalUsers[senderIdx] = sender;
      }

      await uploadJson(globalUsers, GLOBAL_USERS_FILE);

      // Return updated local user object
      const updatedUser = { ...currentUser };
      updatedUser.friendRequests = updatedUser.friendRequests.filter(r => r.fromEmail !== requestFromEmail);
      if (!updatedUser.friends.includes(requestFromEmail)) updatedUser.friends.push(requestFromEmail);
      
      return updatedUser;
  },

  // 8. GET FRIENDS STATUS
  getFriendsActivity: async (friendEmails: string[]) => {
      let globalUsers;
      try {
        globalUsers = await fetchJson(GLOBAL_USERS_FILE);
      } catch (e) { return []; }

      if (!Array.isArray(globalUsers)) return [];
      
      return globalUsers.filter((u: any) => friendEmails.includes(u.email));
  }
};