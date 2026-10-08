'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/hooks/useAuth';
import { OfflineSyncProvider } from '@/hooks/useOfflineSync';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <OfflineSyncProvider>
          {children}
        </OfflineSyncProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
