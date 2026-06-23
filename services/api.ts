import type { AppData } from "@/context/DataContext";

const DEFAULT_API_BASE_URL = "http://localhost:3000/api";

function getApiCandidates(): string[] {
  if (typeof window === "undefined") {
    return [DEFAULT_API_BASE_URL];
  }

  const origin = window.location.origin;
  const host = window.location.hostname;
  return [
    `${origin}/api`,
    `http://${host}:3000/api`,
    DEFAULT_API_BASE_URL,
    "http://127.0.0.1:3000/api",
  ];
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  const candidates = getApiCandidates();

  let lastError: unknown;
  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { "content-type": "application/json" },
        ...init,
      });

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    console.warn("API request failed, falling back to local persistence", lastError);
  }

  return null;
}

export async function apiLogin(username: string, password: string): Promise<boolean> {
  const payload = await requestJson<{ ok?: boolean }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  return payload?.ok === true;
}

export async function apiLogout(): Promise<void> {
  await requestJson<void>("/auth/logout", { method: "POST" });
}

export async function apiGetSession(): Promise<boolean> {
  const payload = await requestJson<{ active?: boolean }>("/auth/session");
  return payload?.active === true;
}

export async function apiLoadData(): Promise<AppData | null> {
  return requestJson<AppData>("/data");
}

export async function apiSaveData(data: AppData): Promise<boolean> {
  const payload = await requestJson<{ ok?: boolean }>("/data", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return payload?.ok === true;
}
