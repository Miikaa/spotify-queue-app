import { SpotifyTrack } from '@/types/spotify';

const BASE_URL = 'https://api.spotify.com/v1';

export class SpotifyError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'SpotifyError';
  }
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new SpotifyError(response.status, errorText);
  }
  return response;
}

export const spotifyApi = {
  async getCurrentPlayback(accessToken: string) {
    const response = await fetch(`${BASE_URL}/me/player`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 204) {
      return null;
    }

    const data = await handleResponse(response).then(r => r.json());
    return data?.item as SpotifyTrack | null;
  },

  async getQueue(accessToken: string) {
    const response = await fetch(`${BASE_URL}/me/player/queue`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await handleResponse(response).then(r => r.json());
    return data.queue as SpotifyTrack[];
  },

  async searchTracks(accessToken: string, query: string) {
    const response = await fetch(
      `${BASE_URL}/search?q=${encodeURIComponent(query)}&type=track&limit=20&market=from_token`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await handleResponse(response).then(r => r.json());
    return data.tracks.items as SpotifyTrack[];
  },

  async addToQueue(accessToken: string, trackUri: string) {
    const response = await fetch(`${BASE_URL}/me/player/queue?uri=${trackUri}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    await handleResponse(response);
  },

  async skipTrack(accessToken: string) {
    const response = await fetch(`${BASE_URL}/me/player/next`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    await handleResponse(response);
  },
}; 