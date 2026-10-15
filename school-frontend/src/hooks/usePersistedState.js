import { useState, useEffect } from 'react';

// Drop-in replacement for useState whose value survives an accidental page
// refresh (sessionStorage: gone when the tab closes, unlike localStorage).
// Call clearDraft(key) after a successful submit or an explicit Cancel so a
// stale draft doesn't reappear the next time the form opens.
export function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = sessionStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // sessionStorage unavailable (private browsing, quota) — draft safety
      // is a nice-to-have, never worth breaking the form over.
    }
  }, [key, value]);

  return [value, setValue];
}

export function hasDraft(key) {
  try {
    return sessionStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

export function clearDraft(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
