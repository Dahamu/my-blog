export interface Post {
  slug?: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  date: string; // ISO, e.g. "2026-11-08"
  tags: string[];
  content: string; // markdown body
}

/** Lightweight shape used by the homepage grid. */
export interface PostMeta {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  href?: string; // set for posts that don't live at /blog/[slug]
}

export type PostStatus = "draft" | "published";

/** The JSON shape saved to localStorage, one object per post. */
export interface StoredPost {
  id: string;
  slug: string;
  title: string;
  coverImage?: string;
  tags: string[];
  content: string; // markdown
  excerpt: string;
  status: PostStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  publishedAt?: string; // ISO, set while published
}

export interface PostInput {
  id?: string;
  title: string;
  coverImage?: string;
  tags: string[];
  content: string;
}
