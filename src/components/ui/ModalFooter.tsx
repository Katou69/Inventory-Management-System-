export default function ModalFooter({ 
  onCancel, 
  onConfirm, 
  confirmLabel, 
  disabled, 
  loading, 
  danger 
}: { 
  onCancel: () => void; 
  onConfirm: () => void; 
  confirmLabel: string; 
  disabled?: boolean; 
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex gap-3 px-5 py-4 border-t border-border">
      <button 
        onClick={onCancel} 
        disabled={loading}
        className="flex-1 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40"
      >
        Cancel
      </button>
      <button 
        onClick={onConfirm} 
        disabled={disabled || loading} 
        className={`flex-1 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 ${
          danger 
            ? "bg-red-600 text-white" 
            : "bg-primary text-primary-foreground"
        }`}
      >
        {loading ? "Loading..." : confirmLabel}
      </button>
    </div>
  );
}
