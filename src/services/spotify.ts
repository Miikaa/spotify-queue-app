import type { SpotifyTrack } from '@/types/spotify';

class SpotifyAPI {
  private baseUrl = 'https://api.spotify.com/v1';

  private async fetchWithToken(endpoint: string, accessToken: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'An unknown error occurred' } }));
      throw new Error(error.error?.message || 'Failed to fetch from Spotify API');
    }

    return response.json();
  }

  async getCurrentPlayback(accessToken: string): Promise<SpotifyTrack | null> {
    try {
      const data = await this.fetchWithToken('/me/player', accessToken);
      return data?.item || null;
    } catch (error) {
      console.error('Error getting current playback:', error);
      throw error;
    }
  }

  async getQueue(accessToken: string): Promise<SpotifyTrack[]> {
    try {
      const data = await this.fetchWithToken('/me/player/queue', accessToken);
      return data?.queue || [];
    } catch (error) {
      console.error('Error getting queue:', error);
      throw error;
    }
  }

  async searchTracks(accessToken: string, query: string): Promise<SpotifyTrack[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        type: 'track',
        limit: '10'
      });
      
      const data = await this.fetchWithToken(`/search?${params}`, accessToken);
      return data.tracks.items;
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  async addToQueue(accessToken: string, uri: string): Promise<void> {
    try {
      await this.fetchWithToken('/me/player/queue', accessToken, {
        method: 'POST',
        body: JSON.stringify({ uri }),
      });
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }

  async skipTrack(accessToken: string): Promise<void> {
    try {
      await this.fetchWithToken('/me/player/next', accessToken, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error skipping track:', error);
      throw error;
    }
  }
}

export const spotifyApi = new SpotifyAPI(); 