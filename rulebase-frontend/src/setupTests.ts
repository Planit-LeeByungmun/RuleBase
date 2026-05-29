import '@testing-library/jest-dom/vitest';

// Node 22+ ships a broken built-in localStorage (no getItem/setItem).
// Override it with a simple in-memory implementation for tests.
const storage = new Map<string, string>();
const localStorageShim: Storage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value); },
  removeItem: (key: string) => { storage.delete(key); },
  clear: () => { storage.clear(); },
  get length() { return storage.size; },
  key: (index: number) => [...storage.keys()][index] ?? null,
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageShim, writable: true });
