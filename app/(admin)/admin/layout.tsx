import Link from "next/link";

// NOTE: protect /admin with real auth (middleware, NextAuth, etc.) before deploying.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 font-sans text-sm">
        <nav className="flex items-center gap-5">
          <span className="font-semibold tracking-tight">Notebook admin</span>
          <Link href="/admin" className="text-mute hover:text-ink">Posts</Link>
          <Link href="/admin/editor" className="text-mute hover:text-ink">New post</Link>
        </nav>
        <Link href="/" className="text-mute hover:text-ink">View site</Link>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
