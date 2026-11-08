import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Post } from "@/lib/types";

function readingTime(text: string) {
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 220));
}

export default function ArticleLayout({ post }: { post: Post }) {
  const date = new Date(post.date).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl px-5 pt-12 sm:pt-16">
      <header>
        {post.tags.length > 0 && (
          <ul className="mb-5 flex flex-wrap gap-2 font-sans text-sm">
            {post.tags.map((t) => (
              <li key={t} className="rounded-full bg-accent/10 px-3 py-1 text-accent">{t}</li>
            ))}
          </ul>
        )}
        <h1 className="font-sans text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-5 font-sans text-sm text-mute">
          <time dateTime={post.date}>{date}</time>
          {" · "}
          {readingTime(post.content)} min read
        </p>
      </header>

      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage}
          alt=""
          className="mt-10 aspect-[16/9] w-full rounded-xl object-cover"
        />
      )}

      <div className="prose prose-article prose-slate mt-10 max-w-none prose-headings:scroll-mt-24 prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-img:mx-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}
