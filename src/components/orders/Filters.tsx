"use client";

import { Calendar, X } from "lucide-react";

export type OrderFilterStatus =
  | "all"
  | "pending"
  | "completed"
  | "cancelled";

type FiltersProps = {
  activeStatus: OrderFilterStatus;
  startDate: string;
  endDate: string;
  onStatusChange: (status: OrderFilterStatus) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClearDates: () => void;
};

const tabs: {
  label: string;
  value: OrderFilterStatus;
}[] = [
  { label: "All Orders", value: "all" },
  { label: "Pending", value: "pending" },
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
      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onStatusChange(tab.value)}
            className={`border-b-2 pb-1 text-sm font-medium transition-colors ${
              activeStatus === tab.value
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex items-center">
          <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />

          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <span className="text-sm text-slate-400">To</span>

        <label className="relative flex items-center">
          <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />

          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        {hasDateFilter && (
          <button
            type="button"
            onClick={onClearDates}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}