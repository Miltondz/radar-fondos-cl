import { useState, useMemo } from "react";
import { Calendar, Filter, ExternalLink, CalendarDays, CheckCircle2, AlertTriangle } from "lucide-react";
import { Fund, MiltonProfile } from "../types";
import { ALL_FUNDS } from "../data";
import { formatCLP, getGoogleCalendarUrl } from "../utils";
import CalendarButton from "./CalendarButton";

interface ViewAgendaProps {
  profile: MiltonProfile;
  onAddToStack: (fund: Fund) => void;
  stackedFunds: Fund[];
}

export default function ViewAgenda({ profile, onAddToStack, stackedFunds }: ViewAgendaProps) {
  const [showTypes, setShowTypes] = useState<Record<string, boolean>>({
    financiamiento: true,
    licitacion: true,
    hackaton: true,
  });
  const [stackedOnly, setStackedOnly] = useState(false);
  const [showClosed, setShowClosed] = useState(false);

  const computeEligibility = (fund: Fund) => {
    if (fund.eligibilityGenderRequired && !profile.hasWoman) return false;
    if (fund.requiresSpA && !profile.hasSpA) return false;
    if (fund.SIIRequired && !profile.hasSiiInitiated) return false;
    if (fund.eligibilitySalesRestricted && profile.hasSales) return false;
    return true;
  };

  const sortedFunds = useMemo(() => {
    return ALL_FUNDS
      .filter(f => {
        const t = f.type || "financiamiento";
        if (!showTypes[t]) return false;
        if (stackedOnly && !stackedFunds.some(s => s.id === f.id)) return false;
        if (!showClosed && f.urgency === "CLOSED") return false;
        return true;
      })
      .sort((a, b) => {
        if (!a.deadlineISO && !b.deadlineISO) return 0;
        if (!a.deadlineISO) return 1;
        if (!b.deadlineISO) return -1;
        return a.deadlineISO.localeCompare(b.deadlineISO);
      });
  }, [showTypes, stackedOnly, showClosed, stackedFunds]);

  const grouped = useMemo(() => {
    const groups: Record<string, Fund[]> = {};
    sortedFunds.forEach(f => {
      let key = "Sin fecha definida";
      if (f.deadlineISO) {
        const [y, m] = f.deadlineISO.split("-");
        const d = new Date(parseInt(y), parseInt(m) - 1, 1);
        const raw = d.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
        key = raw.charAt(0).toUpperCase() + raw.slice(1);
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    return groups;
  }, [sortedFunds]);

  const typeColor = (type?: string) => {
    if (type === "licitacion") return "bg-accent-blue text-white";
    if (type === "hackaton") return "bg-accent-purple text-white";
    return "bg-accent-green text-white";
  };

  const typeToggleColor = (type: string) => {
    if (!showTypes[type]) return "bg-paper text-ink/50 hover:bg-paper-dark border-ink/40";
    if (type === "licitacion") return "bg-accent-blue text-white border-ink";
    if (type === "hackaton") return "bg-accent-purple text-white border-ink";
    return "bg-accent-green text-white border-ink";
  };

  const urgencyDot = (urgency: string) => {
    if (urgency === "CRITICAL") return "bg-alert";
    if (urgency === "HIGH") return "bg-warning";
    if (urgency === "CLOSED") return "bg-ink/25";
    return "bg-safe";
  };

  return (
    <div id="agenda-timeline-tab" className="space-y-6">

      {/* Filter Controls */}
      <div className="bg-paper border-2 border-ink p-5 shadow-[3px_3px_0px_rgba(0,0,0,1)] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-ink/60 shrink-0" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink/70 shrink-0">Tipos:</span>
          {(["financiamiento", "licitacion", "hackaton"] as const).map(t => (
            <button
              key={t}
              onClick={() => setShowTypes(prev => ({ ...prev, [t]: !prev[t] }))}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer ${typeToggleColor(t)}`}
            >
              {t === "financiamiento" ? "💰 Subsidios" : t === "licitacion" ? "🏛️ Licitaciones" : "⚡ Hackatones"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-[10.5px] font-mono font-bold uppercase tracking-wider text-ink/70 select-none">
            <input
              type="checkbox"
              checked={stackedOnly}
              onChange={e => setStackedOnly(e.target.checked)}
              className="accent-ink"
            />
            Solo Mi Portafolio
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-[10.5px] font-mono font-bold uppercase tracking-wider text-ink/70 select-none">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={e => setShowClosed(e.target.checked)}
              className="accent-ink"
            />
            Ver Cerrados
          </label>
        </div>
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-3 font-mono text-[10.5px] text-ink/60">
        <span>{sortedFunds.length} convocatorias en vista</span>
        <span>·</span>
        <span>{stackedFunds.length} en portafolio</span>
        {stackedOnly && <span className="font-bold text-alert">· Sólo portafolio activo</span>}
      </div>

      {/* Timeline */}
      {Object.keys(grouped).length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-ink bg-paper-dark/30">
          <Calendar className="mx-auto h-12 w-12 text-ink/40" />
          <h5 className="font-sans font-bold text-base text-ink mt-3">No hay convocatorias en la agenda</h5>
          <p className="text-xs text-ink/65 mt-1 max-w-sm mx-auto">
            Ajusta los filtros de tipo o desactiva "Solo Mi Portafolio".
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {(Object.entries(grouped) as [string, Fund[]][]).map(([monthLabel, funds]) => (
            <div key={monthLabel}>
              {/* Month separator */}
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-ink/20" />
                <span className="font-mono text-[11px] font-black uppercase tracking-widest bg-ink text-paper px-3 py-1 border border-ink">
                  {monthLabel}
                </span>
                <div className="h-px flex-1 bg-ink/20" />
              </div>

              <div className="space-y-3">
                {funds.map(fund => {
                  const isStacked = stackedFunds.some(s => s.id === fund.id);
                  const eligible = computeEligibility(fund);
                  const isClosed = fund.urgency === "CLOSED";
                  return (
                    <div
                      key={fund.id}
                      className={`bg-paper border border-ink p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-[2px_2px_0px_rgba(0,0,0,0.8)] transition-colors hover:border-ink/60 ${
                        isStacked ? "border-l-4 border-l-safe" : ""
                      } ${isClosed ? "opacity-60" : ""}`}
                    >
                      {/* Date + urgency */}
                      <div className="flex items-center gap-3 shrink-0 md:w-32">
                        <span className={`h-2.5 w-2.5 shrink-0 ${urgencyDot(fund.urgency)}`} />
                        <div>
                          <span className="font-mono text-[10px] font-bold text-ink/70 block">
                            {fund.deadlineISO || "—"}
                          </span>
                          <span className="font-mono text-[9px] text-ink/50">{fund.deadline}</span>
                        </div>
                      </div>

                      {/* Type + Name + Description */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-1.5 py-0.5 text-[8.5px] font-mono font-black uppercase ${typeColor(fund.type)}`}>
                            {fund.type === "licitacion" ? "Licitación" : fund.type === "hackaton" ? "Hackathon" : "Subsidio"}
                          </span>
                          <span className="text-[10px] font-mono text-ink/60 bg-paper-dark px-1.5 py-0.5 border border-ink/20">
                            {fund.entity || fund.organizer || "—"}
                          </span>
                          {fund.urgency === "CRITICAL" && (
                            <span className="text-[8.5px] font-mono font-black uppercase bg-alert text-white px-1.5 py-0.5 border border-ink animate-pulse">
                              ⚠️ CRÍTICO
                            </span>
                          )}
                          {fund.urgency === "HIGH" && (
                            <span className="text-[8.5px] font-mono font-black uppercase bg-warning text-ink px-1.5 py-0.5 border border-ink">
                              ⚡ ALTA PRIORIDAD
                            </span>
                          )}
                        </div>
                        <h5 className="font-sans font-bold text-sm text-ink leading-tight">{fund.name}</h5>
                        <p className="text-[11px] font-serif text-ink/70 leading-snug line-clamp-2">{fund.description}</p>
                        {fund.chileCode && (
                          <span className="font-mono text-[10px] bg-paper-dark border border-ink/20 px-1.5 py-0.5 text-ink/70">
                            ID: {fund.chileCode}
                          </span>
                        )}
                      </div>

                      {/* Amount + Eligibility + Actions */}
                      <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
                        <span className="font-mono font-black text-[15px] text-alert">{formatCLP(fund.amountNumber)}</span>

                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold border ${
                          isClosed
                            ? "bg-ink/15 border-ink/30 text-ink/50"
                            : eligible
                            ? "bg-safe/10 border-safe/40 text-safe"
                            : "bg-alert/10 border-alert/40 text-alert"
                        }`}>
                          {isClosed ? "Cerrado" : eligible
                            ? <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Elegible</span>
                            : <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Requisitos</span>
                          }
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <button
                            onClick={() => onAddToStack(fund)}
                            disabled={isStacked || isClosed}
                            title={isStacked ? "Ya en portafolio" : "Agregar al portafolio"}
                            className={`px-2.5 py-1 text-[9.5px] font-mono font-bold uppercase border cursor-pointer shrink-0 transition-all ${
                              isStacked
                                ? "bg-safe/10 border-safe text-safe cursor-default"
                                : isClosed
                                ? "bg-ink/10 border-ink/20 text-ink/30 cursor-not-allowed"
                                : "bg-paper border-ink text-ink hover:bg-paper-dark shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-0.5px] active:translate-y-[0.5px]"
                            }`}
                          >
                            {isStacked ? "✓ Stack" : "+ Stack"}
                          </button>
                          <a
                            href={fund.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Ir al sitio oficial"
                            className="px-2.5 py-1 text-[9.5px] font-mono font-bold uppercase border border-ink bg-paper text-ink hover:bg-paper-dark shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-0.5px] active:translate-y-[0.5px] inline-flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <a
                            href={getGoogleCalendarUrl({
                              id: fund.id,
                              name: fund.name,
                              deadlineISO: fund.deadlineISO || "2026-05-27",
                              description: fund.description,
                              url: fund.url,
                              chileCode: fund.chileCode
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Agregar a Google Calendar"
                            className="px-2.5 py-1 text-[9.5px] font-mono font-bold uppercase border border-ink bg-paper text-ink hover:bg-paper-dark shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-0.5px] active:translate-y-[0.5px] inline-flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <CalendarDays className="h-3 w-3 text-alert" />
                          </a>
                          <CalendarButton item={fund} className="px-2.5 py-1 text-[9.5px]" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
