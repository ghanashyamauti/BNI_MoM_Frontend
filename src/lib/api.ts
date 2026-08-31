import type { Meeting } from "./types";

const API_BASE = import.meta.env["VITE_API_URL"];

export async function fetchMeetingsApi(): Promise<Meeting[]> {
  const res = await fetch(`${API_BASE}/meetings`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch meetings: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchMeetingByIdApi(id: string): Promise<Meeting | null> {
  const res = await fetch(`${API_BASE}/meetings/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch meeting ${id}: ${res.statusText}`);
  }
  return await res.json();
}

export async function saveMeetingApi(meeting: Meeting): Promise<Meeting> {
  const res = await fetch(`${API_BASE}/meetings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(meeting),
  });
  if (!res.ok) {
    throw new Error(`Failed to save meeting: ${res.statusText}`);
  }
  return await res.json();
}

export async function deleteMeetingApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/meetings/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete meeting: ${res.statusText}`);
  }
}

export async function checkBackendHealth(): Promise<{
  status: string;
  database?: { isConnected: boolean; host?: string };
} | null> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
