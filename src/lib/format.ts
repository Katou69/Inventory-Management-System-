const AVATAR_COLORS = ["#1A6B8A", "#E8830A", "#1A9B7A", "#7C3AED", "#DC2626", "#0891B2", "#059669", "#D97706", "#7E22CE", "#BE185D"];

export function initials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export function avatarColor(id: string): string {
  const n = parseInt(id.replace(/\D/g, "")) || 0;
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

/** Single place to change the currency symbol app-wide. */
export const CURRENCY = "$";

export function money(value: number): string {
  return `${CURRENCY}${value.toLocaleString()}`;
}

/** Compact form for axis ticks and tooltips: $1.2M, $540k, $800. */
export function moneyCompact(value: number): string {
  if (value >= 1_000_000) return `${CURRENCY}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${CURRENCY}${(value / 1_000).toFixed(0)}k`;
  return `${CURRENCY}${value.toLocaleString()}`;
}
