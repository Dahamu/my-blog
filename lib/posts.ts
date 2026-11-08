import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Post, PostMeta } from "./types";
import { makeExcerpt } from "./text";

const dir = path.join(process.cwd(), "content");

/** Turn a markdown string with front matter into a Post. */
export function parseMarkdown(raw: string, slug?: string): Post {
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title ?? "Untitled",
    excerpt: data.excerpt,
    coverImage: data.coverImage,
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    tags: data.tags ?? [],
    content,
  };
}

export function getPost(slug: string): Post | null {
  const md = path.join(dir, `${slug}.md`);
  const js = path.join(dir, `${slug}.json`);
  if (fs.existsSync(md)) return parseMarkdown(fs.readFileSync(md, "utf8"), slug);
  if (fs.existsSync(js)) return { ...(JSON.parse(fs.readFileSync(js, "utf8")) as Post), slug };
  return null;
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".json"))
    .map((f) => getPost(f.replace(/\.(md|json)$/, ""))!)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

/** Metadata only: no body, so the homepage payload stays small. */
export function getAllPostMeta(): PostMeta[] {
  return getAllPosts().map((p) => ({
    slug: p.slug!,
    title: p.title,
    excerpt: p.excerpt ?? makeExcerpt(p.content),
    date: p.date,
    tags: p.tags,
  }));
}
