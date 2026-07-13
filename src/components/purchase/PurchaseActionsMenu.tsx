"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ban, Eye, MoreHorizontal, Pencil, PackageCheck, Trash2 } from "lucide-react";
import { PurchaseOrder } from "@/types/purchases";

export type Role = "admin" | "manager" | "staff"; // ideally centralize this alongside Order's Role type

type Props = {
  purchase: PurchaseOrder;
  role: Role;
  onView: (purchase: PurchaseOrder) => void;
  onReceive: (purchase: PurchaseOrder) => void;
  onEdit: (purchase: PurchaseOrder) => void;
  onDelete: (purchase: PurchaseOrder) => void;
  onCancel: (purchase: PurchaseOrder) => void;
};

const MENU_WIDTH = 192;

export default function PurchaseActionsMenu({
  purchase,
  role,
  onView,
  onReceive,
  onEdit,
  onDelete,
  onCancel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const canManage = role === "admin" || role === "manager";
  const canCancel =
    canManage && (purchase.status === "pending" || purchase.status === "receiving");

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    let left = rect.right - MENU_WIDTH;
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));

    setPosition({ top: rect.bottom + 4, left });
    setReady(false);
    setOpen(true);
  };

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
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="rounded-lg p-2 transition hover:bg-accent"
        aria-label={`Open actions for ${purchase.id}`}
      >
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
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
            className="z-50 w-48 rounded-lg border border-border bg-card py-1 shadow-lg"
          >
            <button
              type="button"
              onClick={() => {
                onView(purchase);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>

            {purchase.status === "pending" && (
              <button
                type="button"
                onClick={() => {
                  onReceive(purchase);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
              >
                <PackageCheck className="h-4 w-4" />
                Receive Items
              </button>
            )}

            {canManage && (
              <button
                type="button"
                onClick={() => {
                  onEdit(purchase);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
              >
                <Pencil className="h-4 w-4" />
                Edit Purchase
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={() => {
                  onCancel(purchase);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
              >
                <Ban className="h-4 w-4" />
                Cancel Purchase
              </button>
            )}

            {canManage && (
              <button
                type="button"
                onClick={() => {
                  onDelete(purchase);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Purchase
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}