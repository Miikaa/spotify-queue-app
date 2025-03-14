import { SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import type { PlaybackState } from '@/types/spotify';

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

  async getCurrentPlayback(accessToken: string): Promise<PlaybackState | null> {
    try {
      const api = this.getApi(accessToken);
      const playback = await api.player.getCurrentlyPlayingTrack();
      
      // Check if the item is a track (not an episode)
      if (playback?.item?.type === 'track') {
        return {
          track: playback.item as Track,
          progress_ms: playback.progress_ms || 0,
          is_playing: playback.is_playing || false,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting current playback:', error);
      throw error;
    }
  }

  async getQueue(accessToken: string): Promise<Track[]> {
    try {
      // First get the current context to check if we're in a playlist/album
      const api = this.getApi(accessToken);
      const playbackState = await api.player.getPlaybackState();
      const isInContext = playbackState?.context?.type === 'playlist' || playbackState?.context?.type === 'album';

      // Use fetch directly to ensure fresh data
      const response = await fetch('https://api.spotify.com/v1/me/player/queue', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get queue: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { queue: Array<Track & { type: string }> };
      
      // Debug log to see the structure
      console.log('Queue response:', JSON.stringify(data, null, 2));
      console.log('Current context:', playbackState?.context);

      const queue = data.queue || [];
      
      // If we're in a playlist/album context, only show manually added tracks (which appear at the start)
      // If we're not in a context, show all tracks as they're likely all manually added
      const queueTracks = isInContext ? queue.slice(0, 3) : queue;
      
      return queueTracks.filter((item) => item.type === 'track') as Track[];
    } catch (error) {
      console.error('Error getting queue:', error);
      throw error;
    }
  }

  async searchTracks(accessToken: string, query: string): Promise<Track[]> {
    try {
      const api = this.getApi(accessToken);
      const results = await api.search(query, ['track']);
      return results.tracks.items;
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  async addToQueue(accessToken: string, uri: string): Promise<void> {
    try {
      const api = this.getApi(accessToken);
      const devices = await api.player.getPlaybackState();
      const deviceId = devices?.device?.id;

      // Use fetch directly instead of SDK to handle non-JSON response
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}${deviceId ? `&device_id=${deviceId}` : ''}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add to queue: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }

  async skipTrack(accessToken: string): Promise<void> {
    try {
      const api = this.getApi(accessToken);
      const devices = await api.player.getPlaybackState();
      const deviceId = devices?.device?.id;

      // Use fetch directly instead of SDK to handle non-JSON response
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/next${deviceId ? `?device_id=${deviceId}` : ''}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to skip track: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error skipping track:', error);
      throw error;
    }
  }

  async clearQueue(accessToken: string): Promise<void> {
    try {
      const api = this.getApi(accessToken);
      const devices = await api.player.getPlaybackState();
      const deviceId = devices?.device?.id;
      
      // Keep skipping until queue is empty
      while (true) {
        const queue = await api.player.getUsersQueue();
        if (!queue.queue.length) {
          break;
        }

        // Skip current track
        const response = await fetch(
          `https://api.spotify.com/v1/me/player/next${deviceId ? `?device_id=${deviceId}` : ''}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to skip track: ${response.status} ${response.statusText}`);
        }

        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error clearing queue:', error);
      throw error;
    }
  }
}

export const spotifyApi = new SpotifyAPI(); 