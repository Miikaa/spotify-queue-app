# Spotify Queue Manager

A modern web application built with Next.js that allows you to manage your Spotify queue with ease. Search for tracks, add them to your queue, and control playback all from one place.

## Features

- 🎵 View your current Spotify queue
- 🔍 Search for tracks
- ➕ Add tracks to queue
- ⏭️ Skip to next track
- 🔄 Real-time queue updates
- 🎨 Modern and responsive UI
- 🔒 Secure authentication with Spotify

## Prerequisites

- Node.js 18.x or later
- A Spotify account
- A Spotify Developer account with a registered application

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd spotify-queue-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

   To get your Spotify credentials:
   1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   2. Create a new application
   3. Add `http://localhost:3000/api/auth/callback/spotify` to the Redirect URIs
   4. Copy the Client ID and Client Secret to your `.env.local` file

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Click "Login with Spotify" to authenticate
2. Make sure you have an active Spotify playback session (playing music on any device)
3. Use the search tab to find tracks
4. Click "Add to Queue" to add tracks to your queue
5. Use the queue tab to view your current queue
6. Click "Skip" to skip to the next track

## Technologies Used

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
