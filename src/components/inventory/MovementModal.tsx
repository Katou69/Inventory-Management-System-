"use client";

import Modal from "../ui/Modal";
import ModalFooter from "../ui/ModalFooter";

import type { MovementTask } from "@/types/inventory-movement";

interface Props {
  open: boolean;
  task: MovementTask | null;
  onClose: () => void;
  onComplete: () => void;
}

export default function MovementModal({
  open,
  task,
  onClose,
  onComplete,
}: Props) {
  if (!open || !task) return null;

  return (
    <Modal
      title="Inventory Movement Task"
      subtitle="Review the movement details before completing."
      onClose={onClose}
    >
      <div className="px-5 py-4 space-y-4">

        <InfoRow
          label="Product"
          value={task.productName}
        />

        <InfoRow
          label="Quantity"
          value={`${task.quantity} bottles`}
        />

        <InfoRow
          label="Move From"
          value={task.fromShelf}
        />

        <InfoRow
          label="Move To"
          value={task.toShelf}
        />

        <InfoRow
          label="Requested By"
          value={task.requestedBy}
        />

        <InfoRow
          label="Reason"
          value={task.reason}
        />

      </div>

      <ModalFooter
        onCancel={onClose}
        onConfirm={onComplete}
        confirmLabel="Complete Task"
      />
    </Modal>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}