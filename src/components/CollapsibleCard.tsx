import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Star, ExternalLink, Calendar, Building2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Fund, MiltonProfile } from "../types";
import { formatCLP, isEligible, daysUntil } from "../utils";

interface CollapsibleCardProps {
  fund: Fund;
  profile: MiltonProfile;
  isStarred: boolean;
  onToggleStar: (id: string) => void;
  onAddToStack?: (fund: Fund) => void;
  isInStack?: boolean;
}

const URGENCY_STYLES: Record<string, string> = {
  CRITICAL: "border-alert text-alert",
  HIGH: "border-warning text-warning",
  MEDIUM: "border-ink/40 text-ink/70",
  LOW: "border-ink/20 text-ink/50",
  CLOSED: "border-ink/20 text-ink/40",
};

const URGENCY_LABELS: Record<string, string> = {
  CRITICAL: "CRÍTICO",
  HIGH: "URGENTE",
  MEDIUM: "PRÓXIMO",
  LOW: "ABIERTO",
  CLOSED: "CERRADO",
};

const TYPE_ACCENT: Record<string, string> = {
  financiamiento: "border-l-accent-green",
  licitacion: "border-l-accent-blue",
  hackaton: "border-l-accent-purple",
};

export default function CollapsibleCard({
  fund,
  profile,
  isStarred,
  onToggleStar,
  onAddToStack,
  isInStack,
}: CollapsibleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const eligible = isEligible(fund, profile);
  const days = daysUntil(fund.deadlineISO);
  const isClosed = fund.urgency === "CLOSED";
  const accentBorder = TYPE_ACCENT[fund.type ?? "financiamiento"] ?? "border-l-ink/30";

  const urgencyClass = URGENCY_STYLES[fund.urgency] ?? URGENCY_STYLES.LOW;
  const urgencyLabel = URGENCY_LABELS[fund.urgency] ?? fund.urgency;

  return (
    <div
      className={`bg-paper border border-ink/30 border-l-4 ${accentBorder} shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.15)] transition-all hover:shadow-[2px_2px_0px_rgba(0,0,0,0.25)] ${isClosed ? "opacity-60" : ""}`}
    >
      {/* Header — always visible */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
        role="button"
        aria-expanded={expanded}
      >
        {/* Urgency badge */}
        <span className={`shrink-0 border px-1.5 py-0.5 text-[9px] font-mono font-black uppercase tracking-widest ${urgencyClass}`}>
          {days !== null && !isClosed && days <= 7
            ? `${days}d`
            : urgencyLabel}
        </span>

        {/* Fund name */}
        <div className="flex-1 min-w-0">
          <h3 className="font-sans font-bold text-sm text-ink truncate leading-tight">
            {fund.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-ink/60">{fund.entity || fund.organizer}</span>
            <span className="text-ink/30">·</span>
            <span className="text-[10px] font-mono font-bold text-ink/80">{formatCLP(fund.amountNumber)}</span>
          </div>
        </div>

        {/* Eligibility indicator */}
        <div className="shrink-0">
          {eligible ? (
            <CheckCircle2 className="h-4 w-4 text-safe" title="Elegible con tu perfil" />
          ) : (
            <XCircle className="h-4 w-4 text-ink/30" title="Requisitos faltantes" />
          )}
        </div>

        {/* Star */}
        <button
          onClick={e => { e.stopPropagation(); onToggleStar(fund.id); }}
          className={`shrink-0 cursor-pointer transition-colors p-0.5 ${isStarred ? "text-warning" : "text-ink/30 hover:text-warning"}`}
          title={isStarred ? "Quitar de interés" : "Marcar como interés"}
        >
          <Star className={`h-4 w-4 ${isStarred ? "fill-warning" : ""}`} />
        </button>

        {/* Expand arrow */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0 text-ink/40"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </div>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-ink/10 space-y-4">
              {/* Description */}
              <p className="text-xs font-serif text-ink/80 leading-relaxed">{fund.description}</p>

              {/* Key info grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="block text-[9px] font-mono font-bold uppercase text-ink/50 mb-0.5">Cierre</span>
                  <span className="font-sans font-semibold text-ink flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {fund.deadline}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-mono font-bold uppercase text-ink/50 mb-0.5">Entidad</span>
                  <span className="font-sans font-semibold text-ink flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {fund.entity || fund.organizer}
                  </span>
                </div>
                {fund.cofinancing && (
                  <div className="col-span-2">
                    <span className="block text-[9px] font-mono font-bold uppercase text-ink/50 mb-0.5">Cofinanciamiento</span>
                    <span className="font-sans text-ink/80">{fund.cofinancing}</span>
                  </div>
                )}
              </div>

              {/* Eligibility flags */}
              {!eligible && (
                <div className="bg-alert/8 border border-alert/30 p-3 space-y-1">
                  <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-alert">
                    <AlertTriangle className="h-3.5 w-3.5" /> Requisitos faltantes
                  </span>
                  <ul className="text-xs font-serif text-ink/75 space-y-0.5 ml-5 list-disc">
                    {fund.eligibilityGenderRequired && !profile.hasWoman && <li>Requiere socia fundadora mujer</li>}
                    {fund.requiresSpA && !profile.hasSpA && <li>Requiere SpA constituida</li>}
                    {fund.SIIRequired && !profile.hasSiiInitiated && <li>Requiere iniciación de actividades SII</li>}
                    {fund.eligibilitySalesRestricted && profile.hasSales && <li>Solo para empresas sin ventas previas</li>}
                  </ul>
                </div>
              )}

              {/* Requirements list */}
              {fund.requirements?.length > 0 && (
                <div>
                  <span className="block text-[9px] font-mono font-bold uppercase text-ink/50 mb-2">Requisitos</span>
                  <ul className="space-y-1">
                    {fund.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs font-serif text-ink/75">
                        <span className="text-ink/40 mt-0.5 shrink-0">—</span> {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tips */}
              {fund.tips && (
                <div className="bg-paper-dark/60 border-l-2 border-accent-blue p-3">
                  <span className="block text-[9px] font-mono font-bold uppercase text-accent-blue mb-1">Consejo</span>
                  <p className="text-xs font-serif text-ink/80 leading-relaxed">{fund.tips}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                {onAddToStack && !isClosed && (
                  <button
                    onClick={() => onAddToStack(fund)}
                    disabled={isInStack}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border text-[11px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      isInStack
                        ? "border-ink/30 text-ink/40 cursor-default"
                        : "border-ink bg-paper hover:bg-ink hover:text-paper shadow-[1.5px_1.5px_0px_#000] active:translate-y-[0.5px]"
                    }`}
                  >
                    <Star className="h-3 w-3" />
                    {isInStack ? "En portafolio" : "Agregar a portafolio"}
                  </button>
                )}
                {fund.url && (
                  <a
                    href={fund.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-ink/40 text-[11px] font-mono font-bold uppercase text-ink/70 hover:text-ink hover:border-ink transition-all"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" /> Ver convocatoria
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
