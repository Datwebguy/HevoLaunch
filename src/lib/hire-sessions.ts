"use client";

import { useSyncExternalStore } from "react";

import type { HireSession } from "@/lib/types";

/**
 * Client-only session store, keyed to this browser's Altana hiring wallet
 * (see lib/altana.ts — one passkey wallet per browser). There's no backend
 * yet, so sessions live in localStorage — enough to demo the full
 * Hire -> Fund -> Status loop end to end. Swapping this for a real index
 * (reading jobs by `client` address straight from the ERC-8183 kernel via
 * `getErc8183Job`) is a self-contained change; nothing outside this file
 * needs to know the storage is local.
 */

const STORAGE_KEY = "hevolaunch:hire-sessions";
const CHANGE_EVENT = "hevolaunch:hire-sessions-changed";
const EMPTY: HireSession[] = [];

// useSyncExternalStore requires a referentially stable snapshot when the
// underlying data hasn't changed, or React re-renders forever. Cache the
// parsed result and only recompute when the raw localStorage string
// actually changes.
let cachedRaw: string | null = null;
let cachedAll: HireSession[] = EMPTY;

function getAll(): HireSession[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedAll = raw ? (JSON.parse(raw) as HireSession[]) : EMPTY;
    } catch {
      cachedAll = EMPTY;
    }
  }
  return cachedAll;
}

function writeAll(sessions: HireSession[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function saveSession(session: HireSession) {
  const all = [...getAll()];
  const idx = all.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    all[idx] = session;
  } else {
    all.unshift(session);
  }
  writeAll(all);
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getServerSnapshot(): HireSession[] {
  return EMPTY;
}

/** Every hire session created from this browser, newest first. */
export function useHireSessions(): HireSession[] {
  return useSyncExternalStore(subscribe, getAll, getServerSnapshot);
}
