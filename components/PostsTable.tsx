"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { deletePost, exportJson, importJson, unpublishPost } from "@/lib/postStore";
import { usePosts } from "@/lib/usePosts";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function PostsTable() {
  const posts = usePosts();
  const [mounted, setMounted] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => setMounted(true), []);

  const sorted = [...posts].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

  const remove = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    deletePost(id);
    setMsg("Post deleted.");
  };

  const exportFile = () => {
    const url = URL.createObjectURL(new Blob([exportJson()], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `posts-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    URL.revokeObjectURL(url);
    setMsg(`Exported ${posts.length} ${posts.length === 1 ? "post" : "posts"}.`);
  };

  const importFile = async (file: File) => {
    const r = importJson(await file.text());
    setMsg(r.ok ? `Imported ${r.count} ${r.count === 1 ? "post" : "posts"}.` : r.error);
    if (fileRef.current) fileRef.current.value = "";
  };

  const btn =
    "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

  return (
    <div className="h-full overflow-y-auto font-sans">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
            <p role="status" aria-live="polite" className="mt-1 min-h-5 text-sm text-mute">
              {msg || "Saved in this browser."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
            <button type="button" className={btn} onClick={() => fileRef.current?.click()}>Import JSON</button>
            <button type="button" className={btn} onClick={exportFile} disabled={posts.length === 0}>Export JSON</button>
            <Link href="/admin/editor" className="rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-white hover:bg-ink">New post</Link>
          </div>
        </div>

        {!mounted ? null : sorted.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-slate-300 p-10 text-center">
            <p className="font-medium">No posts yet.</p>
            <p className="mt-1 text-sm text-mute">Write your first one, or import a JSON file.</p>
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {sorted.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/editor?id=${p.id}`} className="truncate font-semibold hover:text-accent">{p.title}</Link>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${p.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                      {p.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-mute">
                    Updated {fmt(p.updatedAt)}
                    {p.tags.length > 0 && ` · ${p.tags.join(", ")}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {p.status === "published" && (
                    <Link href={`/blog/local?id=${p.id}`} className={btn}>View</Link>
                  )}
                  <Link href={`/admin/editor?id=${p.id}`} className={btn}>Edit</Link>
                  {p.status === "published" && (
                    <button type="button" className={btn} onClick={() => { unpublishPost(p.id); setMsg("Moved back to drafts."); }}>Unpublish</button>
                  )}
                  <button type="button" className={`${btn} hover:border-red-500 hover:text-red-600`} onClick={() => remove(p.id, p.title)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
