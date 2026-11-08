"use client";

import { useState } from "react";

export default function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const t = raw.trim().replace(/,$/, "").trim();
    if (t && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) onChange([...tags, t]);
    setDraft("");
  };

  return (
    <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent/10 py-0.5 pl-2.5 pr-1 text-sm text-accent">
          {t}
          <button
            type="button"
            aria-label={`Remove tag ${t}`}
            onClick={() => onChange(tags.filter((x) => x !== t))}
            className="grid h-5 w-5 place-items-center rounded-full hover:bg-accent/20"
          >
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="m3 3 6 6M9 3 3 9" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      ))}
      <input
        id="post-tags"
        value={draft}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); add(draft); }
          else if (e.key === "Backspace" && !draft && tags.length) onChange(tags.slice(0, -1));
        }}
        onBlur={() => draft && add(draft)}
        placeholder={tags.length ? "" : "Type a tag, press Enter"}
        className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-mute"
      />
    </div>
  );
}
