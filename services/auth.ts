import { User, FriendRequest, ChatMessage } from '../types';

// GitHub Configuration
// Note: Storing tokens in client-side code is not recommended for production.
// This is implemented as per specific requirements for this build.
const GITHUB_TOKEN = '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';
const GITHUB_OWNER = 'ganeshkolate014-byte';
const GITHUB_REPO = 'Spotify-json-database';
const BRANCH = 'main';

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

// --- GITHUB API HELPERS ---

const getFileUrl = (filename: string) => 
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filename}.json`;

// Base64 helpers for UTF-8 content to ensure emojis/special chars work
const toBase64 = (str: string) => {
    return btoa(unescape(encodeURIComponent(str)));
};

const fromBase64 = (str: string) => {
    return decodeURIComponent(escape(window.atob(str)));
};

const fetchJson = async (filename: string) => {
    try {
        const url = getFileUrl(filename);
        // Add cache busting and ref params
        const response = await fetch(`${url}?ref=${BRANCH}&t=${Date.now()}`, {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) return null;
        
        if (!response.ok) {
            console.error(`GitHub Fetch Error ${response.status}`);
            throw new Error(`GitHub API Error: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.content) return null;

        const content = fromBase64(data.content);
        return JSON.parse(content);
    } catch (error) {
        console.error("Error fetching from GitHub:", error);
        throw error;
    }
};

const uploadJson = async (data: any, filename: string) => {
    try {
        const url = getFileUrl(filename);
        
        // 1. Get existing SHA (if file exists) to allow updates
        let sha: string | undefined;
        try {
            const getRes = await fetch(`${url}?ref=${BRANCH}`, {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (getRes.ok) {
                const getData = await getRes.json();
                sha = getData.sha;
            }
        } catch (e) {
            // Ignore error, assumes file doesn't exist yet
        }

        // 2. Prepare Payload
        const jsonString = JSON.stringify(data, null, 2);
        const contentBase64 = toBase64(jsonString);

        const body: any = {
            message: `Update ${filename}`,
            content: contentBase64,
            branch: BRANCH
        };
        if (sha) body.sha = sha;

        // 3. PUT request
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub Upload Error: ${errorData.message}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error uploading to GitHub:", error);
        throw error;
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
        throw new Error("Could not connect to user database. Please check your connection and try again.");
    }
    
    // If null, start empty array
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
        console.warn("Could not fetch private data");
    }

    if (!userData) {
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
    let globalUsers;
    try {
        globalUsers = await fetchJson(GLOBAL_USERS_FILE);
    } catch (e) {
        console.error("Sync skip: Cannot read global DB");
        return; 
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
        // Self-repair
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
