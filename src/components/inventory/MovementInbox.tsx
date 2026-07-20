"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { MovementTask } from "@/types/inventory-movement";

import MovementCard from "./MovementCard";
import MovementModal from "./MovementModal";
import { completeMovementTask } from "@/services/inventory-service";

interface Props {
  tasks: MovementTask[];
}

export default function MovementInbox({
  tasks,
}: Props) {
  const router = useRouter();

  const [selectedTask, setSelectedTask] =
    useState<MovementTask | null>(null);

  const [open, setOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  const pendingTasks = tasks.filter(
      task => task.status === "pending"
  );

  async function handleComplete() {
    if (!selectedTask) return;

    setCompleting(true);
    try {
      await completeMovementTask(selectedTask.id);
      router.refresh();
      setOpen(false);
      setSelectedTask(null);
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-sm">

        <div className="px-5 py-4 border-b border-border">

          <h2 className="font-semibold">
            Pending Inventory Tasks ({pendingTasks.length})
          </h2>

        </div>

        <div className="p-5 space-y-4">

          {pendingTasks.map((task) => (

            <MovementCard
              key={task.id}
              task={task}
              onView={() => {
                setSelectedTask(task);
                setOpen(true);
              }}
            />

          ))}

          {/* NOTE: was checking tasks.length === 0 before, which hid this
              message whenever any tasks existed at all, even if none were
              pending. Fixed to check pendingTasks. */}
          {pendingTasks.length === 0 && (

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
        onComplete={handleComplete}
        completing={completing}
      />
    </>
  );
}
