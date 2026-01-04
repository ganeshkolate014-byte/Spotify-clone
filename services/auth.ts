import { User } from '../types';

const CLOUD_NAME = 'dj5hhott5';
const UPLOAD_PRESET = 'My smallest server';

// Simple Hashing using Web Crypto API
export const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Generate a filename based on email to simulate a primary key
const generateUserFilename = (email: string) => {
  return `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
};

export const authService = {
  // Sign Up: Uploads a JSON file to Cloudinary with user data
  signup: async (name: string, email: string, password: string): Promise<User> => {
    const passwordHash = await hashPassword(password);
    
    const user: User = {
      name,
      email,
      passwordHash,
      playlists: []
    };

    // Convert user object to a Blob (JSON file)
    const blob = new Blob([JSON.stringify(user)], { type: 'application/json' });
    const file = new File([blob], `${generateUserFilename(email)}.json`, { type: 'application/json' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('cloud_name', CLOUD_NAME);
    formData.append('public_id', generateUserFilename(email)); // Attempt to enforce ID
    formData.append('resource_type', 'raw'); // Important for JSON

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Signup failed. Email might be taken or server error.');
    }

    return user;
  },

  // Login: Tries to fetch the JSON file from Cloudinary URL pattern
  login: async (email: string, password: string): Promise<User> => {
    // Construct the URL where the file SHOULD be if the user exists
    // Note: In a real Cloudinary setup, 'raw' files are accessible via url.
    // We might need to handle versioning, but usually the latest is available at the public_id url.
    const publicId = generateUserFilename(email);
    // Cloudinary Raw URL structure
    const url = `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${publicId}.json`;

    try {
        const response = await fetch(url + `?t=${Date.now()}`); // Cache bust

        if (response.status === 404) {
            throw new Error('User not found.');
        }

        const userData: User = await response.json();
        const inputHash = await hashPassword(password);

        if (userData.passwordHash !== inputHash) {
            throw new Error('Invalid password.');
        }

        return userData;

    } catch (error) {
        console.error("Login Error", error);
        throw error;
    }
  },

  // Update User Data (Sync Playlists)
  syncUser: async (user: User): Promise<void> => {
    const blob = new Blob([JSON.stringify(user)], { type: 'application/json' });
    const file = new File([blob], `${generateUserFilename(user.email)}.json`, { type: 'application/json' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('cloud_name', CLOUD_NAME);
    formData.append('public_id', generateUserFilename(user.email));
    formData.append('resource_type', 'raw');
    formData.append('overwrite', 'true'); // Overwrite existing user file

    await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, {
      method: 'POST',
      body: formData,
    });
  }
};