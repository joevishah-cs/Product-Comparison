import * as React from "react";
import type { ReviewSource } from "@/data/review-types";

/**
 * The review export is ~1 MB, so it is fetched on demand rather than bundled into
 * the initial payload. The result is cached for the life of the page.
 */
let cache: ReviewSource | null = null;
let inFlight: Promise<ReviewSource> | null = null;

export function loadReviewSource(): Promise<ReviewSource> {
  if (cache) return Promise.resolve(cache);
  if (inFlight) return inFlight;

  inFlight = fetch("/data/reviews.json")
    .then((res) => {
      if (!res.ok) throw new Error(`Review data unavailable (${res.status})`);
      return res.json() as Promise<ReviewSource>;
    })
    .then((data) => {
      cache = data;
      inFlight = null;
      return data;
    })
    .catch((err) => {
      inFlight = null;
      throw err;
    });

  return inFlight;
}

export interface ReviewSourceState {
  source: ReviewSource | null;
  loading: boolean;
  error: string | null;
}

export function useReviewSource(): ReviewSourceState {
  const [state, setState] = React.useState<ReviewSourceState>(() =>
    cache ? { source: cache, loading: false, error: null } : { source: null, loading: true, error: null },
  );

  React.useEffect(() => {
    if (cache) {
      setState({ source: cache, loading: false, error: null });
      return;
    }
    let cancelled = false;
    loadReviewSource()
      .then((data) => {
        if (!cancelled) setState({ source: data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ source: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
