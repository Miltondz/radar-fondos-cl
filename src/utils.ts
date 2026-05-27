/**
 * Utility functions for Radar Fondos CL
 */

/**
 * Formats a CLP monetary value.
 * e.g., 15000000 -> "$15.000.000"
 */
export function formatCLP(amount: number): string {
  if (amount === 0) return "Instrumento No Monetario / Línea de Crédito";
  return `$${amount.toLocaleString("es-CL")}`;
}

/**
 * Helper to generate a Google Calendar event template link
 * based on a deadline date, title, and link.
 */
export function getGoogleCalendarUrl(item: {
  id: string;
  name: string;
  deadlineISO: string;
  description: string;
  url: string;
  chileCode?: string;
}): string {
  const baseCalUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
  const title = encodeURIComponent(`Cierre: ${item.name} ${item.chileCode ? `[${item.chileCode}]` : ""}`);
  
  // Format dates: YYYYMMDD/YYYYMMDD for whole-day events
  // Let's use the provided deadlineISO, e.g., "2026-05-27" -> "20260527/20260528"
  let datePart = "20260527/20260528";
  if (item.deadlineISO) {
    const cleanDate = item.deadlineISO.replace(/-/g, "");
    if (cleanDate.length === 8) {
      const year = parseInt(cleanDate.substring(0, 4));
      const month = parseInt(cleanDate.substring(4, 6)) - 1; // 0-indexed
      const dateVal = parseInt(cleanDate.substring(6, 8));
      
      const eventDate = new Date(year, month, dateVal);
      const nextDay = new Date(year, month, dateVal + 1);
      
      const pad = (num: number) => String(num).padStart(2, "0");
      const d1 = `${eventDate.getFullYear()}${pad(eventDate.getMonth() + 1)}${pad(eventDate.getDate())}`;
      const d2 = `${nextDay.getFullYear()}${pad(nextDay.getMonth() + 1)}${pad(nextDay.getDate())}`;
      datePart = `${d1}/${d2}`;
    }
  }
  
  const detailsStr = `Recordatorio de cierre para ${item.name}.\n\nCódigo: ${item.chileCode || "No aplica"}\nDescripción: ${item.description}\n\nPaso estratégico: Verifica tu kit de documentos e inicia postulaciones.\nEnlace oficial: ${item.url}`;
  const details = encodeURIComponent(detailsStr);
  const location = encodeURIComponent("Portal Gubernamental convocante, Chile");
  
  return `${baseCalUrl}&text=${title}&dates=${datePart}&details=${details}&location=${location}&sf=true&output=xml`;
}
