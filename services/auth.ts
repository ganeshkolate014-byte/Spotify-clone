import { User, FriendRequest, Song } from '../types';

const CLOUD_NAME = 'dj5hhott5';
const UPLOAD_PRESET = 'My smallest server';
const GLOBAL_INDEX_ID = 'vibestream_users_index';

// Simple Hashing
export const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateUserFilename = (email: string) => {
  return `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
};

// Helper to save any JSON to Cloudinary
const uploadJson = async (data: any, publicId: string) => {
    // For raw files, explicitly include the extension in the public_id
    const fullPublicId = publicId.endsWith('.json') ? publicId : `${publicId}.json`;
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const file = new File([blob], fullPublicId, { type: 'application/json' });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('public_id', fullPublicId);
    
    // Removing 'overwrite' and 'resource_type' from body to reduce Bad Request risk on unsigned presets
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("Cloudinary Error:", errBody);
        throw new Error(`Upload failed: ${errBody.error?.message || res.statusText}`);
    }
};

// Helper to fetch any JSON
const fetchJson = async (publicId: string) => {
    // Ensure we fetch the .json version
    const resourceName = publicId.endsWith('.json') ? publicId : `${publicId}.json`;
    const url = `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${resourceName}`;
    
    const res = await fetch(url + `?t=${Date.now()}`); // Bust cache
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Fetch failed');
    return await res.json();
};

export const authService = {
  // 1. Sign Up (with Global Index update)
  signup: async (name: string, email: string, password: string): Promise<User> => {
    // Check if user exists first by trying to fetch their file
    const existing = await fetchJson(generateUserFilename(email));
    if (existing) throw new Error('User already exists.');

    const passwordHash = await hashPassword(password);
    
    const user: User = {
      name,
      email,
      passwordHash,
      playlists: [],
      friends: [],
      friendRequests: [],
      currentActivity: { song: null, timestamp: Date.now(), status: 'online' }
    };

    // Upload User File
    await uploadJson(user, generateUserFilename(email));

    // Update Global Index (for Search)
    // Note: In production, this is a race condition. For this demo, it's acceptable.
    try {
        let index = await fetchJson(GLOBAL_INDEX_ID) || [];
        if (!Array.isArray(index)) index = [];
        index.push({ name, email, image: '' });
        await uploadJson(index, GLOBAL_INDEX_ID);
    } catch (e) {
        console.warn("Failed to update global index", e);
    }

    return user;
  },

  // 2. Login
  login: async (email: string, password: string): Promise<User> => {
    const userData: User = await fetchJson(generateUserFilename(email));
    if (!userData) throw new Error('User not found.');

    const inputHash = await hashPassword(password);
    if (userData.passwordHash !== inputHash) throw new Error('Invalid password.');

    return userData;
  },

  // 3. Sync User (General Update)
  syncUser: async (user: User): Promise<void> => {
    await uploadJson(user, generateUserFilename(user.email));
    
    // Also update index image if changed
    if (user.image) {
         try {
            let index = await fetchJson(GLOBAL_INDEX_ID) || [];
            const idx = index.findIndex((u: any) => u.email === user.email);
            if (idx !== -1) {
                index[idx].image = user.image;
                index[idx].name = user.name;
                await uploadJson(index, GLOBAL_INDEX_ID);
            }
        } catch (e) { console.warn("Index update failed", e); }
    }
  },

  // 4. Search Users
  searchUsers: async (query: string): Promise<{ name: string, email: string, image?: string }[]> => {
      const index = await fetchJson(GLOBAL_INDEX_ID);
      if (!index || !Array.isArray(index)) return [];
      
      const lowerQ = query.toLowerCase();
      return index.filter((u: any) => u.name.toLowerCase().includes(lowerQ));
  },

  // 5. Send Friend Request
  sendFriendRequest: async (toEmail: string, fromUser: User) => {
      const targetUser: User = await fetchJson(generateUserFilename(toEmail));
      if (!targetUser) throw new Error("User not found");

      // Check if already friends or requested
      if (targetUser.friends.includes(fromUser.email)) throw new Error("Already friends");
      if (targetUser.friendRequests.some(r => r.fromEmail === fromUser.email)) throw new Error("Request already sent");

      const req: FriendRequest = {
          fromEmail: fromUser.email,
          fromName: fromUser.name,
          fromImage: fromUser.image,
          timestamp: Date.now()
      };

      targetUser.friendRequests.push(req);
      await uploadJson(targetUser, generateUserFilename(toEmail));
  },

  // 6. Accept Friend Request
  acceptFriendRequest: async (requestFromEmail: string, currentUser: User) => {
      // 1. Update Current User
      // Remove request, add to friends
      const newReqs = currentUser.friendRequests.filter(r => r.fromEmail !== requestFromEmail);
      if (!currentUser.friends.includes(requestFromEmail)) {
          currentUser.friends.push(requestFromEmail);
      }
      currentUser.friendRequests = newReqs;
      await uploadJson(currentUser, generateUserFilename(currentUser.email));

      // 2. Update the Sender User
      try {
          const sender: User = await fetchJson(generateUserFilename(requestFromEmail));
          if (sender && !sender.friends.includes(currentUser.email)) {
              sender.friends.push(currentUser.email);
              await uploadJson(sender, generateUserFilename(requestFromEmail));
          }
      } catch (e) {
          console.error("Failed to update sender friend list", e);
      }
      
      return currentUser;
  },

  // 7. Get Friends' Data (for Activity Feed)
  getFriendsActivity: async (friendEmails: string[]) => {
      const promises = friendEmails.map(email => fetchJson(generateUserFilename(email)));
      const users = await Promise.all(promises);
      return users.filter(u => u !== null) as User[];
  }
};