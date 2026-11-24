import { createAuthUseCases } from '@/domain/auth/auth';
import { createHomeUseCases } from '@/domain/home/home';
import type { Clock } from '@/domain/shared/clock';
import { createSplitBillUseCases } from '@/domain/split-bill/split-bill';
import { createStudyUseCases } from '@/domain/study/study';
import { createWalletUseCases } from '@/domain/wallet/wallet';

import { ApiClient } from './api/client';
import { createTokenStorage } from './api/token-storage';
import { HttpAuthRepository } from './auth/http-auth-repository';
import { HttpHomeRepository } from './home/http-home-repository';
import { HttpSplitBillRepository } from './split-bill/http-split-bill-repository';
import { HttpStudyRepository } from './study/http-study-repository';
import { HttpWalletRepository } from './wallet/http-wallet-repository';

/** URL backend lokal, mis. http://10.0.2.2:3000 (emulator Android) atau http://<IP-LAN>:3000 (HP). */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const systemClock: Clock = { now: () => new Date() };

type SessionListener = () => void;
const sessionExpiredListeners = new Set<SessionListener>();

/** Didengar lapisan presentation untuk kembali ke layar Masuk. */
export function onSessionExpired(listener: SessionListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

const api = new ApiClient({
  baseUrl: API_BASE_URL,
  tokens: createTokenStorage(),
  onSessionExpired: () => sessionExpiredListeners.forEach((l) => l()),
});

export const clock = systemClock;

export const container = {
  auth: createAuthUseCases(new HttpAuthRepository(api)),
  home: createHomeUseCases(new HttpHomeRepository(api)),
  wallet: createWalletUseCases(new HttpWalletRepository(api), systemClock),
  splitBill: createSplitBillUseCases(new HttpSplitBillRepository(api)),
  study: createStudyUseCases(new HttpStudyRepository(api)),
};

export type Container = typeof container;
