import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-paper/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link href="/" className="font-sans text-lg font-semibold tracking-tight text-ink">
          Notebook
        </Link>
        <ul className="flex items-center gap-6 font-sans text-sm text-mute">
          <li><Link href="/" className="hover:text-ink focus-visible:text-ink">Posts</Link></li>
        </ul>
      </nav>
    </header>
  );
}
