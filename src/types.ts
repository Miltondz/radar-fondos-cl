/**
 * Types for Radar Fondos CL Application
 */

export enum FundStatus {
  TODAY = "🔴 HOY",
  TOMORROW = "🔴 MAÑANA",
  THREE_DAYS = "🔴 3 DÍAS",
  UPCOMING = "🟡 Próximo",
  OPEN = "🟢 Abierto",
  PERIODIC = "🟢 Periódico",
  VERIFY = "🟡 Verificar",
  CLOSED = "⭕ Cerrado",
  RECURRENT = "🟢 Recurrente",
  ALWAYS = "🟢 Siempre",
  PENDING_OPENING = "🔵 Por abrir"
}

export enum Entity {
  CORFO = "CORFO",
  SERCOTEC = "SERCOTEC",
  STARTUP_CHILE = "Startup Chile",
  ANID = "ANID",
  BANCO_ESTADO = "BancoEstado"
}

export interface Fund {
  id: string;
  name: string;
  entity: Entity | string; // Allow general strings for custom organizers as well
  amount: string;
  amountNumber: number; // For calculations and visual stack-building
  deadline: string;
  status: FundStatus;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "CLOSED" | "LOW";
  category: "Seed" | "Growth" | "Innovation" | "Credit" | "R&D" | string;
  description: string;
  cofinancing: string;
  requirements: string[];
  eligibilityGenderRequired: boolean; // Needs female on team
  eligibilitySalesRestricted: boolean; // Needs previous sales or does not permit sales
  SIIRequired: boolean; // Needs active SII ID initiation
  requiresSpA: boolean; // Must have SpA
  miltonAplica: string;
  tips: string;
  url: string;
  referenceUrlText: string;
  type?: "financiamiento" | "licitacion" | "hackaton";
  chileCode?: string; // Codigo de licitacion o ID de Hackaton
  organizer?: string; // Organismo convocante
  deadlineISO?: string; // ISO date layout e.g. 2026-05-27
  address?: string; // Dirección física del organismo o sede del evento
}

export interface MiltonProfile {
  hasWoman: boolean;
  hasSpA: boolean;
  hasSales: boolean;
  hasSiiInitiated: boolean;
}

export interface RoadmapStep {
  id: string;
  timeframe: "ESTA_SEMANA" | "JUNIO_2026" | "JULIO_AGOSTO_2026" | "NOVIEMBRE_2026";
  dateText: string;
  title: string;
  desc: string;
  isUrgent: boolean;
  color: string;
}

export interface DocRequirement {
  id: string;
  title: string;
  desc: string;
  isSpecialForkForSpA: boolean;
}
