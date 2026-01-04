export interface Image {
  quality: string;
  url: string;
}

export interface DownloadUrl {
  quality: string;
  url: string;
}

export interface ArtistMinimal {
  id: string;
  name: string;
  role: string;
  image: Image[];
}

export interface Song {
  id: string;
  name: string;
  type: 'song';
  album: {
    id: string;
    name: string;
    url: string;
  };
  year: string;
  duration: string;
  language: string;
  genre: string;
  image: Image[];
  artists: {
    primary: ArtistMinimal[];
    featured: ArtistMinimal[];
    all: ArtistMinimal[];
  };
  downloadUrl: DownloadUrl[];
}

export interface Album {
  id: string;
  name: string;
  type: 'album';
  description: string;
  year: string;
  language: string;
  image: Image[];
  artists: {
    primary: ArtistMinimal[];
  };
  songs?: Song[]; // For details view
}

export interface Playlist {
  id: string;
  title: string;
  subtitle: string;
  type: 'playlist';
  image: Image[];
}

export interface Artist {
  id: string;
  name: string;
  type: 'artist';
  image: Image[];
}

// User Created Playlist
export interface UserPlaylist extends Playlist {
  songs: Song[];
  isUserCreated: boolean;
  description?: string;
  createdAt: number;
  creator?: string; // email or id
}

export interface User {
  email: string;
  passwordHash: string; // Encrypted
  name: string; // Acts as Username
  image?: string; // Profile picture URL
  playlists: UserPlaylist[];
}

// --- SOCIAL FEATURES ---

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isSystem?: boolean; // For "Started a party" messages
}

export interface Friend {
  id: string;
  name: string;
  image: string;
  status: 'online' | 'offline' | 'listening';
  currentSong?: Song | null; // What they are listening to
  lastActive: number;
  chatHistory: ChatMessage[];
}

export interface PartySession {
  isActive: boolean;
  hostId: string;
  hostName: string;
  listeners: string[]; // IDs of people listening
}

// Unified type for grid display
export type SearchResult = Song | Album | Artist | Playlist | UserPlaylist;