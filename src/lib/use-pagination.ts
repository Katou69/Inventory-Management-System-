import { useEffect, useState } from "react";

/**
 * Client-side pagination over an already-fetched array. Every table in this
 * app loads its full dataset and filters/searches client-side (no backend
 * ?page= support exists), so pagination slices that same array rather than
 * refetching.
 */
export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  // Filtering/searching upstream can shrink the list out from under the
  // current page (e.g. on page 3 of 4, then a search narrows it to 1 page) --
  // clamp back into range rather than rendering an empty page.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const clampedPage = Math.min(page, pageCount);
  const start = (clampedPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  // Row-numbering offset ("No" columns) so numbers continue across pages
  // instead of restarting at 1 each time.
  return { page: clampedPage, pageCount, setPage, pageItems, startIndex: start };
}
