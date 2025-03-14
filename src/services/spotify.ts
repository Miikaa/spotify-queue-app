import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { SpotifyTrack } from '@/types/spotify';

class SpotifyAPI {
  private api: SpotifyApi | null = null;

  private getApi(accessToken: string): SpotifyApi {
    const token = {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: accessToken // Using the same token as refresh token since we handle refresh elsewhere
    };
    
    if (!this.api || !this.api.getAccessToken()) {
      this.api = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID!, token);
    }
    return this.api;
  }

  async getCurrentPlayback(accessToken: string): Promise<SpotifyTrack | null> {
    try {
      const api = this.getApi(accessToken);
      const playback = await api.player.getCurrentlyPlayingTrack();
      if (!playback?.item || playback.item.type !== 'track') {
        return null;
      }
      return playback.item as SpotifyTrack;
    } catch (error) {
      console.error('Error getting current playback:', error);
      throw error;
    }
  }

  async getQueue(accessToken: string): Promise<SpotifyTrack[]> {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/queue', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch queue');
      }
      
      const data = await response.json();
      return data.queue || [];
    } catch (error) {
      console.error('Error getting queue:', error);
      throw error;
    }
  }

  async searchTracks(accessToken: string, query: string): Promise<SpotifyTrack[]> {
    try {
      const api = this.getApi(accessToken);
      const results = await api.search(query, ['track'], undefined, 10);
      return results.tracks.items;
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  async addToQueue(accessToken: string, uri: string): Promise<void> {
    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to add track to queue');
      }
      // 204 No Content response is expected and OK
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }

  async skipTrack(accessToken: string): Promise<void> {
    try {
      const api = this.getApi(accessToken);
      const state = await api.player.getPlaybackState();
      if (state?.device?.id) {
        await api.player.skipToNext(state.device.id);
      }
    } catch (error) {
      console.error('Error skipping track:', error);
      throw error;
    }
  }

  async clearQueue(accessToken: string): Promise<void> {
    try {
      const queue = await this.getQueue(accessToken);
      
      // If queue is empty, nothing to clear
      if (!queue.length) {
        return;
      }

      const api = this.getApi(accessToken);
      const state = await api.player.getPlaybackState();
      
      // If no active device, can't clear queue
      if (!state?.device?.id) {
        throw new Error('No active Spotify device found');
      }
      
      for (let i = 0; i < queue.length; i++) {
        try {
          await api.player.skipToNext(state.device.id);
          // Add a small delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (skipError) {
          console.error('Error skipping track:', skipError);
          // Continue with next track even if one fails
          continue;
        }
      }
    } catch (error) {
      console.error('Error clearing queue:', error);
      throw error;
    }
  }
}

export const spotifyApi = new SpotifyAPI(); 