/**
 * Formats ISO/SQLite UTC dates into the user's exact local browser time and country format.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  try {
    const normalized = iso.endsWith("Z") || iso.includes("+") 
      ? iso 
      : iso.replace(" ", "T") + "Z";
    
    return new Date(normalized).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  } catch (e) {
    return String(iso);
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  try {
    const normalized = iso.endsWith("Z") || iso.includes("+") 
      ? iso 
      : iso.replace(" ", "T") + "Z";
    
    return new Date(normalized).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch (e) {
    return String(iso);
  }
}
