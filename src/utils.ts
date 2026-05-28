import { Fund, MiltonProfile } from "./types";

/**
 * Utility functions for Radar Fondos CL
 */

export function isEligible(fund: Fund, profile: MiltonProfile): boolean {
  if (fund.eligibilityGenderRequired && !profile.hasWoman) return false;
  if (fund.requiresSpA && !profile.hasSpA) return false;
  if (fund.SIIRequired && !profile.hasSiiInitiated) return false;
  if (fund.eligibilitySalesRestricted && profile.hasSales) return false;
  return true;
}

export function daysUntil(isoDate?: string): number | null {
  if (!isoDate) return null;
  const target = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getNextDeadlines(funds: Fund[], profile: MiltonProfile, limit = 5): Fund[] {
  return funds
    .filter(f => f.urgency !== "CLOSED" && f.deadlineISO && isEligible(f, profile))
    .sort((a, b) => {
      const da = daysUntil(a.deadlineISO) ?? 999;
      const db = daysUntil(b.deadlineISO) ?? 999;
      return da - db;
    })
    .slice(0, limit);
}

export function computeNextAction(
  section: string,
  funds: Fund[],
  starredIds: string[],
  profile: MiltonProfile
): { fundId: string; fundName: string; reason: string; ctaLabel: string } | null {
  let candidates: Fund[] = [];
  if (section === "financiamientos") candidates = funds.filter(f => f.type === "financiamiento");
  else if (section === "licitaciones") candidates = funds.filter(f => f.type === "licitacion");
  else if (section === "hackatones") candidates = funds.filter(f => f.type === "hackaton");
  else candidates = funds;

  const eligible = candidates.filter(f => f.urgency !== "CLOSED" && isEligible(f, profile));
  if (!eligible.length) return null;

  // Prefer starred, then by urgency
  const urgencyOrder: Record<string, number> = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
  const sorted = [...eligible].sort((a, b) => {
    const aStarred = starredIds.includes(a.id) ? 0 : 1;
    const bStarred = starredIds.includes(b.id) ? 0 : 1;
    if (aStarred !== bStarred) return aStarred - bStarred;
    return (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9);
  });

  const top = sorted[0];
  const days = daysUntil(top.deadlineISO);
  const reason = days !== null && days <= 7
    ? `Cierra en ${days} día${days === 1 ? "" : "s"}`
    : top.urgency === "CRITICAL" ? "Urgencia crítica" : "Mayor relevancia para tu perfil";

  return { fundId: top.id, fundName: top.name, reason, ctaLabel: "Ver detalles" };
}

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
  const _now = new Date();
  const _tomorrow = new Date(_now);
  _tomorrow.setDate(_now.getDate() + 1);
  const _pad = (n: number) => String(n).padStart(2, "0");
  const _fmt = (d: Date) => `${d.getFullYear()}${_pad(d.getMonth() + 1)}${_pad(d.getDate())}`;
  let datePart = `${_fmt(_now)}/${_fmt(_tomorrow)}`;
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
