import { useEffect, useState } from 'react';

/** State persisted in this browser's localStorage. Falls back to memory when storage is unavailable. */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage blocked (private mode etc.): keep in memory only
    }
  }, [key, value]);
  return [value, setValue] as const;
}
