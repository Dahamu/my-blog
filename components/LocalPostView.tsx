"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ArticleLayout from "./ArticleLayout";
import { usePosts } from "@/lib/usePosts";

export default function LocalPostView() {
  const id = useSearchParams().get("id");
  const posts = usePosts();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  const p = posts.find((x) => x.id === id && x.status === "published");

  if (!p) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <p className="text-lg font-semibold">Post not found</p>
        <p className="mt-1 text-sm text-mute">Posts published from the editor are stored in the browser that created them.</p>
        <Link href="/" className="mt-5 inline-block text-accent underline underline-offset-4">Back to all posts</Link>
      </div>
    );
  }

  return (
    <ArticleLayout
      post={{ title: p.title, coverImage: p.coverImage, date: p.publishedAt ?? p.updatedAt, tags: p.tags, content: p.content }}
    />
  );
}
