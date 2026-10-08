'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onOnlineStatusChange, isOnline } from '@/lib/offline-db';
import { useAuth } from './useAuth';

interface OfflineSyncContextType {
  online: boolean;
  lastSync: string | null;
  syncing: boolean;
  syncError: string | null;
  triggerSync: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      if (!mounted) return;
      const status = await isOnline();
      setOnline(status);
    }

    checkStatus();

    const cleanup = onOnlineStatusChange(async (status) => {
      if (!mounted) return;
      setOnline(status);
      if (status && user) {
        await triggerSyncInternal();
      }
    });

    return () => {
      mounted = false;
      cleanup();
    };
  }, [user]);

  const triggerSyncInternal = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLastSync(new Date().toISOString());
    } catch (e: any) {
      setSyncError(e.message || 'فشلت عملية المزامنة');
    } finally {
      setSyncing(false);
    }
  }, [user]);

  const triggerSync = useCallback(async () => {
    await triggerSyncInternal();
  }, [triggerSyncInternal]);

  return (
    <OfflineSyncContext.Provider
      value={{ online, lastSync, syncing, syncError, triggerSync }}
    >
      {children}
      <OfflineStatusBar online={online} syncing={syncing} lastSync={lastSync} />
    </OfflineSyncContext.Provider>
  );
}

function OfflineStatusBar({ online, syncing, lastSync }: { online: boolean; syncing: boolean; lastSync: string | null }) {
  if (online && !syncing) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium ${
      !online ? 'bg-amber-500 text-white' : 'bg-primary-500 text-white'
    }`}>
      {!online ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          لا يوجد اتصال بالإنترنت - تعرض آخر البيانات المحفوظة
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          جاري تحديث البيانات...
        </span>
      )}
    </div>
  );
}

export function useOfflineSync() {
  const context = useContext(OfflineSyncContext);
  if (context === undefined) {
    throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
  }
  return context;
}
