"use client";

import { useMemo, useSyncExternalStore } from "react";

import { getStoredHiringWallet } from "@/lib/altana";
import type { HireSession } from "@/lib/types";

/**
 * Client session store with account scoping. Sessions live in localStorage
 * and are associated with both the passkey smart account (`hirerAddress`)
 * and any connected EOA wallet (`connectedAddress`).
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

export function deleteSession(id: string) {
  const all = getAll().filter((s) => s.id !== id);
  writeAll(all);
}

export function clearAllSessions() {
  writeAll([]);
}

export function clearFailedSessions(account?: string) {
  const normalized = account?.toLowerCase();
  const all = getAll().filter((s) => {
    // If account specified, only clear failed/unfunded for that account
    if (normalized) {
      const matchesAccount =
        s.connectedAddress?.toLowerCase() === normalized ||
        s.hirerAddress?.toLowerCase() === normalized ||
        s.task?.toLowerCase().includes(normalized);
      if (matchesAccount && (s.status === "FAILED" || s.status === "UNFUNDED")) {
        return false;
      }
      return true;
    }
    // Otherwise clear all failed/unfunded
    return s.status !== "FAILED" && s.status !== "UNFUNDED";
  });
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

/**
 * Hire sessions created from this browser, newest first.
 * If `account` is specified, filters by matching `connectedAddress`, `hirerAddress`,
 * or the linked Altana smart account.
 */
export function useHireSessions(account?: string): HireSession[] {
  const all = useSyncExternalStore(subscribe, getAll, getServerSnapshot);
  return useMemo(() => {
    if (!account) return all;
    const normalized = account.toLowerCase();
    const storedHiringWallet = getStoredHiringWallet(account)?.address?.toLowerCase();
    const defaultHiringWallet = getStoredHiringWallet()?.address?.toLowerCase();

    return all.filter((s) => {
      // Direct connectedAddress match
      if (s.connectedAddress?.toLowerCase() === normalized) return true;
      // Direct hirerAddress match
      if (s.hirerAddress?.toLowerCase() === normalized) return true;
      // Stored smart account for this EOA matches
      if (storedHiringWallet && s.hirerAddress?.toLowerCase() === storedHiringWallet) return true;
      // Task prompt explicitly contained this address
      if (s.task?.toLowerCase().includes(normalized)) return true;
      // Legacy unassigned session matching default hiring smart account
      if (!s.connectedAddress && defaultHiringWallet && s.hirerAddress?.toLowerCase() === defaultHiringWallet) {
        return true;
      }
      return false;
    });
  }, [all, account]);
}

/** All hire sessions across all accounts on this browser. */
export function useAllHireSessions(): HireSession[] {
  return useSyncExternalStore(subscribe, getAll, getServerSnapshot);
}
