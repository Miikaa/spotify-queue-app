import 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string;
    expires: number;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    sub?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
    expiresAt?: number;
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