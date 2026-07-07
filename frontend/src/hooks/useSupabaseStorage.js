/**
 * useSupabaseStorage — drop-in replacement for useLocalStorage.
 *
 * Same API: const [value, setValue] = useSupabaseStorage(key, initialValue)
 *
 * Strategy:
 *  - Reads from localStorage immediately (instant UI, no flicker).
 *  - On mount, fetches the latest value from Supabase and syncs both directions:
 *      • If Supabase has a newer record → adopt it.
 *      • If localStorage is ahead (offline edits) → push to Supabase.
 *  - Every setValue call writes localStorage first (optimistic), then upserts to Supabase.
 *  - Falls back to localStorage-only if Supabase is unavailable or the user is not signed in.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded — silent
  }
}

async function getUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export function useSupabaseStorage(key, initialValue) {
  const [value, setValueState] = useState(() => readLocal(key, initialValue));
  const pendingRef = useRef(false);
  const latestRef = useRef(value);

  // Keep latestRef in sync so the async upsert always sends the freshest value
  useEffect(() => {
    latestRef.current = value;
  }, [value]);

  // On mount: pull from Supabase and reconcile
  useEffect(() => {
    let cancelled = false;

    async function sync() {
      const userId = await getUserId();
      if (!userId || cancelled) return;

      const { data, error } = await supabase
        .from("workspace_data")
        .select("data")
        .eq("user_id", userId)
        .eq("key", key)
        .maybeSingle();

      if (cancelled || error) return;

      if (data) {
        // Supabase has a record — use it as the authoritative source
        setValueState(data.data);
        writeLocal(key, data.data);
      } else {
        // No record yet — push whatever is in localStorage
        const local = readLocal(key, initialValue);
        if (JSON.stringify(local) !== JSON.stringify(initialValue)) {
          await supabase.from("workspace_data").upsert(
            { user_id: userId, key, data: local },
            { onConflict: "user_id,key" }
          );
        }
      }
    }

    sync();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback((updater) => {
    setValueState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeLocal(key, next);

      // Fire-and-forget upsert — don't block the UI
      if (!pendingRef.current) {
        pendingRef.current = true;
        getUserId().then((userId) => {
          if (!userId) { pendingRef.current = false; return; }
          supabase
            .from("workspace_data")
            .upsert({ user_id: userId, key, data: next }, { onConflict: "user_id,key" })
            .then(() => { pendingRef.current = false; });
        });
      }

      return next;
    });
  }, [key]);

  return [value, setValue];
}
