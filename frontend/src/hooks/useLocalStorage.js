import { useState, useEffect } from "react";

/**
 * useState that persists to localStorage.
 * @template T
 * @param {string} key
 * @param {T} initialValue
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>]}
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota exceeded — silent fail
    }
  }, [key, value]);

  return [value, setValue];
}
