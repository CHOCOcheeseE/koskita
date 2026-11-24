import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type StoredTokens = { accessToken: string; refreshToken: string };

export interface TokenStorage {
  get(): Promise<StoredTokens | null>;
  save(tokens: StoredTokens): Promise<void>;
  clear(): Promise<void>;
}

const ACCESS_KEY = 'koskita.accessToken';
const REFRESH_KEY = 'koskita.refreshToken';

/** Token disimpan di expo-secure-store (terenkripsi di perangkat), tidak pernah di AsyncStorage. */
export class SecureTokenStorage implements TokenStorage {
  async get(): Promise<StoredTokens | null> {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  }

  async save(tokens: StoredTokens): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
  }

  async clear(): Promise<void> {
    await Promise.all([SecureStore.deleteItemAsync(ACCESS_KEY), SecureStore.deleteItemAsync(REFRESH_KEY)]);
  }
}

/** Penyimpanan di memori, hanya untuk pratinjau web (secure-store tidak ada di browser). */
export class MemoryTokenStorage implements TokenStorage {
  private tokens: StoredTokens | null = null;
  async get() {
    return this.tokens;
  }
  async save(tokens: StoredTokens) {
    this.tokens = tokens;
  }
  async clear() {
    this.tokens = null;
  }
}

export function createTokenStorage(): TokenStorage {
  return Platform.OS === 'web' ? new MemoryTokenStorage() : new SecureTokenStorage();
}
