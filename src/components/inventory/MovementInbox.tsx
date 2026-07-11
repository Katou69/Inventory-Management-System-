"use client";

import { useState } from "react";

import type { MovementTask } from "@/types/inventory-movement";

import MovementCard from "./MovementCard";
import MovementModal from "./MovementModal";

interface Props {
  tasks: MovementTask[];
}

export default function MovementInbox({
  tasks,
}: Props) {
  const [selectedTask, setSelectedTask] =
    useState<MovementTask | null>(null);

  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-sm">

        <div className="px-5 py-4 border-b border-border">

          <h2 className="font-semibold">
            Pending Inventory Tasks ({tasks.length})
          </h2>

        </div>

        <div className="p-5 space-y-4">

          {tasks.map((task) => (

            <MovementCard
              key={task.id}
              task={task}
              onView={() => {
                setSelectedTask(task);
                setOpen(true);
              }}
            />

          ))}

          {tasks.length === 0 && (

            <p className="text-sm text-muted-foreground text-center py-6">
              No pending inventory movement tasks.
            </p>

          )}

        </div>

      </div>

      <MovementModal
        open={open}
        task={selectedTask}
        onClose={() => {
          setOpen(false);
          setSelectedTask(null);
        }}
        onComplete={() => {
          console.log("Completed:", selectedTask);

          setOpen(false);
          setSelectedTask(null);
        }}
      />
    </>
  );
}