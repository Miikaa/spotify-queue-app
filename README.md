# Spotify Queue App

A real-time collaborative queue app for Spotify, built with Next.js, Prisma, and Supabase.

## Features

- Host a room and let guests add songs to your Spotify queue
- Real-time queue updates
- Search and add tracks from Spotify's library
- Guest mode - no login required for guests

## Deployment Guide

### 1. Prerequisites

- A Spotify Developer account
- A Vercel account
- A Supabase account

### 2. Set Up Supabase Database

1. Create a new project in [Supabase](https://supabase.com)
2. Once created, go to Project Settings > Database to find your database connection string
3. Copy the connection string and save it for later

### 3. Set Up Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Add your production domain (and localhost for development) to the Redirect URIs:
   - `http://localhost:3000/api/auth/callback/spotify`
   - `https://your-domain.com/api/auth/callback/spotify`
4. Save your Client ID and Client Secret

### 4. Deploy to Vercel

1. Fork this repository
2. Go to [Vercel](https://vercel.com) and create a new project from your fork
3. During the import, add the following environment variables:
   ```
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=generate_a_random_string
   DATABASE_URL=your_supabase_connection_string
   ```
4. Deploy!

### 5. Database Migration

After the first deployment, you need to run the database migrations:

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Link your local project:
   ```bash
   vercel link
   ```

3. Pull environment variables:
   ```bash
   vercel env pull .env
   ```

4. Run the migration:
   ```bash
   npx prisma db push
   ```

### 6. Final Steps

1. Test the application by creating a room and joining as a guest
2. Verify that Spotify authentication works
3. Check that real-time updates are working

## Development

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in the values
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `SPOTIFY_CLIENT_ID`: Your Spotify application client ID
- `SPOTIFY_CLIENT_SECRET`: Your Spotify application client secret
- `NEXTAUTH_URL`: Your application URL (http://localhost:3000 for development)
- `NEXTAUTH_SECRET`: A random string for session encryption
- `DATABASE_URL`: Your Supabase PostgreSQL connection string
- `SENTRY_DSN` (optional): Sentry error tracking DSN

## Tech Stack

- [Next.js 15](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [TailwindCSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (PostgreSQL Database)
- [Vercel](https://vercel.com/) (Hosting)

## License

MIT
