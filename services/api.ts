import { Song, Album, Artist, Playlist } from '../types';

const BASE_URL = 'https://musicapi-gray.vercel.app/api';

// Helper to safely get the high-quality image
export const getImageUrl = (images: { url: string }[]) => {
  if (!images || images.length === 0) return 'https://picsum.photos/500/500';
  // Always try to get index 2 (500x500), fallback to last available
  return images[2]?.url || images[images.length - 1]?.url;
};

// Helper to get high quality audio
export const getAudioUrl = (downloadUrls: { url: string }[]) => {
  if (!downloadUrls || downloadUrls.length === 0) return '';
  // The API usually returns [12kbps, 48kbps, 96kbps, 160kbps, 320kbps]
  // We want 320kbps (last) or 160kbps (second to last)
  const last = downloadUrls[downloadUrls.length - 1];
  const secondLast = downloadUrls[downloadUrls.length - 2];
  const thirdLast = downloadUrls[downloadUrls.length - 3];
  
  // Prefer the last one (highest quality), but ensure it exists
  return last?.url || secondLast?.url || thirdLast?.url || downloadUrls[0]?.url || '';
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