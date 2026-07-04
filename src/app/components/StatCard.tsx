import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  label, value, sub, trend, icon: Icon, accent
}: {
  label: string; value: string; sub: string;
  trend: "up" | "down" | "neutral"; icon: React.ElementType; accent?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent || "#1A6B8A"}18` }}>
          <Icon className="w-4 h-4" style={{ color: accent || "#1A6B8A" }} />
        </div>
      </div>
      <p className="font-display text-3xl font-bold mb-2">{value}</p>
      <p className={`text-xs flex items-center gap-1 ${trend === "up" ? "text-emerald-600 dark:text-emerald-400" : trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
        {trend === "up" && <TrendingUp className="w-3 h-3" />}
        {trend === "down" && <TrendingDown className="w-3 h-3" />}
        {sub}
      </p>
    </div>
  );
}
