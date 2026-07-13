"use client";

import { Calendar, X } from "lucide-react";

export type PurchaseFilterStatus =
  | "all"
  | "pending"
  | "receiving"
  | "completed"
  | "cancelled";

type FiltersProps = {
  activeStatus: PurchaseFilterStatus;
  startDate: string;
  endDate: string;
  onStatusChange: (status: PurchaseFilterStatus) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClearDates: () => void;
};

const tabs: {
  label: string;
  value: PurchaseFilterStatus;
}[] = [
  { label: "All Purchases", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Receiving", value: "receiving" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function Filters({
  activeStatus,
  startDate,
  endDate,
  onStatusChange,
  onStartDateChange,
  onEndDateChange,
  onClearDates,
}: FiltersProps) {
  const hasDateFilter = Boolean(startDate || endDate);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onStatusChange(tab.value)}
            className={`border-b-2 pb-1 text-sm font-medium transition-colors ${
              activeStatus === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex items-center">
          <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />

          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => onStartDateChange(event.target.value)}
            aria-label="Purchase start date"
            className="rounded-lg border border-border bg-card py-2 pl-10 pr-3 text-sm text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </label>

        <span className="text-sm text-muted-foreground">To</span>

        <label className="relative flex items-center">
          <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />

          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => onEndDateChange(event.target.value)}
            aria-label="Purchase end date"
            className="rounded-lg border border-border bg-card py-2 pl-10 pr-3 text-sm text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </label>

        {hasDateFilter && (
          <button
            type="button"
            onClick={onClearDates}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}