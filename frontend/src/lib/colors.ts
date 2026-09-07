export const SUBJECT_COLORS = [
  { value: "#2563eb", label: "Blue" },
  { value: "#059669", label: "Green" },
  { value: "#d97706", label: "Amber" },
  { value: "#dc2626", label: "Red" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#db2777", label: "Pink" },
  { value: "#0891b2", label: "Cyan" },
  { value: "#475569", label: "Slate" },
] as const;

export function textOnColor(hex: string | null): string {
  if (!hex) return "text-gray-700";
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "text-gray-900" : "text-white";
}

export function backgroundColor(hex: string | null): { backgroundColor: string } {
  return { backgroundColor: hex ?? "#e2e8f0" };
}