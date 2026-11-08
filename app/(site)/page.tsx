import BlogGrid from "@/components/BlogGrid";
import { getAllPostMeta } from "@/lib/posts";

export default function Home() {
  // Runs on the server at build/request time; swap for fetch("/api/posts") if your
  // metadata lives behind an API.
  const posts = getAllPostMeta();

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">Posts</h1>
      <p className="mb-10 mt-3 max-w-xl font-serif text-lg text-slate-600">
        Notes on building, designing and learning.
      </p>
      <BlogGrid posts={posts} />
    </div>
  );
}
