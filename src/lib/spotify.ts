import { SpotifyApi, AccessToken } from '@spotify/web-api-ts-sdk';

export function getSpotifyApi(accessToken: string, refreshToken: string) {
  const token: AccessToken = {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken
  };

  return SpotifyApi.withAccessToken(
    process.env.SPOTIFY_CLIENT_ID!,
    token
  );
} 