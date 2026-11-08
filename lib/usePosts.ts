"use client";

import { useSyncExternalStore } from "react";
import { EMPTY, getPosts, subscribe } from "./postStore";

/** Live list of saved posts. Empty on the server, filled in after hydration. */
export function usePosts() {
  return useSyncExternalStore(subscribe, getPosts, () => EMPTY);
}
