import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

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

const handler = NextAuth({
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
  },
  debug: true,
  callbacks: {
    async jwt({ token, account }) {
      console.log('JWT Callback - Token:', token);
      console.log('JWT Callback - Account:', account);

      if (account && account.access_token) {
        // Initial sign in
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at;
        console.log('JWT Callback - Setting initial token:', token);
        return token;
      }

      // Return previous token if the access token has not expired
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires * 1000) {
        console.log('JWT Callback - Using existing token:', token);
        return token;
      }

      // Access token has expired, try to refresh it
      console.log('JWT Callback - Token expired, refreshing...');
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

        if (!response.ok) throw tokens;

        console.log('JWT Callback - Refreshed token:', tokens);
        return {
          ...token,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? token.refreshToken,
          accessTokenExpires: Math.floor(Date.now() / 1000 + tokens.expires_in),
        };
      } catch (error) {
        console.error('Error refreshing access token', error);
        return {
          ...token,
          error: 'RefreshAccessTokenError',
        };
      }
    },

    async session({ session, token }) {
      console.log('Session Callback - Input Session:', session);
      console.log('Session Callback - Input Token:', token);
      
      if (!token?.accessToken) {
        console.error('No access token in token');
        throw new Error('No access token available');
      }

      return {
        ...session,
        accessToken: token.accessToken,
        error: token.error,
        expires: token.accessTokenExpires ? token.accessTokenExpires * 1000 : 0,
        user: {
          ...session.user,
          name: token.name ?? null,
          email: token.email ?? null,
          image: token.picture ?? null,
        },
      };
    },
  },
});

export { handler as GET, handler as POST }; 