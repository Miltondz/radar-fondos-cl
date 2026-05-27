import { useState, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Copy, Check, FileText, Gift, Award, Plus, CalendarDays } from "lucide-react";
import { Fund } from "../types";
import { ALL_FUNDS } from "../data";
import { getGoogleCalendarUrl, formatCLP } from "../utils";
import CalendarButton from "./CalendarButton";

interface DynamicCalendarProps {
  onAddToStack: (item: Fund) => void;
  stackedFunds: Fund[];
}

export default function DynamicCalendar({ onAddToStack, stackedFunds }: DynamicCalendarProps) {
  // Current month displayed: 4 = May, 5 = June 2026
  const [currentMonth, setCurrentMonth] = useState<4 | 5>(4); 
  const [selectedDay, setSelectedDay] = useState<number | null>(27); // Default to today's date May 27, 2026
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const monthName = currentMonth === 4 ? "Mayo 2026" : "Junio 2026";

  // Pre-calculated dates details for Mayo 2026 (Starts on Friday, 31 days)
  // June 2026 (Starts on Monday, 30 days)
  const daysInMonth = currentMonth === 4 ? 31 : 30;
  const startOffset = currentMonth === 4 ? 4 : 0; // index of starting day (0 = Monday, 4 = Friday)

  // Map dates in month to items
  const itemsByDay = useMemo(() => {
    const mapping: Record<number, Fund[]> = {};
    const yearStr = "2026";
    const monthStr = String(currentMonth + 1).padStart(2, "0");

    ALL_FUNDS.forEach((item) => {
      if (item.deadlineISO) {
        const parts = item.deadlineISO.split("-");
        // parts[0] is year, parts[1] is month, parts[2] is day
        if (parts[0] === yearStr && parts[1] === monthStr) {
          const d = parseInt(parts[2]);
          if (!mapping[d]) {
            mapping[d] = [];
          }
          mapping[d].push(item);
        }
      }
    });
    return mapping;
  }, [currentMonth]);

  // Combine headers
  const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // Grid builder
  const gridCells = useMemo(() => {
    const cells = [];
    
    // Add padded empty cells
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, items: [] as Fund[] });
    }
    
    // Add real days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        items: itemsByDay[d] || []
      });
    }
    
    return cells;
  }, [daysInMonth, startOffset, itemsByDay]);

  // Selected cell items
  const selectedItems = useMemo(() => {
    if (!selectedDay) return [];
    return itemsByDay[selectedDay] || [];
  }, [selectedDay, itemsByDay]);

  const getCategoryColor = (type?: string) => {
    if (type === "licitacion") return "bg-accent-blue text-white";
    if (type === "hackaton") return "bg-accent-purple text-white";
    return "bg-accent-green text-white"; // default financiamiento
  };

  const getCategoryBorder = (type?: string) => {
    if (type === "licitacion") return "border-accent-blue/50";
    if (type === "hackaton") return "border-accent-purple/50";
    return "border-accent-green/50";
  };

  return (
    <div className="bg-paper border-2 border-ink p-5 shadow-[4px_4px_0px_#1a1a1a] h-full flex flex-col justify-between" id="dynamic-calendar-widget">
      <div>
        <div className="flex items-center justify-between border-b border-ink/20 pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-ink" />
            <div>
              <span className="block text-[9px] font-mono font-bold tracking-widest text-alert uppercase">Agenda Estratégica</span>
              <h4 className="font-serif font-black text-xl italic text-ink leading-none">Calendario de Postulaciones</h4>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setCurrentMonth((prev) => (prev === 5 ? 4 : 5));
                setSelectedDay((prev) => (prev ? (prev > 30 ? 30 : prev) : null));
              }}
              className="p-1 border border-ink bg-paper hover:bg-paper-dark transition-colors cursor-pointer"
              title="Mes Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-xs font-bold uppercase border border-ink bg-ink text-paper px-2 py-1 select-none">
              {monthName}
            </span>
            <button
              onClick={() => {
                setCurrentMonth((prev) => (prev === 4 ? 5 : 4));
                setSelectedDay((prev) => (prev ? (prev > 30 ? 30 : prev) : null));
              }}
              className="p-1 border border-ink bg-paper hover:bg-paper-dark transition-colors cursor-pointer"
              title="Mes Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 text-center font-mono text-[10px] font-bold text-ink/70 mt-3 border-b border-ink/10 pb-1">
          {WEEKDAYS.map((day, ix) => (
            <div key={ix}>{day}</div>
          ))}
        </div>

        {/* Calendar Grid cells */}
        <div className="grid grid-cols-7 mt-1.5 gap-1 select-none">
          {gridCells.map((cell, index) => {
            const isSelected = selectedDay === cell.day;
            const hasDeadlines = cell.items.length > 0;
            const isToday = currentMonth === 4 && cell.day === 27; // May 27 modeled as "Today" in dataset context

            return (
              <div
                key={index}
                onClick={() => cell.day && setSelectedDay(cell.day)}
                className={`min-h-[52px] border relative p-1 cursor-pointer transition-all flex flex-col justify-between ${
                  !cell.day 
                    ? "bg-paper-dark/20 border-transparent cursor-default pointer-events-none" 
                    : isSelected
                      ? "bg-ink text-paper border-ink shadow-[2px_2px_0px_rgba(0,0,0,0.15)] font-black"
                      : isToday
                        ? "bg-alert/10 border-2 border-alert text-ink"
                        : "bg-paper hover:bg-paper-dark border-ink/40 text-ink"
                }`}
              >
                {cell.day && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-mono font-bold ${isToday && !isSelected ? "text-alert font-black" : ""}`}>
                        {cell.day}
                        {isToday && <span className="text-[7px] uppercase font-mono block text-alert leading-none font-bold">HOY</span>}
                      </span>
                      {hasDeadlines && (
                        <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-paper" : "bg-alert"}`} />
                      )}
                    </div>
                    {/* Tiny micro label indicator inside cell to improve readability */}
                    <div className="flex flex-col gap-0.5 mt-1 overflow-hidden">
                      {cell.items.slice(0, 2).map((item, key) => (
                        <div 
                          key={key} 
                          className={`text-[7px] px-1 truncate font-sans uppercase font-bold text-center select-none ${
                            isSelected ? "bg-white/20 text-white" : getCategoryColor(item.type)
                          }`}
                        >
                          {item.type === "licitacion" ? "Lic" : item.type === "hackaton" ? "Hack" : "Fod"}
                        </div>
                      ))}
                      {cell.items.length > 2 && (
                        <span className="text-[6px] font-mono text-center font-extrabold">+ {cell.items.length - 2}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Date detail sidebar panel below calendar */}
      <div className="mt-4 border-t-2 border-dashed border-ink/30 pt-4" id="calendar-focused-item-details">
        {selectedDay ? (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="h-2 w-2 bg-alert shrink-0" />
              <h5 className="font-mono text-[10.5px] uppercase font-bold text-ink">
                Hitos y Cierres del {selectedDay} de {monthName}:
              </h5>
            </div>

            {selectedItems.length === 0 ? (
              <div className="py-5 text-center bg-paper-dark/40 border border-ink/15 border-dashed">
                <span className="font-serif italic text-xs text-ink/70">No hay convocatorias u obligaciones registradas para esta fecha.</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar">
                {selectedItems.map((item) => {
                  const isStacked = stackedFunds.some((f) => f.id === item.id);
                  return (
                    <div 
                      key={item.id} 
                      className={`p-3 border-l-4 ${getCategoryBorder(item.type)} border border-ink/40 bg-paper-dark shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.1)] flex flex-col justify-between gap-2.5`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className={`px-1.5 py-0.5 text-[8px] font-mono uppercase font-black tracking-wide ${getCategoryColor(item.type)}`}>
                            {item.type === "licitacion" ? "Licitación" : item.type === "hackaton" ? "Hackathon" : "Subsidio Estatal"}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-ink/80">
                            {formatCLP(item.amountNumber || 0)}
                          </span>
                        </div>

                        <h6 className="font-sans font-bold text-xs text-ink mt-1">
                          {item.name}
                        </h6>

                        {/* Copy Code Feature */}
                        {item.chileCode && (
                          <div className="mt-1.5 flex items-center gap-1 text-[9px] font-mono text-ink/75 bg-paper px-1.5 py-0.5 border border-ink/15 w-max">
                            <span className="font-bold">ID: {item.chileCode}</span>
                            <button
                              onClick={() => handleCopyCode(item.chileCode || "", item.id)}
                              className="p-0.5 hover:text-alert transition-colors cursor-pointer shrink-0"
                              title="Copiar Código"
                            >
                              {copiedId === item.id ? (
                                <Check className="h-2.5 w-2.5 text-safe" />
                              ) : (
                                <Copy className="h-2.5 w-2.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 border-t border-ink/10 pt-2 flex-wrap">
                        {/* Add to pile */}
                        <button
                          onClick={() => onAddToStack(item)}
                          disabled={isStacked}
                          className={`px-2 py-1 text-[9.5px] font-mono font-bold uppercase cursor-pointer border shrink-0 border-ink ${
                            isStacked 
                              ? "bg-safe/15 border-safe text-safe" 
                              : "bg-paper text-ink hover:bg-paper-dark shadow-[1px_1px_0px_rgba(0,0,0,1)] hover:translate-y-[-0.5px]"
                          }`}
                        >
                          {isStacked ? "✓ Agregado" : "+ Stackear"}
                        </button>

                        {/* Google Calendar Link */}
                        <a
                          href={getGoogleCalendarUrl({
                            id: item.id,
                            name: item.name,
                            deadlineISO: item.deadlineISO || "2026-05-27",
                            description: item.description,
                            url: item.url,
                            chileCode: item.chileCode
                          })}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          rel="noopener noreferrer"
                          className="px-2 py-1 text-[9.5px] font-mono font-bold uppercase bg-paper border border-ink text-ink hover:bg-paper-dark shadow-[1px_1px_0px_rgba(0,0,0,1)] hover:translate-y-[-0.5px] inline-flex items-center gap-1"
                          title="Crear borrador de hito rápido por enlace standard"
                        >
                          <CalendarDays className="h-3 w-3 inline text-alert" />
                          Borrador
                        </a>

                        <CalendarButton item={item} className="px-2 py-1 text-[9.5px]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center bg-paper-dark border border-dashed border-ink/20">
            <span className="font-serif italic text-xs text-ink/70">Selecciona algún día para ver cierres en detalle.</span>
          </div>
        )}
      </div>
    </div>
  );
}
