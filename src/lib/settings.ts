"use client";

export const SETTINGS_KEY = "authpilothealth_api_keys";

export interface ApiKeys {
  anthropic: string;
}

const EMPTY: ApiKeys = { anthropic: "" };

export function loadKeys(): ApiKeys {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<ApiKeys>;
    return { ...EMPTY, ...parsed };
  } catch {
    return { ...EMPTY };
  }
}

export function saveKeys(keys: ApiKeys) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(keys));
}

export function clearKeys() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SETTINGS_KEY);
}

export function getAnthropicKey(): string {
  return loadKeys().anthropic.trim();
}
