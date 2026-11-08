"use client";

import { useSearchParams } from "next/navigation";
import MarkdownEditor from "./MarkdownEditor";

/** /admin/editor → new post. /admin/editor?id=… → edit that post. */
export default function EditorRoute() {
  const id = useSearchParams().get("id") ?? undefined;
  return <MarkdownEditor key={id ?? "new"} postId={id} />;
}
