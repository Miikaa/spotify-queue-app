import { NextAuthOptions, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import SpotifyProvider from 'next-auth/providers/spotify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Please provide NEXTAUTH_SECRET environment variable');
}

const scopes = [
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
].join(' ');

interface ExtendedToken extends JWT {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  error?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID ?? '',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? '',
      authorization: {
        url: 'https://accounts.spotify.com/authorize',
        params: { scope: scopes }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !user) return false;
      return true;
    },
    async jwt({ token, account, user }): Promise<ExtendedToken> {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          accessToken: account.access_token!,
          refreshToken: account.refresh_token!,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
        };
      }

      // Return previous token if the access token has not expired
      const tokenWithExp = token as ExtendedToken;
      if (tokenWithExp.accessTokenExpires && Date.now() < tokenWithExp.accessTokenExpires) {
        return tokenWithExp;
      }

      // Access token has expired, refresh it
      try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: (token as ExtendedToken).refreshToken,
          }),
        });

        const tokens = await response.json();

        if (!response.ok) throw tokens;

        return {
          ...token,
          accessToken: tokens.access_token,
          accessTokenExpires: Date.now() + tokens.expires_in * 1000,
        } as ExtendedToken;
      } catch (error) {
        console.error('Error refreshing access token', error);
        return {
          ...token,
          error: 'RefreshAccessTokenError',
        } as ExtendedToken;
      }
    },
    async session({ session, token }) {
      if (session.user && token) {
        const extendedToken = token as ExtendedToken;
        session.user.id = extendedToken.id;
        session.user.name = extendedToken.name;
        session.user.email = extendedToken.email;
        session.user.image = extendedToken.image;
        session.user.accessToken = extendedToken.accessToken;
        session.user.refreshToken = extendedToken.refreshToken;
        (session as any).error = extendedToken.error;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // After successful sign in, redirect to dashboard
      if (url.startsWith('/api/auth/callback')) {
        return `${baseUrl}/dashboard`;
      }
      // Default to homepage
      return baseUrl;
    }
  },
  debug: process.env.NODE_ENV === 'development',
}; 