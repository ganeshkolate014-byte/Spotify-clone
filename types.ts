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

// Unified type for grid display
export type SearchResult = Song | Album | Artist | Playlist;