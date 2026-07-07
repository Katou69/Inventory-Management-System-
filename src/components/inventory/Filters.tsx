"use client";

import { Search } from "lucide-react";

interface FiltersProps {
  search: string;
  setSearch: (value: string) => void;
}

export default function Filters({
  search,
  setSearch,
}: FiltersProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-4">

      <div className="relative flex-1 min-w-[280px]">

        <Search
          className="
            absolute
            left-3
            top-1/2
            -translate-y-1/2
            text-slate-400
            w-4
            h-4
          "
        />


        <input
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          type="text"
          placeholder="Search by name, SKU, supplier..."
          className="
            w-full
            pl-10
            pr-4
            py-2.5
            rounded-lg
            border
            border-slate-200
            outline-none
            focus:ring-2
            focus:ring-primary/30
          "
        />

      </div>

    </div>
  );
}