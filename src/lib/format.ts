import type { Meeting, Num } from "./types";

export const CHAPTER = import.meta.env["VITE_CHAPTER_NAME"] || "BNI Elites";

export function fmtNum(v: Num): string {
  return v === null || v === undefined || Number.isNaN(v)
    ? "not recorded"
    : v.toLocaleString("en-IN");
}

export function fmtMoney(v: Num): string {
  return v === null || v === undefined || Number.isNaN(v)
    ? "not recorded"
    : "₹" + v.toLocaleString("en-IN");
}

export function compactMoney(v: Num): string {
  if (v === null || v === undefined) return "—";
  if (v >= 10000000) return "₹" + (v / 10000000).toFixed(2) + " Cr";
  if (v >= 100000) return "₹" + (v / 100000).toFixed(2) + " L";
  if (v >= 1000) return "₹" + (v / 1000).toFixed(1) + "K";
  return "₹" + v;
}

export function longDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function shortDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function dayName(iso: string): string {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long" });
}

export const has = (s?: string | null) => Boolean(s && s.trim());

export function photos(m: Meeting) {
  return m.attachments.filter((a) => a.kind === "photo");
}
export function docs(m: Meeting) {
  return m.attachments.filter((a) => a.kind === "doc");
}
export function coverPhoto(m: Meeting) {
  return photos(m).find((p) => p.isCover) ?? null;
}
export function photosByTag(m: Meeting, tag: string) {
  return photos(m).filter((p) => !p.isCover && p.tag === tag);
}
export function untaggedPhotos(m: Meeting, usedTags: string[]) {
  return photos(m).filter((p) => !p.isCover && (!p.tag || !usedTags.includes(p.tag)));
}

export function sizeLabel(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

export function hasRecognitions(m: Meeting) {
  const r = m.recognitions;
  return (
    has(r.goldenMike) ||
    has(r.topReferrer.name) ||
    has(r.topBusiness.name) ||
    has(r.profileOfMonth) ||
    has(r.starPerformer) ||
    has(r.special.name) ||
    has(r.membership.name)
  );
}
