"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Eye, Pencil, Trash2, PackageCheck, Ban } from "lucide-react";
import { Order } from "@/types/orders";

export type Role = "admin" | "manager" | "staff"; // replace with your real Role type if you have one

type Props = {
  order: Order;
  role: Role;
  onView: (order: Order) => void;
  onMoveToShip: (order: Order) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onCancel: (order: Order) => void;
};

const MENU_WIDTH = 192; // matches w-48

export default function OrderActionsMenu({
  order,
  role,
  onView,
  onMoveToShip,
  onEdit,
  onDelete,
  onCancel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [ready, setReady] = useState(false); // true once we've measured real height

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const canManage = role === "admin" || role === "manager";
  const canCancel = canManage && (order.status === "pending" || order.status === "picking");

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    let left = rect.right - MENU_WIDTH;
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));

    // Provisional position, right below the button — will be corrected
    // in the layout effect below once we know the menu's real height.
    setPosition({ top: rect.bottom + 4, left });
    setReady(false);
    setOpen(true);
  };

  // Runs after the (invisible) menu has mounted, so we can measure its
  // real height and flip it above the button if it doesn't fit below.
  useLayoutEffect(() => {
    if (!open) return;

    const buttonRect = buttonRef.current?.getBoundingClientRect();
    const menuRect = menuRef.current?.getBoundingClientRect();

    if (!buttonRect || !menuRect) return;

    const menuHeight = menuRect.height;
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;

    let top = buttonRect.bottom + 4;

    if (spaceBelow < menuHeight + 8 && spaceAbove > spaceBelow) {
      top = buttonRect.top - menuHeight - 4;
    }

    top = Math.max(8, top);

    setPosition((current) => ({ ...current, top }));
    setReady(true);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    function closeOnScrollOrResize() {
      setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", closeOnScrollOrResize, true);
    window.addEventListener("resize", closeOnScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", closeOnScrollOrResize, true);
      window.removeEventListener("resize", closeOnScrollOrResize);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="hover:bg-slate-100 p-2 rounded-lg"
      >
        <MoreHorizontal className="w-4 h-4 text-slate-500" />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              visibility: ready ? "visible" : "hidden",
            }}
            className="z-50 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1"
          >
            <button
              onClick={() => {
                onView(order);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>

            {order.status === "pending" && (
              <button
                onClick={() => {
                  onMoveToShip(order);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50"
              >
                <PackageCheck className="w-4 h-4" />
                Move to Ship
              </button>
            )}

            {canManage && (
              <button
                onClick={() => {
                  onEdit(order);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50"
              >
                <Pencil className="w-4 h-4" />
                Edit Order
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => {
                  onCancel(order);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
              >
                <Ban className="w-4 h-4" />
                Cancel Order
              </button>
            )}

            {canManage && (
              <button
                onClick={() => {
                  onDelete(order);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete Order
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}