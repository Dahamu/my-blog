export default function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-10 font-sans text-sm text-mute sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Notebook. All rights reserved.</p>
        <p>Written in Markdown, built with Next.js.</p>
      </div>
    </footer>
  );
}
