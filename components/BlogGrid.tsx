"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PostMeta, StoredPost } from "@/lib/types";
import { usePosts } from "@/lib/usePosts";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const toMeta = (p: StoredPost): PostMeta => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  date: p.publishedAt ?? p.updatedAt,
  tags: p.tags,
  href: `/blog/local?id=${p.id}`,
});

export default function BlogGrid({ posts: filePosts }: { posts: PostMeta[] }) {
  // Posts published from the admin editor live in this browser's localStorage.
  const stored = usePosts();
  const posts = useMemo(
    () =>
      [...stored.filter((p) => p.status === "published").map(toMeta), ...filePosts].sort(
        (a, b) => +new Date(b.date) - +new Date(a.date)
      ),
    [stored, filePosts]
  );
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string[]>([]);

  // All tags with how many posts use them, most used first.
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [posts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const matchesTags = active.every((t) => p.tags.includes(t)); // every selected tag
      const matchesText =
        !q || `${p.title} ${p.excerpt} ${p.tags.join(" ")}`.toLowerCase().includes(q);
      return matchesTags && matchesText;
    });
  }, [posts, query, active]);

  const toggle = (t: string) =>
    setActive((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  const filtering = query !== "" || active.length > 0;
  const reset = () => { setQuery(""); setActive([]); };

  return (
    <section aria-label="Blog posts">
      <div role="search" className="space-y-4">
        <label htmlFor="post-search" className="sr-only">Search posts</label>
        <div className="relative">
          <svg
            aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-mute"
          >
            <circle cx="9" cy="9" r="6" /><path d="m14 14 4 4" strokeLinecap="round" />
          </svg>
          <input
            id="post-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, topic or tag"
            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 font-sans text-base text-ink placeholder:text-mute focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Filter by tag">
            {tags.map(([t, n]) => {
              const on = active.includes(t);
              return (
                <li key={t}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(t)}
                    className={`rounded-full border px-3 py-1 font-sans text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                      on
                        ? "border-accent bg-accent text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-accent hover:text-accent"
                    }`}
                  >
                    {t} <span className={on ? "text-white/80" : "text-mute"}>{n}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex min-h-6 items-center justify-between font-sans text-sm text-mute">
          <p aria-live="polite">
            {visible.length} {visible.length === 1 ? "post" : "posts"}
            {filtering && ` of ${posts.length}`}
          </p>
          {filtering && (
            <button type="button" onClick={reset} className="text-accent underline underline-offset-4 hover:text-ink">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-slate-300 p-10 text-center font-sans">
          <p className="font-medium text-ink">No posts match your search.</p>
          <p className="mt-1 text-sm text-mute">Try a different word, or remove a tag.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <li key={p.href ?? p.slug}>
              <article className="group relative flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-accent/60">
                <time dateTime={p.date} className="font-sans text-sm text-mute">{fmt(p.date)}</time>
                <h2 className="mt-2 font-sans text-xl font-semibold leading-snug tracking-tight text-ink">
                  {/* stretched link makes the whole card clickable */}
                  <Link
                    href={p.href ?? `/blog/${p.slug}`}
                    className="after:absolute after:inset-0 after:content-[''] focus:outline-none group-hover:text-accent group-focus-within:text-accent"
                  >
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-2 line-clamp-3 flex-1 font-serif text-base leading-relaxed text-slate-600">
                  {p.excerpt}
                </p>
                {p.tags.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-1.5 font-sans text-xs text-accent">
                    {p.tags.map((t) => (
                      <li key={t} className="rounded-full bg-accent/10 px-2.5 py-0.5">{t}</li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
