import { Suspense } from "react";
import EditorRoute from "@/components/EditorRoute";

export const metadata = { title: "Editor · Notebook admin" };

export default function EditorPage() {
  return (
    <Suspense fallback={null}>
      <EditorRoute />
    </Suspense>
  );
}
