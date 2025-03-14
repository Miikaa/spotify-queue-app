import type { Track } from '@spotify/web-api-ts-sdk';

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  uri: string;
  images: SpotifyImage[];
}

export type SpotifyTrack = Track;

export interface PlaybackState {
  track: SpotifyTrack;
  progress_ms: number;
  is_playing: boolean;
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface SpotifyError {
  status: number;
  message: string;
}

export interface SpotifySession {
  accessToken: string;
  error?: 'RefreshAccessTokenError';
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires_at?: number;
  token_type?: string;
  refresh_token?: string;
} 