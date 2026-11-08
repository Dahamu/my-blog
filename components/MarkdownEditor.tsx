"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ArticleLayout from "./ArticleLayout";
import TagInput from "./TagInput";
import { deletePost, getPost, savePost, unpublishPost } from "@/lib/postStore";
import { slugify } from "@/lib/text";
import { usePosts } from "@/lib/usePosts";

const SCRATCH_KEY = "blog-editor-scratch"; // unsaved new-post draft only

const STARTER = `Start writing here. The preview on the right updates as you type.

## A subheading

Some **bold** and *italic* text, a [link](https://nextjs.org), and a list:

- First point
- Second point

> A quote worth remembering.

\`\`\`ts
const hello = "world";
\`\`\`
`;

// Survives the remount that happens when a new post gets its id in the URL.
let pendingFlash = "";

type Tool = { label: string; title: string; run: () => void };

export default function MarkdownEditor({ postId }: { postId?: string }) {
  const router = useRouter();
  const saved = usePosts();
  const existing = postId ? saved.find((p) => p.id === postId) : undefined;
  const isPublished = existing?.status === "published";

  const [title, setTitle] = useState("");
  const [cover, setCover] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [markdown, setMarkdown] = useState(postId ? "" : STARTER);
  const [view, setView] = useState<"write" | "preview">("write"); // small screens only
  const [status, setStatus] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  const taRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  // On mount: load the post being edited, or restore the scratch draft for a new one.
  useEffect(() => {
    if (postId) {
      const p = getPost(postId);
      if (p) { setTitle(p.title); setCover(p.coverImage ?? ""); setTags(p.tags); setMarkdown(p.content); }
    } else {
      try {
        const raw = localStorage.getItem(SCRATCH_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          setTitle(d.title ?? ""); setCover(d.cover ?? ""); setTags(d.tags ?? []); setMarkdown(d.markdown ?? STARTER);
        }
      } catch {}
    }
    if (pendingFlash) { setStatus(pendingFlash); pendingFlash = ""; }
    setLoaded(true);
  }, [postId]);

  // Autosave scratch copy while writing a brand-new post.
  useEffect(() => {
    if (!loaded || postId) return;
    const id = setTimeout(() => {
      try { localStorage.setItem(SCRATCH_KEY, JSON.stringify({ title, cover, tags, markdown })); } catch {}
    }, 500);
    return () => clearTimeout(id);
  }, [title, cover, tags, markdown, loaded, postId]);

  // ---- save / publish / delete ----
  const save = (target: "draft" | "published") => {
    if (!title.trim()) { setStatus("Add a title first."); return; }
    if (target === "published" && !markdown.trim()) { setStatus("Write some content before publishing."); return; }

    const r = savePost(
      { id: postId, title, coverImage: cover.trim() || undefined, tags, content: markdown },
      target
    );
    if (!r.ok) { setStatus(r.error); return; }

    const msg = target === "published" ? (isPublished ? "Changes published." : "Published.") : "Draft saved.";
    if (!postId) {
      try { localStorage.removeItem(SCRATCH_KEY); } catch {}
      pendingFlash = msg;
      router.replace(`/admin/editor?id=${r.post.id}`); // later saves now update this post
    } else {
      setStatus(msg);
    }
  };

  const unpublish = () => {
    if (postId && unpublishPost(postId)) setStatus("Moved back to drafts.");
  };

  const remove = () => {
    if (!postId || !confirm(`Delete "${existing?.title ?? "this post"}"? This can't be undone.`)) return;
    deletePost(postId);
    router.push("/admin");
  };

  const clearScratch = () => {
    if (!confirm("Clear the title, cover, tags and text?")) return;
    setTitle(""); setCover(""); setTags([]); setMarkdown("");
    try { localStorage.removeItem(SCRATCH_KEY); } catch {}
    setStatus("Cleared.");
  };

  // ---- toolbar ----
  const edit = useCallback((fn: (sel: string, before: string, after: string) => { text: string; start: number; end: number }) => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const r = fn(value.slice(s, e), value.slice(0, s), value.slice(e));
    setMarkdown(r.text);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(r.start, r.end); });
  }, []);

  const wrap = (open: string, close: string, placeholder: string) =>
    edit((sel, before, after) => {
      const inner = sel || placeholder;
      return { text: before + open + inner + close + after, start: before.length + open.length, end: before.length + open.length + inner.length };
    });

  const prefixLines = (prefix: string) =>
    edit((sel, before, after) => {
      const lineStart = before.lastIndexOf("\n") + 1;
      const head = before.slice(0, lineStart);
      const block = before.slice(lineStart) + (sel || "Text");
      const out = block.split("\n").map((l) => prefix + l).join("\n");
      return { text: head + out + after, start: head.length, end: head.length + out.length };
    });

  const tools: Tool[] = [
    { label: "H2", title: "Heading", run: () => prefixLines("## ") },
    { label: "B", title: "Bold", run: () => wrap("**", "**", "bold text") },
    { label: "I", title: "Italic", run: () => wrap("*", "*", "italic text") },
    { label: "Link", title: "Link", run: () => wrap("[", "](https://)", "link text") },
    { label: "Quote", title: "Quote", run: () => prefixLines("> ") },
    { label: "List", title: "Bulleted list", run: () => prefixLines("- ") },
    { label: "Code", title: "Inline code", run: () => wrap("`", "`", "code") },
  ];

  // ---- scroll sync ----
  const sync = (from: HTMLElement, to: HTMLElement | null) => {
    if (!to || syncing.current) return;
    const ratio = from.scrollTop / Math.max(1, from.scrollHeight - from.clientHeight);
    syncing.current = true;
    to.scrollTop = ratio * (to.scrollHeight - to.clientHeight);
    requestAnimationFrame(() => { syncing.current = false; });
  };

  const words = useMemo(() => (markdown.trim() ? markdown.trim().split(/\s+/).length : 0), [markdown]);

  // ---- .md file export ----
  const fileText = () =>
    [
      "---",
      `title: ${JSON.stringify(title || "Untitled post")}`,
      `date: ${today}`,
      `tags: ${JSON.stringify(tags)}`,
      ...(cover ? [`coverImage: ${JSON.stringify(cover)}`] : []),
      "---",
      "",
      markdown.trim(),
      "",
    ].join("\n");

  const copy = async () => {
    try { await navigator.clipboard.writeText(fileText()); setStatus("Copied to clipboard."); }
    catch { setStatus("Copy failed. Use Download instead."); }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([fileText()], { type: "text/markdown" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${slugify(title)}.md` });
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Downloaded ${slugify(title)}.md`);
  };

  if (loaded && postId && !existing) {
    return (
      <div className="grid h-full place-items-center p-8 text-center font-sans">
        <div>
          <p className="text-lg font-semibold">That post wasn't found in this browser.</p>
          <p className="mt-1 text-sm text-mute">It may have been deleted, or it was saved in a different browser.</p>
          <Link href="/admin" className="mt-5 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-ink">Back to posts</Link>
        </div>
      </div>
    );
  }

  const field =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-mute focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";
  const btn =
    "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
  const primary =
    "rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-white hover:bg-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

  return (
    <div className="flex h-full flex-col font-sans">
      {/* Metadata */}
      <div className="grid shrink-0 gap-3 border-b border-slate-200 bg-white p-4 md:grid-cols-3">
        <div>
          <label htmlFor="post-title" className="mb-1 block text-sm font-medium">Title</label>
          <input id="post-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" className={field} />
        </div>
        <div>
          <label htmlFor="post-cover" className="mb-1 block text-sm font-medium">Cover image URL</label>
          <input id="post-cover" type="url" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://…" className={field} />
        </div>
        <div>
          <label htmlFor="post-tags" className="mb-1 block text-sm font-medium">Tags</label>
          <TagInput tags={tags} onChange={setTags} />
        </div>
      </div>

      {/* Toolbar + actions */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <div role="tablist" aria-label="Editor view" className="mr-2 flex overflow-hidden rounded-lg border border-slate-300 lg:hidden">
            {(["write", "preview"] as const).map((v) => (
              <button
                key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm capitalize ${view === v ? "bg-ink text-white" : "bg-white text-slate-700"}`}
              >
                {v}
              </button>
            ))}
          </div>
          {tools.map((t) => (
            <button key={t.label} type="button" title={t.title} aria-label={t.title} onClick={t.run} className={`${btn} min-w-9 ${t.label === "B" ? "font-bold" : ""} ${t.label === "I" ? "italic" : ""}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span role="status" aria-live="polite" className="mr-1 text-sm text-mute">{status}</span>
          {postId ? (
            <button type="button" onClick={remove} className={`${btn} hover:border-red-500 hover:text-red-600`}>Delete</button>
          ) : (
            <button type="button" onClick={clearScratch} className={btn}>Clear</button>
          )}
          <button type="button" onClick={copy} className={btn}>Copy .md</button>
          <button type="button" onClick={download} className={btn}>Download .md</button>
          {isPublished ? (
            <button type="button" onClick={unpublish} className={btn}>Unpublish</button>
          ) : (
            <button type="button" onClick={() => save("draft")} className={btn}>Save draft</button>
          )}
          <button type="button" onClick={() => save("published")} className={primary}>
            {isPublished ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {/* Panes */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <div className={`${view === "write" ? "flex" : "hidden"} min-h-0 flex-col border-slate-200 lg:flex lg:border-r`}>
          <label htmlFor="post-body" className="sr-only">Markdown</label>
          <textarea
            id="post-body"
            ref={taRef}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            onScroll={(e) => sync(e.currentTarget, previewRef.current)}
            spellCheck
            placeholder="Write Markdown here…"
            className="min-h-0 flex-1 resize-none bg-white p-5 font-mono text-sm leading-7 text-slate-800 placeholder:text-mute focus:outline-none"
          />
          <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-1.5 text-xs text-mute">
            {words} {words === 1 ? "word" : "words"} · {postId ? (isPublished ? "Published" : "Draft") : "New post"}
          </div>
        </div>

        <div
          ref={previewRef}
          onScroll={(e) => sync(e.currentTarget, taRef.current)}
          className={`${view === "preview" ? "block" : "hidden"} min-h-0 overflow-y-auto bg-paper pb-16 lg:block`}
          aria-label="Live preview"
        >
          <ArticleLayout
            post={{ title: title || "Untitled post", coverImage: cover || undefined, date: today, tags, content: markdown }}
          />
        </div>
      </div>
    </div>
  );
}
