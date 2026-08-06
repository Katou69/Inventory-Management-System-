"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  pageCount,
  onPageChange,
  totalItems,
  pageSize,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Shown as "Showing X–Y of Z" when both are given; omit for a bare prev/next. */
  totalItems?: number;
  pageSize?: number;
}) {
  if (pageCount <= 1) return null;

  const from = totalItems != null && pageSize != null ? (page - 1) * pageSize + 1 : null;
  const to = totalItems != null && pageSize != null ? Math.min(page * pageSize, totalItems) : null;

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border">
      <p className="text-xs text-muted-foreground">
        {from != null && to != null ? (
          <>Showing {from}–{to} of {totalItems}</>
        ) : (
          <>Page {page} of {pageCount}</>
        )}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4 text-muted-foreground" />
        </button>

        <span className="text-xs text-muted-foreground px-2 min-w-8 text-center">
          {page} / {pageCount}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
