import { STATUS_CONFIG } from "../constants";

export default function Badge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: "bg-secondary text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
