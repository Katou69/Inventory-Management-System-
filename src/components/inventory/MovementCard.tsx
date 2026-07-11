"use client";

import type { MovementTask } from "@/types/inventory-movement";

interface Props {
  task: MovementTask;
  onView: () => void;
}

export default function MovementCard({
  task,
  onView,
}: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-foreground">
          {task.productName}
        </h3>

        <p className="text-sm text-muted-foreground mt-1">
          Move {task.quantity} bottles
        </p>

        <p className="text-sm mt-2">
          <span className="font-medium">{task.fromShelf}</span>

          <span className="mx-2">→</span>

          <span className="font-medium">{task.toShelf}</span>
        </p>

        <p className="text-xs text-muted-foreground mt-2">
          Requested by {task.requestedBy}
        </p>
      </div>

      <button
        onClick={onView}
        className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 transition-opacity"
      >
        View Task
      </button>
    </div>
  );
}