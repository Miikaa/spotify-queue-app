import SpotifyProvider from "next-auth/providers/spotify";
import type { NextAuthOptions } from "next-auth";

const scopes = [
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "app-remote-control",
  "streaming",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-read-playback-position",
  "user-top-read",
  "user-read-recently-played",
  "playlist-modify-private",
  "playlist-modify-public"
];

// Add a buffer time to refresh the token before it expires (5 minutes)
const REFRESH_TOKEN_BUFFER = 5 * 60; // seconds

// Let's keep the existing token handling but add better error handling and refresh tracking
export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: scopes.join(" "),
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // Reduce maxAge to 7 days for better security
    maxAge: 7 * 24 * 60 * 60,
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, account }) {
      // Add refresh tracking to the token
      if (!token.refreshCount) token.refreshCount = 0;
      if (!token.refreshErrorCount) token.refreshErrorCount = 0;

      if (account && account.access_token) {
        // Initial sign in
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at,
          refreshCount: 0,
          refreshErrorCount: 0,
        };
      }

      // Return previous token if the access token has not expired (with buffer time)
      if (token.accessTokenExpires && 
          Date.now() < (token.accessTokenExpires as number * 1000) - (REFRESH_TOKEN_BUFFER * 1000)) {
        return token;
      }

      // Access token has expired or will expire soon, try to refresh it
      try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(
              `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
            ).toString('base64')}`,
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken as string,
          }),
        });

        const tokens = await response.json();

        if (!response.ok) {
          console.error('Token refresh failed:', tokens);
          throw new Error(tokens.error_description || 'Failed to refresh token');
        }

        console.log('Token refreshed successfully');

        return {
          ...token,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? token.refreshToken,
          accessTokenExpires: Math.floor(Date.now() / 1000 + tokens.expires_in),
          refreshCount: (token.refreshCount as number) + 1,
        };
      } catch (error) {
        console.error('Error refreshing access token', error);
        return {
          ...token,
          error: 'RefreshAccessTokenError',
          refreshErrorCount: (token.refreshErrorCount as number) + 1,
        };
      }
    },
    async session({ session, token }) {
      if (!token?.accessToken) {
        console.error('No access token in token');
        throw new Error('No access token available');
      }

      return {
        ...session,
        accessToken: token.accessToken,
        error: token.error,
        expires: token.accessTokenExpires ? token.accessTokenExpires * 1000 : 0,
        refreshCount: token.refreshCount,
        refreshErrorCount: token.refreshErrorCount,
        user: {
          ...session.user,
          name: token.name ?? null,
          email: token.email ?? null,
          image: token.picture ?? null,
        },
      };
    }
  }
}; 