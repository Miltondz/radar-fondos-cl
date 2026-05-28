import { ArrowRight, Clock } from "lucide-react";
import { Fund, MiltonProfile } from "../types";
import { formatCLP, getNextDeadlines, isEligible } from "../utils";

interface SectionSummaryProps {
  type: "financiamiento" | "licitacion" | "hackaton";
  funds: Fund[];
  profile: MiltonProfile;
  onNavigate: () => void;
  accent: string;
  label: string;
  emoji: string;
}

export default function SectionSummary({
  type, funds, profile, onNavigate, accent, label, emoji,
}: SectionSummaryProps) {
  const typed = funds.filter(f => f.type === type);
  const top3 = getNextDeadlines(typed, profile, 3);
  const total = typed.filter(f => f.urgency !== "CLOSED").length;
  const eligibleCount = typed.filter(f => f.urgency !== "CLOSED" && isEligible(f, profile)).length;
  const totalAmount = typed
    .filter(f => f.urgency !== "CLOSED" && isEligible(f, profile))
    .reduce((sum, f) => sum + f.amountNumber, 0);

  return (
    <div className="bg-paper border-2 border-ink shadow-[3px_3px_0px_#1a1a1a] flex flex-col">
      {/* Header */}
      <div className={`${accent} text-white border-b-2 border-ink px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          <span className="font-mono font-black text-sm uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="bg-white/20 px-2 py-0.5 border border-white/30">{eligibleCount} elegibles</span>
          <span className="bg-white/20 px-2 py-0.5 border border-white/30">{total} activos</span>
        </div>
      </div>

      {/* Top 3 upcoming */}
      <div className="flex-1 divide-y divide-ink/10">
        {top3.length === 0 ? (
          <div className="p-4 text-center text-xs font-serif text-ink/50 italic">
            No hay convocatorias próximas con tu perfil actual.
          </div>
        ) : (
          top3.map(fund => (
            <div key={fund.id} className="px-4 py-3 flex items-center gap-3">
              <div className="shrink-0">
                <Clock className="h-3.5 w-3.5 text-ink/40" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-sans font-bold text-ink truncate">{fund.name}</p>
                <p className="text-[10px] font-mono text-ink/55">{fund.deadline}</p>
              </div>
              <span className="shrink-0 text-[10px] font-mono font-bold text-ink/70">
                {formatCLP(fund.amountNumber)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t-2 border-ink px-4 py-3 flex items-center justify-between bg-paper-dark/30">
        {totalAmount > 0 && (
          <span className="text-[10px] font-mono text-ink/60">
            Pot. elegible: <strong className="font-bold text-ink">{formatCLP(totalAmount)}</strong>
          </span>
        )}
        <button
          onClick={onNavigate}
          className="flex items-center gap-1.5 ml-auto text-[11px] font-mono font-bold uppercase text-ink hover:text-accent-blue transition-colors cursor-pointer"
        >
          Ver todas <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
