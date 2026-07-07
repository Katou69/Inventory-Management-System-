export default function ModalFooter({ onCancel, onConfirm, confirmLabel, disabled }: { onCancel: () => void; onConfirm: () => void; confirmLabel: string; disabled?: boolean }) {
  return (
    <div className="flex gap-3 px-5 py-4 border-t border-border">
      <button onClick={onCancel} className="flex-1 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors">Cancel</button>
      <button onClick={onConfirm} disabled={disabled} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
        {confirmLabel}
      </button>
    </div>
  );
}
