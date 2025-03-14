import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import SessionProvider from "@/components/SessionProvider";
import { authOptions } from "./api/auth/[...nextauth]/options";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spotify Queue Manager",
  description: "Manage your Spotify queue with ease",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <SessionProvider session={session}>
            {children}
          </SessionProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
