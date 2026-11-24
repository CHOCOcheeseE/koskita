import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { container, onSessionExpired } from '@/data/container';
import type { User } from '@/domain/auth/auth';

import { queryKeys } from '../shared/query-keys';

type SessionStatus = 'loading' | 'signed-in' | 'signed-out';

type SessionContextValue = {
  status: SessionStatus;
  /** `true` setelah sesi kedaluwarsa paksa; layar Masuk menampilkan bilah info. */
  expiredNotice: boolean;
  signedIn: (user: User) => void;
  signOut: () => Promise<void>;
  dismissNotice: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [expiredNotice, setExpiredNotice] = useState(false);

  useEffect(() => {
    let mounted = true;
    container.auth
      .hasSession()
      .then((has) => mounted && setStatus(has ? 'signed-in' : 'signed-out'))
      .catch(() => mounted && setStatus('signed-out'));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(
    () =>
      onSessionExpired(() => {
        queryClient.clear();
        setExpiredNotice(true);
        setStatus('signed-out');
      }),
    [queryClient],
  );

  const signedIn = useCallback(
    (user: User) => {
      queryClient.clear();
      queryClient.setQueryData(queryKeys.me, user);
      setExpiredNotice(false);
      setStatus('signed-in');
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    await container.auth.logout();
    queryClient.clear();
    setStatus('signed-out');
  }, [queryClient]);

  const value = useMemo(
    () => ({ status, expiredNotice, signedIn, signOut, dismissNotice: () => setExpiredNotice(false) }),
    [status, expiredNotice, signedIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession dipakai di luar SessionProvider');
  return ctx;
}
