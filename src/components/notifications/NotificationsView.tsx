"use client"

import { useState } from "react";
import { Bell } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "@/services/dashboard-service";
import type { NotificationItem, NotificationType } from "@/types/dashboard";
import { Pagination } from "@/components/ui";
import { usePagination } from "@/lib/use-pagination";

const notifTone: Record<NotificationType, string> = {
  stock: "bg-[#E5F0F5] text-[#1A6B8A] dark:bg-[#1A6B8A]/20 dark:text-[#2B8BAD]",
  order: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  alert: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  user: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
};

const FILTERS: Array<{ label: string; value: "all" | "unread" }> = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
];

export default function NotificationsView({ initialNotifications }: { initialNotifications: NotificationItem[] }) {
  const [notifs, setNotifs] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifs.filter((n) => n.unread).length;
  const filtered = filter === "unread" ? notifs.filter((n) => n.unread) : notifs;
  const { page, pageCount, setPage, pageItems } = usePagination(filtered, 15);

  const markOneRead = (id: number) => {
    setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    void markNotificationRead(id);
  };

  const markAllRead = () => {
    setNotifs((ns) => ns.map((n) => ({ ...n, unread: false })));
    void markAllNotificationsRead();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-primary hover:text-primary/80 font-medium">
            Mark all read
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === f.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
        {pageItems.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">
            {filter === "unread" ? "No unread notifications." : "No notifications yet."}
          </div>
        )}
        {pageItems.map((n) => (
          <button
            key={n.id}
            onClick={() => n.unread && markOneRead(n.id)}
            className={`w-full text-left flex gap-3 px-5 py-4 hover:bg-accent transition-colors ${n.unread ? "bg-primary/5" : ""}`}
          >
            <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${notifTone[n.type]}`}>
              <Bell className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                {n.unread && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
              </div>
              <p className="text-sm text-muted-foreground leading-snug mt-0.5">{n.description}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{n.time}</p>
            </div>
          </button>
        ))}
      </div>

      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} totalItems={filtered.length} pageSize={15} />
    </div>
  );
}
