# Spotify Queue Manager

A web application that allows you to manage your Spotify queue with ease. Built with Next.js and Spotify Web API.

## Features

- View currently playing track
- View and manage queue
- Search and add tracks to queue
- Real-time queue updates
- Responsive design

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- A Spotify account
- Spotify Developer credentials

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd spotify-queue-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with your Spotify credentials:
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- [Next.js](https://nextjs.org/)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- NextAuth.js
- Spotify Web API

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
