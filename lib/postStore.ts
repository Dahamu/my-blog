import type { PostInput, PostStatus, StoredPost } from "./types";
import { makeExcerpt, slugify } from "./text";

const KEY = "blog-posts-v1";
export const EMPTY: StoredPost[] = [];

const listeners = new Set<() => void>();
let cacheRaw: string | null | undefined;
let cacheVal: StoredPost[] = EMPTY;

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Accepts anything that looks like a post (e.g. from an imported file) and fills in gaps. */
function normalize(x: unknown): StoredPost | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  if (typeof o.title !== "string" || typeof o.content !== "string") return null;
  const now = new Date().toISOString();
  const status: PostStatus = o.status === "published" ? "published" : "draft";
  const createdAt = typeof o.createdAt === "string" ? o.createdAt : now;
  const updatedAt = typeof o.updatedAt === "string" ? o.updatedAt : createdAt;
  return {
    id: typeof o.id === "string" && o.id ? o.id : newId(),
    slug: typeof o.slug === "string" && o.slug ? o.slug : slugify(o.title),
    title: o.title,
    ...(typeof o.coverImage === "string" && o.coverImage ? { coverImage: o.coverImage } : {}),
    tags: Array.isArray(o.tags) ? o.tags.filter((t): t is string => typeof t === "string") : [],
    content: o.content,
    excerpt: typeof o.excerpt === "string" ? o.excerpt : makeExcerpt(o.content),
    status,
    createdAt,
    updatedAt,
    ...(status === "published" ? { publishedAt: typeof o.publishedAt === "string" ? o.publishedAt : updatedAt } : {}),
  };
}

function read(): StoredPost[] {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null;
  try { raw = localStorage.getItem(KEY); } catch { return EMPTY; }
  if (raw === cacheRaw) return cacheVal; // same string -> same array (needed by useSyncExternalStore)
  cacheRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cacheVal = Array.isArray(parsed) ? parsed.map(normalize).filter((p): p is StoredPost => p !== null) : [];
  } catch {
    cacheVal = [];
  }
  return cacheVal;
}

function write(posts: StoredPost[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(posts));
  } catch {
    return false; // storage full or blocked
  }
  listeners.forEach((l) => l());
  return true;
}

export function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY || e.key === null) cb(); }; // other tabs
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
}

export const getPosts = () => read();
export const getPost = (id: string) => read().find((p) => p.id === id);

function uniqueSlug(title: string, posts: StoredPost[]) {
  const base = slugify(title);
  let slug = base, n = 2;
  while (posts.some((p) => p.slug === slug)) slug = `${base}-${n++}`;
  return slug;
}

export type SaveResult = { ok: true; post: StoredPost } | { ok: false; error: string };

/**
 * Create or update. A new post is appended to the saved array;
 * an existing one (matched by id) is replaced in place.
 */
export function savePost(input: PostInput, status: PostStatus): SaveResult {
  const posts = [...read()];
  const now = new Date().toISOString();
  const i = input.id ? posts.findIndex((p) => p.id === input.id) : -1;
  const prev = i >= 0 ? posts[i] : undefined;

  const post: StoredPost = {
    id: prev?.id ?? newId(),
    slug: prev?.slug ?? uniqueSlug(input.title, posts),
    title: input.title.trim(),
    ...(input.coverImage ? { coverImage: input.coverImage } : {}),
    tags: input.tags,
    content: input.content,
    excerpt: makeExcerpt(input.content),
    status,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
    ...(status === "published" ? { publishedAt: prev?.publishedAt ?? now } : {}),
  };

  if (i >= 0) posts[i] = post; else posts.push(post);
  return write(posts) ? { ok: true, post } : { ok: false, error: "Couldn't save: browser storage is full or blocked." };
}

export function unpublishPost(id: string): boolean {
  const posts = read().map((p) => {
    if (p.id !== id) return p;
    const { publishedAt, ...rest } = p;
    return { ...rest, status: "draft" as const, updatedAt: new Date().toISOString() };
  });
  return write(posts);
}

export function deletePost(id: string): boolean {
  return write(read().filter((p) => p.id !== id));
}

/** Local file saving: the whole array as pretty JSON. */
export const exportJson = () => JSON.stringify(read(), null, 2);

/** Merge posts from a JSON file (array, or { posts: [] }). Same id = replaced. */
export function importJson(text: string): { ok: true; count: number } | { ok: false; error: string } {
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { ok: false, error: "That file isn't valid JSON." }; }
  const list = Array.isArray(data) ? data : (data as { posts?: unknown })?.posts;
  if (!Array.isArray(list)) return { ok: false, error: "Expected an array of posts." };
  const incoming = list.map(normalize).filter((p): p is StoredPost => p !== null);
  if (incoming.length === 0) return { ok: false, error: "No valid posts found in that file." };
  const byId = new Map(read().map((p) => [p.id, p]));
  incoming.forEach((p) => byId.set(p.id, p));
  return write([...byId.values()]) ? { ok: true, count: incoming.length } : { ok: false, error: "Couldn't save: browser storage is full." };
}
