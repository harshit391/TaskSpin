"use client";

import { QueryClient, QueryClientProvider, dehydrate, hydrate } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useState } from "react";

// Pages navigate with full reloads, so the in-memory cache is lost on every page.
// Persisting it lets lists render instantly from the last known data while a
// background refetch brings them up to date.
const CACHE_KEY = "taskspin-query-cache";
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const PERSISTED_KEYS = new Set(["tasks", "projects", "roadmaps", "habits", "roadmap-tasks"]);

export function clearPersistedQueryCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}

function restore(client: QueryClient) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const { savedAt, state } = JSON.parse(raw);
    if (Date.now() - savedAt > CACHE_MAX_AGE_MS) return clearPersistedQueryCache();
    hydrate(client, state);
  } catch {
    clearPersistedQueryCache();
  }
}

function persist(client: QueryClient) {
  try {
    const state = dehydrate(client, {
      shouldDehydrateQuery: (q) =>
        q.state.status === "success" && PERSISTED_KEYS.has(String(q.queryKey[0])),
    });
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), state }));
  } catch {}
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  // Restore after hydration (server HTML has no cached data) but before first paint,
  // so there's no spinner flash and no hydration mismatch.
  useLayoutEffect(() => {
    restore(queryClient);
  }, [queryClient]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => persist(queryClient), 500);
    });
    const flush = () => persist(queryClient);
    window.addEventListener("pagehide", flush);
    return () => {
      unsubscribe();
      clearTimeout(timer);
      window.removeEventListener("pagehide", flush);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
