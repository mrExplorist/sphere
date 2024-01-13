export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';

import '../styles/globals.css';
import db from '@/lib/supabase/db';
import { ThemeProvider } from '../lib/providers/next-theme-provider';

import { DM_Sans } from 'next/font/google';
import AppStateProvider from '@/lib/providers/state-provider';
import { SupabaseUserProvider } from '@/lib/providers/supabase-user-provider';
import { Toaster } from '@/components/ui/toaster';
import { SocketProvider } from '@/lib/socket-provider';

const inter = DM_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sphere - Collab and project management for developers',
  description: 'All-In-One Collaboration and Productivity Platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log(db);
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AppStateProvider>
            <SupabaseUserProvider>
              <SocketProvider>
                {children}
                <Toaster />
              </SocketProvider>
            </SupabaseUserProvider>
          </AppStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
