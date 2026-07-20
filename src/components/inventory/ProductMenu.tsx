// Save as: src/components/inventory/ProductMenu.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

interface ProductMenuProps {
  // Omit onEdit entirely to hide "Edit Product" (used for staff).
  onEdit?: () => void;
  onHistory: () => void;
}

export default function ProductMenu({
  onEdit,
  onHistory,
}: ProductMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleAction(action: () => void) {
    action();
    setOpen(false);
  }

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-slate-500" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">

          {onEdit && (
            <button
              onClick={() => handleAction(onEdit)}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-100"
            >
              Edit Product
            </button>
          )}

          <button
            onClick={() => handleAction(onHistory)}
            className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-100"
          >
            View History
          </button>
        </div>
      )}
    </div>
  );
}
