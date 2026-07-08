"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ totalPages = 12 }: { totalPages?: number }) {
  const [page, setPage] = useState(1);
  const pages = [1, 2, 3, 4];

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        className="p-2 rounded-full border border-border hover:bg-accent"
      >
        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => setPage(p)}
          className={`w-8 h-8 rounded-full text-sm font-medium ${
            page === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          {p}
        </button>
      ))}

      <span className="text-muted-foreground text-sm px-1">...</span>

      <button
        onClick={() => setPage(totalPages)}
        className={`w-8 h-8 rounded-full text-sm font-medium ${
        page === totalPages ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
      }`}
      >
        {totalPages}
      </button>

      <button
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        className="p-2 rounded-full border border-border hover:bg-accent"
      >
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}