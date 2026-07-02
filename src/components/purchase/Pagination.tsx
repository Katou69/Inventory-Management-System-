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
        className="p-2 rounded-full border border-slate-200 hover:bg-slate-50"
      >
        <ChevronLeft className="w-4 h-4 text-slate-500" />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => setPage(p)}
          className={`w-8 h-8 rounded-full text-sm font-medium ${
            page === p ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {p}
        </button>
      ))}

      <span className="text-slate-400 text-sm px-1">...</span>

      <button
        onClick={() => setPage(totalPages)}
        className={`w-8 h-8 rounded-full text-sm font-medium ${
          page === totalPages ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        {totalPages}
      </button>

      <button
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        className="p-2 rounded-full border border-slate-200 hover:bg-slate-50"
      >
        <ChevronRight className="w-4 h-4 text-slate-500" />
      </button>
    </div>
  );
}