import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarDays, Copy, Check, Layers, Settings2, CalendarRange,
  ArrowRight, Info, TrendingUp, Wallet, Printer, Clock
} from "lucide-react";
import { Fund, MiltonProfile } from "../types";
import { ALL_FUNDS } from "../data";
import { formatCLP, getGoogleCalendarUrl, isEligible, getNextDeadlines } from "../utils";
import { SECTION_COPY } from "../copy";
import DynamicCalendar from "./DynamicCalendar";
import Stacker from "./Stacker";
import MiltonOptimizer from "./MiltonOptimizer";
import SectionSummary from "./SectionSummary";
import MiniCalendar from "./MiniCalendar";
import NextActionBanner from "./NextActionBanner";

interface ViewLandingProps {
  profile: MiltonProfile;
  onProfileChange: (profile: MiltonProfile) => void;
  stackedFunds: Fund[];
  starredFunds: string[];
  onAddToStack: (item: Fund) => void;
  onRemoveFromStack: (id: string) => void;
  onClearStack: () => void;
  onApplyPreset: (ids: string[]) => void;
  onToggleStar: (id: string) => void;
  onNavigateTo: (tab: string) => void;
  recentFundIds?: string[];
  allFunds?: Fund[];
}

export default function ViewLanding({
  profile,
  onProfileChange,
  stackedFunds,
  starredFunds,
  onAddToStack,
  onRemoveFromStack,
  onClearStack,
  onApplyPreset,
  onToggleStar,
  onNavigateTo,
  recentFundIds = [],
  allFunds = ALL_FUNDS,
}: ViewLandingProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<"optimizer" | "calendar" | "stacker">("optimizer");
  const [showHelp, setShowHelp] = useState(false);

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const eligibleCount = useMemo(
    () => ALL_FUNDS.filter(f => f.urgency !== "CLOSED" && isEligible(f, profile)).length,
    [profile]
  );

  const totalEligibleAmount = useMemo(
    () => ALL_FUNDS.filter(f => f.urgency !== "CLOSED" && isEligible(f, profile))
      .reduce((s, f) => s + f.amountNumber, 0),
    [profile]
  );

  const stackAmount = useMemo(
    () => stackedFunds.reduce((acc, fund) => acc + fund.amountNumber, 0),
    [stackedFunds]
  );

  const nextDeadline = useMemo(
    () => getNextDeadlines(ALL_FUNDS, profile, 1)[0] ?? null,
    [profile]
  );

  const highlightedPillars = useMemo(() => {
    return [
      {
        title: "Financiamiento",
        item: ALL_FUNDS.find((f) => f.id === "sercotec-abeja-2026"),
        tag: "Convocatoria Activa",
        accentClass: "border-l-accent-green",
      },
      {
        title: "Licitación",
        item: ALL_FUNDS.find((f) => f.id === "lic-isp-sistemas-informaticos"),
        tag: "Mercado Público",
        accentClass: "border-l-accent-blue",
      },
      {
        title: "Hackatón",
        item: ALL_FUNDS.find((f) => f.id === "hack-academia-hacklab-2026"),
        tag: "Postula Ahora",
        accentClass: "border-l-accent-purple",
      },
    ].filter((p) => !!p.item) as { title: string; item: Fund; tag: string; accentClass: string }[];
  }, []);

  const copy = SECTION_COPY.landing;

  return (
    <div className="space-y-10" id="landing-overview-view">

      {/* ── NEXT ACTION BANNER ── */}
      <NextActionBanner
        section="landing"
        funds={ALL_FUNDS}
        starredIds={starredFunds}
        profile={profile}
      />

      {/* ── HERO + MINI CALENDAR ROW ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Hero card */}
        <div className="flex-1 bg-paper border-2 border-ink p-6 shadow-[4px_4px_0px_#000] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-ink" />
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink/50 block mb-1">
                Bienvenido · {new Date().toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
              </span>
              <h2 className="font-display text-3xl font-black text-ink uppercase leading-tight">
                {copy.title}
              </h2>
              <p className="text-sm font-serif text-ink/75 mt-2 leading-relaxed max-w-2xl">
                {copy.description}
              </p>
            </div>
            <button
              onClick={() => setShowHelp(s => !s)}
              className="shrink-0 p-1.5 text-ink/40 hover:text-ink transition-colors cursor-pointer mt-1"
              title="¿Cómo se usa?"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>

          {/* Help text */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-paper-dark border border-ink/20 p-4 mb-4 space-y-1.5">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink/60 mb-2">
                    Cómo usar esta página
                  </p>
                  {copy.helpItems?.map((item, i) => (
                    <p key={i} className="text-xs font-serif text-ink/75 flex items-start gap-2">
                      <span className="text-ink/40 mt-0.5 shrink-0">→</span> {item}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div className="bg-paper-dark border border-ink/20 p-3">
              <span className="block text-[9px] font-mono font-bold uppercase text-ink/50 mb-1">Fondos elegibles</span>
              <span className="text-2xl font-mono font-black text-safe leading-none">{eligibleCount}</span>
              <span className="text-[10px] font-mono text-ink/50 block mt-0.5">con tu perfil</span>
            </div>
            <div className="bg-paper-dark border border-ink/20 p-3">
              <span className="block text-[9px] font-mono font-bold uppercase text-ink/50 mb-1">Pot. total elegible</span>
              <span className="text-sm font-mono font-black text-alert leading-none">{formatCLP(totalEligibleAmount)}</span>
              <span className="text-[10px] font-mono text-ink/50 block mt-0.5">acumulable</span>
            </div>
            <div className="bg-paper-dark border border-ink/20 p-3">
              <span className="block text-[9px] font-mono font-bold uppercase text-ink/50 mb-1">Próx. cierre</span>
              {nextDeadline ? (
                <>
                  <span className="text-xs font-sans font-bold text-ink leading-tight block truncate">{nextDeadline.name}</span>
                  <span className="text-[10px] font-mono text-warning block mt-0.5">{nextDeadline.deadline}</span>
                </>
              ) : (
                <span className="text-xs font-mono text-ink/50">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Mini calendar */}
        <div className="shrink-0">
          <MiniCalendar
            funds={ALL_FUNDS}
            starredIds={starredFunds}
            onNavigateToAgenda={() => onNavigateTo("agenda")}
          />
        </div>
      </div>

      {/* ── SECTION SUMMARIES ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-black uppercase text-ink">
            Vista rápida de oportunidades
          </h3>
          <span className="text-[10px] font-mono text-ink/50">Filtrado por tu perfil</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SectionSummary
            type="financiamiento"
            funds={ALL_FUNDS}
            profile={profile}
            onNavigate={() => onNavigateTo("financiamientos")}
            accent="bg-accent-green"
            label="Subsidios"
            emoji="💰"
          />
          <SectionSummary
            type="licitacion"
            funds={ALL_FUNDS}
            profile={profile}
            onNavigate={() => onNavigateTo("licitaciones")}
            accent="bg-accent-blue"
            label="Licitaciones"
            emoji="🏛️"
          />
          <SectionSummary
            type="hackaton"
            funds={ALL_FUNDS}
            profile={profile}
            onNavigate={() => onNavigateTo("hackatones")}
            accent="bg-accent-purple"
            label="Hackatones"
            emoji="⚡"
          />
        </div>
      </div>

      {/* ── PORTAFOLIO Y HERRAMIENTAS ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-ink/60" />
          <div>
            <h3 className="font-display text-xl font-black uppercase text-ink leading-tight">
              Mi Portafolio
            </h3>
            <p className="text-xs font-serif text-ink/60">
              {stackedFunds.length} fondos · {formatCLP(stackAmount)} potencial
            </p>
          </div>
        </div>

        {/* Tool tabs */}
        <div className="flex border-2 border-ink bg-paper shadow-[3px_3px_0px_#000] flex-wrap md:flex-nowrap">
          {[
            { key: "optimizer", icon: Settings2, label: "Perfil & Elegibilidad" },
            { key: "calendar", icon: CalendarRange, label: "Agenda" },
            { key: "stacker", icon: Layers, label: "Portafolio Stack" },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTool(t.key as typeof activeTool)}
                className={`flex-1 min-w-[140px] py-3 px-3 text-center text-[11px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer flex items-center justify-center gap-2 ${
                  activeTool === t.key ? "bg-ink text-paper" : "bg-paper hover:bg-paper-dark text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="border border-ink/15 bg-paper">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTool === "optimizer" && (
                <div className="p-4 space-y-4">
                  <p className="bg-paper-dark border-l-4 border-l-ink px-3 py-2 text-xs font-serif text-ink/70">
                    Actualiza los switches según el estado legal y comercial real de tu empresa. Esto filtra los fondos en todas las secciones.
                  </p>
                  <MiltonOptimizer profile={profile} onChange={onProfileChange} />
                </div>
              )}
              {activeTool === "calendar" && (
                <div className="p-4 space-y-4">
                  <p className="bg-paper-dark border-l-4 border-l-ink px-3 py-2 text-xs font-serif text-ink/70">
                    Cierres de postulación del mes. Haz clic en un evento para agregarlo al portafolio o exportarlo a Google Calendar.
                  </p>
                  <div className="max-w-4xl mx-auto">
                    <DynamicCalendar onAddToStack={onAddToStack} stackedFunds={stackedFunds} />
                  </div>
                </div>
              )}
              {activeTool === "stacker" && (
                <div className="p-4 space-y-4">
                  <p className="bg-paper-dark border-l-4 border-l-ink px-3 py-2 text-xs font-serif text-ink/70">
                    Arma tu portafolio de fondos compatibles. El sistema verifica si puedes combinarlos según normativa chilena de concurrencia.
                  </p>
                  <Stacker
                    stackedFunds={stackedFunds}
                    onRemoveFromStack={onRemoveFromStack}
                    onClearStack={onClearStack}
                    profile={profile}
                    onApplyPreset={onApplyPreset}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── CONVOCATORIAS DESTACADAS ── */}
      <div className="border-t-2 border-ink pt-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-ink/60" />
            <h3 className="font-display text-xl font-black uppercase text-ink">Convocatorias destacadas</h3>
          </div>
          <button
            onClick={() => onNavigateTo("financiamientos")}
            className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-ink/60 hover:text-ink transition-colors cursor-pointer"
          >
            Ver todas <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {highlightedPillars.map((p, index) => {
            const isStacked = stackedFunds.some((f) => f.id === p.item.id);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index }}
                className={`bg-paper border-2 border-ink border-l-4 ${p.accentClass} p-4 shadow-[2px_2px_0px_#000] flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-mono font-bold uppercase text-ink/50">{p.title}</span>
                    <span className="text-[9px] font-mono font-bold uppercase bg-ink text-paper px-2 py-0.5">{p.tag}</span>
                  </div>
                  <h4 className="font-sans font-black text-sm text-ink mb-2 leading-tight">{p.item.name}</h4>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-ink/50">Monto:</span>
                      <span className="font-bold text-alert">{formatCLP(p.item.amountNumber)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink/50">Cierre:</span>
                      <span className="font-bold text-ink">{p.item.deadline}</span>
                    </div>
                    {p.item.chileCode && (
                      <div className="flex justify-between items-center">
                        <span className="text-ink/50">Código:</span>
                        <span className="font-bold flex items-center gap-1 text-[11px]">
                          {p.item.chileCode}
                          <button
                            onClick={() => handleCopyCode(p.item.chileCode!, p.item.id)}
                            className="p-0.5 hover:text-accent-blue transition-colors cursor-pointer text-ink/50"
                          >
                            {copiedId === p.item.id ? <Check className="h-3 w-3 text-safe" /> : <Copy className="h-2.5 w-2.5" />}
                          </button>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-ink/10">
                  <button
                    onClick={() => onAddToStack(p.item)}
                    disabled={isStacked}
                    className={`flex-1 py-1.5 text-[11px] font-mono font-bold uppercase border cursor-pointer transition-all ${
                      isStacked
                        ? "border-safe/40 text-safe/70 cursor-default"
                        : "border-ink bg-paper hover:bg-ink hover:text-paper shadow-[1.5px_1.5px_0px_#000] active:translate-y-[0.5px]"
                    }`}
                  >
                    {isStacked ? "✓ En stack" : "+ Stack"}
                  </button>
                  <a
                    href={getGoogleCalendarUrl({
                      id: p.item.id,
                      name: p.item.name,
                      deadlineISO: p.item.deadlineISO || "",
                      description: p.item.description,
                      url: p.item.url,
                      chileCode: p.item.chileCode,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2.5 border border-ink/40 text-[11px] font-mono font-bold uppercase text-ink/60 hover:text-ink hover:border-ink transition-all flex items-center gap-1"
                  >
                    <CalendarDays className="h-3 w-3" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── RECENT HISTORY + EXPORT ── */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">

        {/* Recent history */}
        {recentFundIds.length > 0 && (
          <div className="flex-1 bg-paper border-2 border-ink p-5 shadow-[3px_3px_0px_#000]">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-ink/60" />
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-ink/60">Historial Reciente</span>
            </div>
            <div className="space-y-2">
              {recentFundIds.slice(0, 6).map(id => {
                const fund = allFunds.find(f => f.id === id);
                if (!fund) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 py-1.5 border-b border-ink/10 last:border-0"
                  >
                    <span className={`shrink-0 w-1.5 h-1.5 ${fund.urgency === "CRITICAL" ? "bg-alert" : fund.urgency === "HIGH" ? "bg-warning" : fund.urgency === "CLOSED" ? "bg-ink/30" : "bg-safe"}`} />
                    <div className="flex-1 min-w-0">
                      <span className="block font-mono font-bold text-[11px] text-ink truncate">{fund.name}</span>
                      <span className="block font-mono text-[9px] text-ink/50 truncate">{fund.entity} · {fund.deadline}</span>
                    </div>
                    <button
                      onClick={() => onNavigateTo(fund.type === "licitacion" ? "licitaciones" : fund.type === "hackaton" ? "hackatones" : "financiamientos")}
                      className="shrink-0 px-2 py-0.5 border border-ink/30 text-[9px] font-mono text-ink/60 hover:border-ink hover:text-ink transition-colors cursor-pointer"
                    >
                      Ver
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Export PDF button */}
        <div className="shrink-0">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-3 bg-paper border-2 border-ink font-mono font-black text-xs uppercase tracking-wide shadow-[3px_3px_0px_#000] hover:bg-paper-dark hover:translate-y-[-1px] active:translate-y-[0.5px] transition-all cursor-pointer print:hidden"
          >
            <Printer className="h-4 w-4" />
            Exportar Portafolio PDF
          </button>
          <p className="text-[9px] font-mono text-ink/40 mt-1.5 max-w-[180px] leading-normal">
            Imprime o guarda como PDF el dashboard completo
          </p>
        </div>

      </div>

    </div>
  );
}
