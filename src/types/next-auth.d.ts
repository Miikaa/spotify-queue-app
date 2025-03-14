import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      accessToken: string;
      refreshToken: string;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    accessToken: string;
    refreshToken: string;
  }
}

interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists: {
    name: string;
  }[];
  album: {
    name: string;
    images: {
      url: string;
      width: number;
      height: number;
    }[];
  };
} 