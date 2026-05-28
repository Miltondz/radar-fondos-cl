import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Fund } from "../types";

interface MiniCalendarProps {
  funds: Fund[];
  starredIds: string[];
  onNavigateToAgenda: () => void;
}

export default function MiniCalendar({ funds, starredIds, onNavigateToAgenda }: MiniCalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build dots map: day -> urgency (highest wins)
  const dotMap = useMemo(() => {
    const map: Record<number, "CRITICAL" | "HIGH" | "OTHER"> = {};
    funds.forEach(f => {
      if (!f.deadlineISO || f.urgency === "CLOSED") return;
      const d = new Date(f.deadlineISO);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const day = d.getDate();
      const cur = map[day];
      if (f.urgency === "CRITICAL") { map[day] = "CRITICAL"; }
      else if (f.urgency === "HIGH" && cur !== "CRITICAL") { map[day] = "HIGH"; }
      else if (!cur) { map[day] = "OTHER"; }
    });
    return map;
  }, [funds, year, month]);

  const starredDays = useMemo(() => {
    const set = new Set<number>();
    funds.forEach(f => {
      if (!f.deadlineISO || !starredIds.includes(f.id)) return;
      const d = new Date(f.deadlineISO);
      if (d.getFullYear() === year && d.getMonth() === month) {
        set.add(d.getDate());
      }
    });
    return set;
  }, [funds, starredIds, year, month]);

  const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const DAY_NAMES = ["D","L","M","X","J","V","S"];

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  // Cells: pad start + days
  const cells: (number | null)[] = [
    ...Array(firstDay === 0 ? 6 : firstDay - 1).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const DOT_COLORS: Record<string, string> = {
    CRITICAL: "bg-alert",
    HIGH: "bg-warning",
    OTHER: "bg-accent-blue",
  };

  return (
    <div className="bg-paper border-2 border-ink shadow-[3px_3px_0px_#1a1a1a] p-3 w-[220px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="text-ink/50 hover:text-ink cursor-pointer p-0.5 transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onNavigateToAgenda}
          className="flex items-center gap-1 text-[11px] font-mono font-black uppercase tracking-wider text-ink hover:text-accent-blue transition-colors cursor-pointer"
        >
          <Calendar className="h-3 w-3" />
          {MONTH_NAMES[month]} {year}
        </button>
        <button onClick={nextMonth} className="text-ink/50 hover:text-ink cursor-pointer p-0.5 transition-colors">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[9px] font-mono font-bold uppercase text-ink/40">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const dot = dotMap[day];
          const isStarred = starredDays.has(day);
          return (
            <button
              key={day}
              onClick={onNavigateToAgenda}
              className={`relative flex flex-col items-center justify-center h-7 w-full text-[11px] font-mono cursor-pointer transition-colors rounded-none
                ${isToday ? "bg-ink text-paper font-black" : "text-ink hover:bg-paper-dark"}
                ${isStarred && !isToday ? "font-bold text-warning" : ""}
              `}
            >
              {day}
              {dot && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-none ${DOT_COLORS[dot]}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-2 pt-2 border-t border-ink/10 flex flex-wrap gap-x-3 gap-y-0.5">
        <span className="flex items-center gap-1 text-[9px] font-mono text-ink/50">
          <span className="h-1.5 w-1.5 bg-alert inline-block" /> Crítico
        </span>
        <span className="flex items-center gap-1 text-[9px] font-mono text-ink/50">
          <span className="h-1.5 w-1.5 bg-warning inline-block" /> Urgente
        </span>
        <span className="flex items-center gap-1 text-[9px] font-mono text-ink/50">
          <span className="h-1.5 w-1.5 bg-accent-blue inline-block" /> Otro
        </span>
      </div>
    </div>
  );
}
