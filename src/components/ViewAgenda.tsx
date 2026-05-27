import { useState, useMemo, type ReactNode } from "react";
import {
  Calendar, Filter, ExternalLink, CalendarDays, CheckCircle2, AlertTriangle,
  ChevronLeft, ChevronRight, List, LayoutGrid, Columns
} from "lucide-react";
import { Fund, MiltonProfile } from "../types";
import { ALL_FUNDS } from "../data";
import { formatCLP, getGoogleCalendarUrl } from "../utils";
import CalendarButton from "./CalendarButton";

type CalView = "lista" | "mensual" | "semanal";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface ViewAgendaProps {
  profile: MiltonProfile;
  onAddToStack: (fund: Fund) => void;
  stackedFunds: Fund[];
}

export default function ViewAgenda({ profile, onAddToStack, stackedFunds }: ViewAgendaProps) {
  const today = useMemo(() => new Date(), []);
  const [calView, setCalView] = useState<CalView>("lista");
  const [showTypes, setShowTypes] = useState<Record<string, boolean>>({
    financiamiento: true,
    licitacion: true,
    hackaton: true,
  });
  const [stackedOnly, setStackedOnly] = useState(false);
  const [showClosed, setShowClosed] = useState(false);

  // Monthly state
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  // Weekly state
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(today));

  // ---- helpers ----
  const computeEligibility = (fund: Fund) => {
    if (fund.eligibilityGenderRequired && !profile.hasWoman) return false;
    if (fund.requiresSpA && !profile.hasSpA) return false;
    if (fund.SIIRequired && !profile.hasSiiInitiated) return false;
    if (fund.eligibilitySalesRestricted && profile.hasSales) return false;
    return true;
  };

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

  // ---- filtered funds (shared across all views) ----
  const filteredFunds = useMemo(() => {
    return ALL_FUNDS.filter(f => {
      if (!showTypes[f.type || "financiamiento"]) return false;
      if (stackedOnly && !stackedFunds.some(s => s.id === f.id)) return false;
      if (!showClosed && f.urgency === "CLOSED") return false;
      return true;
    });
  }, [showTypes, stackedOnly, showClosed, stackedFunds]);

  // ---- list view data ----
  const sortedFunds = useMemo(() =>
    [...filteredFunds].sort((a, b) => {
      if (!a.deadlineISO && !b.deadlineISO) return 0;
      if (!a.deadlineISO) return 1;
      if (!b.deadlineISO) return -1;
      return a.deadlineISO.localeCompare(b.deadlineISO);
    }), [filteredFunds]);

  const grouped = useMemo(() => {
    const g: Record<string, Fund[]> = {};
    sortedFunds.forEach(f => {
      let key = "Sin fecha definida";
      if (f.deadlineISO) {
        const [y, m] = f.deadlineISO.split("-");
        const raw = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString("es-CL", { month: "long", year: "numeric" });
        key = raw.charAt(0).toUpperCase() + raw.slice(1);
      }
      if (!g[key]) g[key] = [];
      g[key].push(f);
    });
    return g;
  }, [sortedFunds]);

  // ---- monthly view data ----
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const startOffset = (new Date(calYear, calMonth, 1).getDay() + 6) % 7; // Mon=0
  const monthName = (() => {
    const raw = new Date(calYear, calMonth, 1).toLocaleDateString("es-CL", { month: "long", year: "numeric" });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  })();

  const fundsByDay = useMemo(() => {
    const map: Record<number, Fund[]> = {};
    const ys = String(calYear);
    const ms = String(calMonth + 1).padStart(2, "0");
    filteredFunds.forEach(f => {
      if (f.deadlineISO) {
        const [fy, fm, fd] = f.deadlineISO.split("-");
        if (fy === ys && fm === ms) {
          const d = parseInt(fd);
          if (!map[d]) map[d] = [];
          map[d].push(f);
        }
      }
    });
    return map;
  }, [filteredFunds, calYear, calMonth]);

  const selectedDayFunds = selectedDay ? (fundsByDay[selectedDay] || []) : [];

  const calGridCells = useMemo(() => {
    const cells: { day: number | null; funds: Fund[] }[] = [];
    for (let i = 0; i < startOffset; i++) cells.push({ day: null, funds: [] });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, funds: fundsByDay[d] || [] });
    return cells;
  }, [daysInMonth, startOffset, fundsByDay]);

  function prevMonth() {
    setSelectedDay(null);
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    setSelectedDay(null);
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }

  // ---- weekly view data ----
  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    }), [weekStart]);

  const fundsByIso = useMemo(() => {
    const map: Record<string, Fund[]> = {};
    filteredFunds.forEach(f => {
      if (f.deadlineISO) {
        const key = f.deadlineISO.substring(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(f);
      }
    });
    return map;
  }, [filteredFunds]);

  const weekLabel = (() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
    return `${fmt(weekStart)} – ${fmt(end)} ${end.getFullYear()}`;
  })();

  function prevWeek() {
    setWeekStart(w => { const d = new Date(w); d.setDate(w.getDate() - 7); return d; });
  }
  function nextWeek() {
    setWeekStart(w => { const d = new Date(w); d.setDate(w.getDate() + 7); return d; });
  }

  // compact fund card — reused in monthly detail + weekly
  const FundCard = ({ fund, compact = false }: { fund: Fund; compact?: boolean }) => {
    const isStacked = stackedFunds.some(s => s.id === fund.id);
    const eligible = computeEligibility(fund);
    const isClosed = fund.urgency === "CLOSED";
    return (
      <div className={`bg-paper border border-ink/40 p-2.5 space-y-1.5 shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.7)] ${isClosed ? "opacity-55" : ""}`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`px-1.5 py-0.5 text-[8px] font-mono font-black uppercase ${typeColor(fund.type)}`}>
            {fund.type === "licitacion" ? "Lic" : fund.type === "hackaton" ? "Hack" : "Sub"}
          </span>
          {fund.urgency === "CRITICAL" && (
            <span className="text-[8px] font-mono font-black uppercase bg-alert text-white px-1 border border-ink animate-pulse">⚠</span>
          )}
          <span className={`h-1.5 w-1.5 rounded-none shrink-0 ${urgencyDot(fund.urgency)}`} />
        </div>
        <p className={`font-sans font-bold text-ink leading-tight line-clamp-2 ${compact ? "text-[11px]" : "text-xs"}`}>
          {fund.name}
        </p>
        {!compact && (
          <p className="font-mono font-black text-[11px] text-alert">{formatCLP(fund.amountNumber)}</p>
        )}
        <div className="flex items-center gap-1.5 pt-1 border-t border-ink/10 flex-wrap">
          <button
            onClick={() => onAddToStack(fund)}
            disabled={isStacked || isClosed}
            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase border cursor-pointer transition-all ${
              isStacked ? "bg-safe/10 border-safe text-safe cursor-default"
              : isClosed ? "bg-ink/10 border-ink/20 text-ink/25 cursor-not-allowed"
              : "bg-paper border-ink text-ink hover:bg-paper-dark"
            }`}
          >
            {isStacked ? "✓" : "+"}
          </button>
          <a href={fund.url} target="_blank" rel="noopener noreferrer"
            className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase border border-ink bg-paper text-ink hover:bg-paper-dark inline-flex items-center cursor-pointer">
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
          <span className={`ml-auto text-[8.5px] font-mono font-bold ${
            isClosed ? "text-ink/40" : eligible ? "text-safe" : "text-alert"
          }`}>
            {isClosed ? "Cerrado" : eligible ? "✓ Ok" : "✗ Req"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div id="agenda-timeline-tab" className="space-y-5">

      {/* Filter Controls */}
      <div className="bg-paper border-2 border-ink p-4 shadow-[3px_3px_0px_rgba(0,0,0,1)] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-ink/60 shrink-0" />
          {(["financiamiento", "licitacion", "hackaton"] as const).map(t => (
            <button key={t}
              onClick={() => setShowTypes(prev => ({ ...prev, [t]: !prev[t] }))}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer ${typeToggleColor(t)}`}
            >
              {t === "financiamiento" ? "💰 Subsidios" : t === "licitacion" ? "🏛️ Licitaciones" : "⚡ Hackatones"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-[10px] font-mono font-bold uppercase text-ink/70 select-none">
            <input type="checkbox" checked={stackedOnly} onChange={e => setStackedOnly(e.target.checked)} className="accent-ink" />
            Solo Portafolio
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-[10px] font-mono font-bold uppercase text-ink/70 select-none">
            <input type="checkbox" checked={showClosed} onChange={e => setShowClosed(e.target.checked)} className="accent-ink" />
            Ver Cerrados
          </label>
        </div>
      </div>

      {/* View switcher */}
      <div className="flex border-2 border-ink bg-paper shadow-[3px_3px_0px_rgba(0,0,0,1)]">
        {([
          { key: "lista", label: "📋 Lista / Timeline", icon: <List className="h-3.5 w-3.5" /> },
          { key: "mensual", label: "📅 Vista Mensual", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
          { key: "semanal", label: "📆 Vista Semanal", icon: <Columns className="h-3.5 w-3.5" /> },
        ] as { key: CalView; label: string; icon: ReactNode }[]).map(v => (
          <button key={v.key}
            onClick={() => setCalView(v.key)}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-2 text-[10.5px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer border-r border-ink/20 last:border-0 ${
              calView === v.key ? "bg-ink text-paper" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            {v.icon}
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 font-mono text-[10px] text-ink/55">
        <span>{filteredFunds.length} convocatorias</span>
        <span>·</span>
        <span>{stackedFunds.length} en portafolio</span>
        {stackedOnly && <span className="font-bold text-alert">· solo portafolio</span>}
      </div>

      {/* =========================================================
          VISTA LISTA / TIMELINE
      ========================================================= */}
      {calView === "lista" && (
        <>
          {Object.keys(grouped).length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-ink bg-paper-dark/30">
              <Calendar className="mx-auto h-12 w-12 text-ink/40" />
              <h5 className="font-sans font-bold text-base text-ink mt-3">No hay convocatorias en la agenda</h5>
              <p className="text-xs text-ink/65 mt-1">Ajusta los filtros o desactiva "Solo Portafolio".</p>
            </div>
          ) : (
            <div className="space-y-10">
              {(Object.entries(grouped) as [string, Fund[]][]).map(([monthLabel, funds]) => (
                <div key={monthLabel}>
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
                        <div key={fund.id}
                          className={`bg-paper border border-ink p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-[2px_2px_0px_rgba(0,0,0,0.8)] transition-colors hover:border-ink/60 ${isStacked ? "border-l-4 border-l-safe" : ""} ${isClosed ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-center gap-3 shrink-0 md:w-32">
                            <span className={`h-2.5 w-2.5 shrink-0 ${urgencyDot(fund.urgency)}`} />
                            <div>
                              <span className="font-mono text-[10px] font-bold text-ink/70 block">{fund.deadlineISO || "—"}</span>
                              <span className="font-mono text-[9px] text-ink/50">{fund.deadline}</span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-1.5 py-0.5 text-[8.5px] font-mono font-black uppercase ${typeColor(fund.type)}`}>
                                {fund.type === "licitacion" ? "Licitación" : fund.type === "hackaton" ? "Hackathon" : "Subsidio"}
                              </span>
                              <span className="text-[10px] font-mono text-ink/60 bg-paper-dark px-1.5 py-0.5 border border-ink/20">
                                {fund.entity || fund.organizer || "—"}
                              </span>
                              {fund.urgency === "CRITICAL" && (
                                <span className="text-[8.5px] font-mono font-black uppercase bg-alert text-white px-1.5 border border-ink animate-pulse">⚠️ CRÍTICO</span>
                              )}
                              {fund.urgency === "HIGH" && (
                                <span className="text-[8.5px] font-mono font-black uppercase bg-warning text-ink px-1.5 border border-ink">⚡ ALTA</span>
                              )}
                            </div>
                            <h5 className="font-sans font-bold text-sm text-ink leading-tight">{fund.name}</h5>
                            <p className="text-[11px] font-serif text-ink/70 leading-snug line-clamp-2">{fund.description}</p>
                            {fund.chileCode && (
                              <span className="font-mono text-[10px] bg-paper-dark border border-ink/20 px-1.5 py-0.5 text-ink/70">ID: {fund.chileCode}</span>
                            )}
                          </div>

                          <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
                            <span className="font-mono font-black text-[15px] text-alert">{formatCLP(fund.amountNumber)}</span>
                            <span className={`px-2 py-0.5 text-[9px] font-mono font-bold border flex items-center gap-1 ${
                              isClosed ? "bg-ink/15 border-ink/30 text-ink/50"
                              : eligible ? "bg-safe/10 border-safe/40 text-safe"
                              : "bg-alert/10 border-alert/40 text-alert"
                            }`}>
                              {isClosed ? "Cerrado" : eligible
                                ? <><CheckCircle2 className="h-3 w-3" />Elegible</>
                                : <><AlertTriangle className="h-3 w-3" />Requisitos</>
                              }
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              <button onClick={() => onAddToStack(fund)} disabled={isStacked || isClosed} title={isStacked ? "Ya en portafolio" : "Agregar"}
                                className={`px-2.5 py-1 text-[9.5px] font-mono font-bold uppercase border cursor-pointer transition-all shrink-0 ${
                                  isStacked ? "bg-safe/10 border-safe text-safe cursor-default"
                                  : isClosed ? "bg-ink/10 border-ink/20 text-ink/30 cursor-not-allowed"
                                  : "bg-paper border-ink text-ink hover:bg-paper-dark shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-0.5px]"
                                }`}>
                                {isStacked ? "✓ Stack" : "+ Stack"}
                              </button>
                              <a href={fund.url} target="_blank" rel="noopener noreferrer"
                                className="px-2.5 py-1 text-[9.5px] font-mono font-bold uppercase border border-ink bg-paper text-ink hover:bg-paper-dark shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-0.5px] inline-flex items-center gap-1 cursor-pointer transition-all">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <a href={getGoogleCalendarUrl({ id: fund.id, name: fund.name, deadlineISO: fund.deadlineISO || "2026-05-27", description: fund.description, url: fund.url, chileCode: fund.chileCode })}
                                target="_blank" rel="noopener noreferrer"
                                className="px-2.5 py-1 text-[9.5px] font-mono font-bold uppercase border border-ink bg-paper text-ink hover:bg-paper-dark shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-0.5px] inline-flex items-center gap-1 cursor-pointer transition-all">
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
        </>
      )}

      {/* =========================================================
          VISTA MENSUAL
      ========================================================= */}
      {calView === "mensual" && (
        <div className="bg-paper border-2 border-ink shadow-[4px_4px_0px_#1a1a1a] p-5 space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between border-b border-ink/20 pb-3">
            <h4 className="font-serif font-black text-xl italic text-ink">{monthName}</h4>
            <div className="flex items-center gap-1.5">
              <button onClick={prevMonth}
                className="p-1.5 border border-ink bg-paper hover:bg-paper-dark cursor-pointer transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); setSelectedDay(today.getDate()); }}
                className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase border border-ink bg-paper hover:bg-paper-dark cursor-pointer transition-colors">
                Hoy
              </button>
              <button onClick={nextMonth}
                className="p-1.5 border border-ink bg-paper hover:bg-paper-dark cursor-pointer transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 text-center font-mono text-[10px] font-bold text-ink/65 border-b border-ink/10 pb-1">
            {WEEKDAYS.map(d => <div key={d}>{d}</div>)}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 select-none">
            {calGridCells.map((cell, idx) => {
              const isToday = calYear === today.getFullYear() && calMonth === today.getMonth() && cell.day === today.getDate();
              const isSelected = cell.day === selectedDay;
              const hasFunds = cell.funds.length > 0;
              return (
                <div key={idx}
                  onClick={() => cell.day && setSelectedDay(isSelected ? null : cell.day)}
                  className={`min-h-[58px] border relative p-1 flex flex-col justify-between transition-all ${
                    !cell.day ? "bg-paper-dark/15 border-transparent pointer-events-none"
                    : isSelected ? "bg-ink text-paper border-ink shadow-[2px_2px_0px_rgba(0,0,0,0.2)] cursor-pointer font-black"
                    : isToday ? "bg-alert/10 border-2 border-alert text-ink cursor-pointer"
                    : "bg-paper hover:bg-paper-dark border-ink/30 text-ink cursor-pointer"
                  }`}
                >
                  {cell.day && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-mono font-bold leading-none ${isToday && !isSelected ? "text-alert font-black" : ""}`}>
                          {cell.day}
                          {isToday && <span className="text-[7px] block text-alert font-black uppercase">hoy</span>}
                        </span>
                        {hasFunds && (
                          <span className={`h-2 w-2 rounded-none ${isSelected ? "bg-paper" : "bg-alert"}`} />
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1 overflow-hidden">
                        {cell.funds.slice(0, 2).map((f, i) => (
                          <div key={i} className={`text-[7px] px-1 truncate font-mono font-black uppercase text-center ${
                            isSelected ? "bg-white/20 text-white" : typeColor(f.type)
                          }`}>
                            {f.type === "licitacion" ? "Lic" : f.type === "hackaton" ? "Hack" : "Sub"}
                          </div>
                        ))}
                        {cell.funds.length > 2 && (
                          <span className="text-[6.5px] font-mono font-black text-center">+{cell.funds.length - 2}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected day detail */}
          <div className="border-t-2 border-dashed border-ink/25 pt-4">
            {selectedDay ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2 w-2 bg-alert" />
                  <h5 className="font-mono text-[11px] font-bold uppercase text-ink">
                    {selectedDayFunds.length > 0
                      ? `${selectedDayFunds.length} convocatoria${selectedDayFunds.length > 1 ? "s" : ""} el ${selectedDay} de ${monthName}`
                      : `Sin cierres el ${selectedDay} de ${monthName}`
                    }
                  </h5>
                </div>
                {selectedDayFunds.length === 0 ? (
                  <div className="py-5 text-center border border-dashed border-ink/20 bg-paper-dark/30">
                    <span className="font-serif italic text-xs text-ink/55">Sin convocatorias para este día.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedDayFunds.map(f => (
                      <div key={f.id}><FundCard fund={f} /></div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="py-6 text-center border border-dashed border-ink/15 bg-paper-dark/25">
                <span className="font-serif italic text-xs text-ink/55">Selecciona un día del calendario para ver sus cierres.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          VISTA SEMANAL
      ========================================================= */}
      {calView === "semanal" && (
        <div className="bg-paper border-2 border-ink shadow-[4px_4px_0px_#1a1a1a] p-5 space-y-4">
          {/* Week navigation */}
          <div className="flex items-center justify-between border-b border-ink/20 pb-3">
            <h4 className="font-serif font-black text-lg italic text-ink">{weekLabel}</h4>
            <div className="flex items-center gap-1.5">
              <button onClick={prevWeek}
                className="p-1.5 border border-ink bg-paper hover:bg-paper-dark cursor-pointer transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setWeekStart(getMondayOfWeek(today))}
                className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase border border-ink bg-paper hover:bg-paper-dark cursor-pointer transition-colors">
                Esta Semana
              </button>
              <button onClick={nextWeek}
                className="p-1.5 border border-ink bg-paper hover:bg-paper-dark cursor-pointer transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 7-column week grid */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, i) => {
              const iso = isoDate(day);
              const dayFunds = fundsByIso[iso] || [];
              const isToday = iso === isoDate(today);
              const isPast = day < today && !isToday;
              return (
                <div key={i} className={`flex flex-col border ${isToday ? "border-alert border-2" : "border-ink/30"} ${isPast ? "opacity-55" : ""}`}>
                  {/* Day header */}
                  <div className={`px-2 py-2 text-center border-b ${isToday ? "bg-alert text-white border-alert" : "bg-paper-dark border-ink/20"}`}>
                    <span className={`block text-[10px] font-mono font-bold uppercase ${isToday ? "text-white" : "text-ink/65"}`}>
                      {WEEKDAYS[i]}
                    </span>
                    <span className={`block text-base font-sans font-black leading-none mt-0.5 ${isToday ? "text-white" : "text-ink"}`}>
                      {day.getDate()}
                    </span>
                    <span className={`block text-[9px] font-mono ${isToday ? "text-white/80" : "text-ink/45"}`}>
                      {day.toLocaleDateString("es-CL", { month: "short" })}
                    </span>
                    {isToday && <span className="text-[8px] font-mono font-black uppercase text-white/90 block mt-0.5">HOY</span>}
                  </div>
                  {/* Fund list for this day */}
                  <div className="flex-1 p-1.5 space-y-1.5 bg-paper-dark/20 min-h-[80px]">
                    {dayFunds.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-[9px] font-mono text-ink/30 text-center">—</span>
                      </div>
                    ) : (
                      dayFunds.map(f => <div key={f.id}><FundCard fund={f} compact /></div>)
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Week summary */}
          {(() => {
            const weekFunds = weekDays.flatMap(d => fundsByIso[isoDate(d)] || []);
            return weekFunds.length > 0 ? (
              <div className="border-t border-ink/20 pt-3 font-mono text-[10.5px] text-ink/60 flex items-center gap-3 flex-wrap">
                <span className="font-bold text-ink">{weekFunds.length} cierres esta semana:</span>
                {weekFunds.map(f => (
                  <span key={f.id} className={`px-1.5 py-0.5 text-[9px] font-mono font-black uppercase ${typeColor(f.type)}`}>
                    {f.name.split(" ").slice(0, 3).join(" ")}
                  </span>
                ))}
              </div>
            ) : (
              <div className="border-t border-ink/20 pt-3 font-mono text-[10.5px] text-ink/45 text-center">
                Sin cierres de convocatorias esta semana con los filtros activos.
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
