import { get, set, del, createStore } from "idb-keyval";
import type { Meeting } from "./types";
import { fetchMeetingsApi, fetchMeetingByIdApi, saveMeetingApi, deleteMeetingApi } from "./api";

const store = createStore("bni-elites-db", "meetings");
const INDEX_KEY = "__index__";

async function readLocalIndex(): Promise<string[]> {
  return (await get<string[]>(INDEX_KEY, store)) ?? [];
}

async function listLocalMeetings(): Promise<Meeting[]> {
  const ids = await readLocalIndex();
  const items = await Promise.all(ids.map((id) => get<Meeting>(id, store)));
  return items
    .filter((m): m is Meeting => Boolean(m))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
}

export async function listMeetings(): Promise<Meeting[]> {
  try {
    const remoteMeetings = await fetchMeetingsApi();
    // Cache locally
    for (const m of remoteMeetings) {
      void set(m.id, m, store);
    }
    const ids = remoteMeetings.map((m) => m.id);
    void set(INDEX_KEY, ids, store);
    return remoteMeetings;
  } catch (err) {
    console.warn("Backend API unavailable, loading from local cache:", err);
    return await listLocalMeetings();
  }
}

export async function getMeeting(id: string): Promise<Meeting | undefined> {
  try {
    const remote = await fetchMeetingByIdApi(id);
    if (remote) {
      void set(remote.id, remote, store);
      return remote;
    }
  } catch (err) {
    console.warn(`Backend fetch failed for meeting ${id}, checking local storage:`, err);
  }
  return await get<Meeting>(id, store);
}

export async function saveMeeting(meeting: Meeting): Promise<Meeting> {
  const next = { ...meeting, updatedAt: Date.now() };

  // Always save to local cache
  await set(next.id, next, store);
  const ids = await readLocalIndex();
  if (!ids.includes(next.id)) await set(INDEX_KEY, [...ids, next.id], store);

  try {
    const saved = await saveMeetingApi(next);
    await set(saved.id, saved, store);
    return saved;
  } catch (err) {
    console.warn("Could not persist to backend server, saved locally:", err);
    return next;
  }
}

export async function deleteMeeting(id: string): Promise<void> {
  // Local cache deletion
  await del(id, store);
  const ids = await readLocalIndex();
  await set(
    INDEX_KEY,
    ids.filter((x) => x !== id),
    store,
  );

  try {
    await deleteMeetingApi(id);
  } catch (err) {
    console.warn(`Could not delete meeting ${id} on backend server:`, err);
  }
}
