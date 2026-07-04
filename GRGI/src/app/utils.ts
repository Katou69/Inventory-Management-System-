const AVATAR_COLORS = ["#1A6B8A", "#E8830A", "#1A9B7A", "#7C3AED", "#DC2626", "#0891B2", "#059669", "#D97706", "#7E22CE", "#BE185D"];

export function initials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export function avatarColor(id: string): string {
  const n = parseInt(id.replace(/\D/g, "")) || 0;
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
