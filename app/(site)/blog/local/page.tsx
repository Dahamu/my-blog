import { Suspense } from "react";
import LocalPostView from "@/components/LocalPostView";

export const metadata = { title: "Post · Notebook" };

export default function LocalPostPage() {
  return (
    <Suspense fallback={null}>
      <LocalPostView />
    </Suspense>
  );
}
