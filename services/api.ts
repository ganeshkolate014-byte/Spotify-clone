import { Song, Album, Artist, Playlist } from '../types';

const BASE_URL = 'https://musicapi-gray.vercel.app/api';

// --- OFFLINE STORAGE (IndexedDB) ---
const DB_NAME = 'vibestream_offline_db';
const STORE_NAME = 'songs';
const DB_VERSION = 1;

export const OfflineStorage = {
  openDB: (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME); // Key is song ID
        }
      };
    });
  },

  saveSong: async (id: string, blob: Blob): Promise<void> => {
    const db = await OfflineStorage.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(blob, id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  getSong: async (id: string): Promise<Blob | null> => {
    const db = await OfflineStorage.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  removeSong: async (id: string): Promise<void> => {
    const db = await OfflineStorage.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

// Helper to safely get the high-quality image
export const getImageUrl = (images: { url: string }[]) => {
  if (!images || images.length === 0) return 'https://picsum.photos/500/500';
  // Always try to get index 2 (500x500), fallback to last available
  return images[2]?.url || images[images.length - 1]?.url;
};

// Helper to get audio URL based on quality preference
export const getAudioUrl = (downloadUrls: { url: string, quality: string }[], preference: 'low' | 'normal' | 'high' = 'high') => {
  if (!downloadUrls || downloadUrls.length === 0) return '';
  
  // Sort from low to high quality based on bitrate number
  const sorted = [...downloadUrls].sort((a, b) => {
     const bitrateA = parseInt(a.quality.replace(/\D/g, '')) || 0;
     const bitrateB = parseInt(b.quality.replace(/\D/g, '')) || 0;
     return bitrateA - bitrateB;
  });

  if (sorted.length === 0) return '';

  if (preference === 'low') {
      // Return lowest quality (usually 12kbps or 48kbps)
      return sorted[0].url;
  } else if (preference === 'normal') {
      // Return middle quality (around 96kbps or 160kbps)
      const mid = Math.floor(sorted.length / 2);
      return sorted[mid].url;
  } else {
      // Return highest quality (320kbps)
      return sorted[sorted.length - 1].url;
  }
};

// Download Helper with Progress AND Offline Caching
export const downloadSongWithProgress = (songId: string, url: string, filename: string, onProgress: (percent: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';

        xhr.onload = async () => {
             if (xhr.status === 200) {
                 const blob = xhr.response;
                 
                 // 1. Save to Offline Storage
                 try {
                     await OfflineStorage.saveSong(songId, blob);
                 } catch (e) {
                     console.error("Failed to cache audio offline", e);
                 }

                 // 2. Trigger Browser Download (Optional: Keep user happy with a file)
                 const blobUrl = window.URL.createObjectURL(blob);
                 const link = document.createElement('a');
                 link.href = blobUrl;
                 link.download = filename;
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
                 window.URL.revokeObjectURL(blobUrl);
                 
                 resolve();
             } else {
                 reject(new Error(`Download failed with status ${xhr.status}`));
             }
        };

        xhr.onerror = () => reject(new Error('Network Error during download'));
        
        xhr.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                onProgress(percent);
            }
        };

        xhr.send();
    });
};

// Get Offline Blob URL
export const getOfflineAudioUrl = async (songId: string): Promise<string | null> => {
    try {
        const blob = await OfflineStorage.getSong(songId);
        if (blob) {
            return URL.createObjectURL(blob);
        }
        return null;
    } catch (e) {
        console.error("Error retrieving offline song", e);
        return null;
    }
};

export const downloadSong = async (song: Song) => {
    // This is the quick download fallback, redirecting to the robust one
    const url = getAudioUrl(song.downloadUrl, 'high');
    const filename = `${song.name} - ${song.artists.primary[0]?.name || 'Artist'}.mp3`;
    // We mock the progress for the simple call
    await downloadSongWithProgress(song.id, url, filename, () => {});
};

// Cloudinary Upload Helper
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = 'dj5hhott5'; 
  const uploadPreset = 'My smallest server';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('cloud_name', cloudName);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

async function fetchJson<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  const json = await response.json();
  return json;
}

export const api = {
  searchSongs: async (query: string): Promise<Song[]> => {
    try {
      const data = await fetchJson<{ data: { results: Song[] } }>(`/search/songs?query=${encodeURIComponent(query)}`);
      return data.data.results || [];
    } catch (e) {
      console.error("Search songs error", e);
      return [];
    }
  },

  searchAlbums: async (query: string): Promise<Album[]> => {
    try {
      const data = await fetchJson<{ data: { results: Album[] } }>(`/search/albums?query=${encodeURIComponent(query)}`);
      return data.data.results || [];
    } catch (e) {
      console.error("Search albums error", e);
      return [];
    }
  },

  searchArtists: async (query: string): Promise<Artist[]> => {
    try {
      const data = await fetchJson<{ data: { results: Artist[] } }>(`/search/artists?query=${encodeURIComponent(query)}`);
      return data.data.results || [];
    } catch (e) {
      console.error("Search artists error", e);
      return [];
    }
  },

  getAlbumDetails: async (id: string): Promise<Album | null> => {
    try {
      const data = await fetchJson<{ data: Album }>(`/albums?id=${id}`);
      return data.data || null;
    } catch (e) {
      console.error("Get album details error", e);
      return null;
    }
  }
};