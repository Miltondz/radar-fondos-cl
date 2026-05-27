import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, CalendarDays, Copy, Check, BellRing, Sparkles, 
  Layers, UserCheck, ShieldCheck, Landmark, Coins, TrendingUp, Settings2, CalendarRange 
} from "lucide-react";
import { Fund, MiltonProfile } from "../types";
import { ALL_FUNDS } from "../data";
import { formatCLP, getGoogleCalendarUrl } from "../utils";
import DynamicCalendar from "./DynamicCalendar";
import Stacker from "./Stacker";
import MiltonOptimizer from "./MiltonOptimizer";

interface ViewLandingProps {
  profile: MiltonProfile;
  onProfileChange: (profile: MiltonProfile) => void;
  stackedFunds: Fund[];
  onAddToStack: (item: Fund) => void;
  onRemoveFromStack: (id: string) => void;
  onClearStack: () => void;
  onApplyPreset: (ids: string[]) => void;
}

export default function ViewLanding({
  profile,
  onProfileChange,
  stackedFunds,
  onAddToStack,
  onRemoveFromStack,
  onClearStack,
  onApplyPreset
}: ViewLandingProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<"optimizer" | "calendar" | "stacker">("optimizer");

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Extract critical pillars items
  const highlightedPillars = useMemo(() => {
    return [
      {
        title: "Pilar 1: Financiamiento Crítico",
        item: ALL_FUNDS.find((f) => f.id === "sercotec-abeja-2026")!,
        tag: "Convocatoria Activa",
        badgeColor: "bg-alert text-white border-ink",
        desc: "Línea rápida de capital semilla no reembolsable exclusivo para liderazgos femeninos."
      },
      {
        title: "Pilar 2: Licitación Referente",
        item: ALL_FUNDS.find((f) => f.id === "lic-isp-sistemas-informaticos")!,
        tag: "Referencia Mercado Público",
        badgeColor: "bg-accent-blue text-white",
        desc: "Licitación de sistemas informáticos del ISP — referente para contratos TI de gran escala en el Estado."
      },
      {
        title: "Pilar 3: Hackaton de Entrada",
        item: ALL_FUNDS.find((f) => f.id === "hack-academia-hacklab-2026")!,
        tag: "Abierto — Postula Ahora",
        badgeColor: "bg-accent-purple text-white",
        desc: "Competencia presencial en Santiago respaldada por Ciudad Emergente y Google con financiamiento real."
      }
    ].filter((p) => !!p.item);
  }, []);

  // Compute total accumulated stack potential
  const totalAmount = useMemo(() => {
    return stackedFunds.reduce((acc, fund) => {
      if (fund.id === "corfo-semilla-inicia-rm-2026" && profile.hasWoman) {
        return acc + 17000000; // Gender advantage increase
      }
      return acc + fund.amountNumber;
    }, 0);
  }, [stackedFunds, profile.hasWoman]);

  return (
    <div className="space-y-12" id="landing-overview-view">
      
      {/* =========================================================================
          EXECUTIVE KPI DASHBOARD: Rediseño limpio para evitar sobrecarga de información
          ========================================================================= */}
      <div className="bg-paper border-2 border-ink p-6 shadow-[4px_4px_0px_#000] relative overflow-hidden">
        {/* Subtle decorative line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-ink" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-ink/10 pb-4 mb-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink/50 bg-paper-dark px-2 py-0.5 border border-ink/10">RESUMEN EJECUTIVO</span>
            <h2 className="font-serif font-black text-2xl italic text-ink mt-1.5">Cuadro de Mando del Simulador</h2>
          </div>
          <div className="mt-2 md:mt-0 flex items-center gap-2 font-mono text-[10.5px] bg-[#fab1a0]/15 border border-[#fab1a0]/40 text-ink px-3 py-1.5 rounded">
            <span className="h-2 w-2 rounded-full bg-alert inline-block animate-ping" />
            <span>Actualización: <strong className="font-bold">CONVOCATORIAS ACTIVAS MAYO 2026</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* KPI 1: Perfil de Milton */}
          <div className="bg-paper-dark border border-ink/20 p-4 relative hover:border-ink/55 transition-all">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[9.5px] font-mono text-ink/65 uppercase tracking-wider">ESTADO DEL PERFIL</span>
              <UserCheck className="h-4 w-4 text-accent-green" />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink/75 font-serif italic">Socia Fundadora:</span>
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 border ${
                  profile.hasWoman ? "bg-safe/10 text-safe border-safe" : "bg-alert/10 text-alert border-alert"
                }`}>
                  {profile.hasWoman ? "ACTIVA ✅ (+3) " : "INACTIVA ❌"}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink/75 font-serif italic">Poder de Ventas:</span>
                <span className="font-mono text-[10.5px] text-ink font-bold">
                  {profile.hasSales ? "Facturando" : "Idea Inicial (Pre-revenue)"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-ink/75 font-serif italic">Estructura Corporativa:</span>
                <span className="font-mono text-[10.5px] text-ink font-bold">
                  {profile.hasSpA ? "Sociedad SpA" : "Persona Natural"}
                </span>
              </div>
            </div>
          </div>

          {/* KPI 2: Canasta Acumulada */}
          <div className="bg-paper-dark border border-ink/20 p-4 relative hover:border-ink/55 transition-all">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9.5px] font-mono text-ink/65 uppercase tracking-wider">CANASTA DE SINERGIAS</span>
              <Coins className="h-4 w-4 text-alert" />
            </div>
            
            <div className="mt-1">
              <span className="block text-[22px] font-mono font-black text-alert leading-none">
                {formatCLP(totalAmount)}
              </span>
              <p className="text-[11px] font-serif italic text-ink/70 mt-1.5">
                Acumulado garantizado con <strong className="font-mono text-ink font-bold">{stackedFunds.length}</strong> subsidios y retos agregados a tu Bolsa de fomento.
              </p>
            </div>
          </div>

          {/* KPI 3: Alertas de Convocatoria */}
          <div className="bg-paper-dark border border-ink/20 p-4 relative hover:border-ink/55 transition-all">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[9.5px] font-mono text-ink/65 uppercase tracking-wider">HITOS PRÓXIMOS</span>
              <TrendingUp className="h-4 w-4 text-accent-blue" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-alert inline-block" />
                <span className="text-xs font-serif text-ink leading-tight">
                  <strong>SERCOTEC Abeja</strong> cierra hoy <strong className="font-mono text-alert">27-Mayo-2026</strong>.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-warning inline-block" />
                <span className="text-xs font-serif text-ink leading-tight">
                  <strong>Semilla Inicia RM</strong> cierra el <strong className="font-mono text-ink">29-Mayo-2026</strong>.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE WORKSPACE TABS: Distribución estratégica de herramientas
          ========================================================================= */}
      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-mono uppercase font-bold text-ink/50 tracking-wider">PASO 2: HERRAMIENTAS DE CO-DIAGNÓSTICO ESTRATÉGICO</span>
          <h3 className="font-serif font-black text-3xl text-ink leading-tight mt-1">Plataforma Científica de Planificación</h3>
          <p className="text-sm font-serif italic text-ink/80 mt-1 max-w-2xl leading-relaxed">
            Hemos reorganizado las herramientas interactivas del simulador. Utiliza los selectores para enfocar tu trabajo sin saturación visual.
          </p>
        </div>

        {/* Tab Selection Row */}
        <div className="flex border-2 border-ink bg-paper p-1 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex-wrap md:flex-nowrap">
          <button
            onClick={() => setActiveTool("optimizer")}
            className={`flex-1 min-w-[150px] py-4 px-3 text-center text-xs font-mono font-black uppercase tracking-wider transition-all border-r border-ink/20 last:border-0 cursor-pointer flex items-center justify-center gap-2 ${
              activeTool === "optimizer" ? "bg-ink text-paper" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            <Settings2 className="h-4 w-4 shrink-0" />
            <span>Ajustar Perfil Milton</span>
          </button>
          
          <button
            onClick={() => setActiveTool("calendar")}
            className={`flex-1 min-w-[150px] py-4 px-3 text-center text-xs font-mono font-black uppercase tracking-wider transition-all border-r border-ink/20 last:border-0 cursor-pointer flex items-center justify-center gap-2 ${
              activeTool === "calendar" ? "bg-ink text-paper" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            <CalendarRange className="h-4 w-4 shrink-0" />
            <span>Agenda e Hitos Críticos</span>
          </button>

          <button
            onClick={() => setActiveTool("stacker")}
            className={`flex-1 min-w-[150px] py-4 px-3 text-center text-xs font-mono font-black uppercase tracking-wider transition-all border-r border-ink/20 last:border-0 cursor-pointer flex items-center justify-center gap-2 ${
              activeTool === "stacker" ? "bg-ink text-paper" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            <Layers className="h-4 w-4 shrink-0" />
            <span>Simulador de Sinergia (Stacker)</span>
          </button>
        </div>

        {/* Dynamic Display Target of Current Tool with clean transition */}
        <div className="border border-ink/15 bg-paper p-1 transition-all">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              className="w-full"
            >
              {activeTool === "optimizer" && (
                <div className="p-1 space-y-4">
                  <div className="bg-paper-dark/50 border-l-4 border-l-ink p-3 text-xs font-sans text-ink/75">
                    Modifica los switches de elegibilidad de Milton abajo para ver cómo impacta directamente todos los cálculos de elegibilidad del Radar.
                  </div>
                  <MiltonOptimizer profile={profile} onChange={onProfileChange} />
                </div>
              )}

              {activeTool === "calendar" && (
                <div className="p-1 space-y-4">
                  <div className="bg-paper-dark/50 border-l-4 border-l-ink p-3 text-xs font-sans text-ink/75">
                    Revisa las fechas límites de cierre. El calendario te permite añadir fondos directamente a tu pila de sinergias o registrar hitos directos en tu Google Calendar personal.
                  </div>
                  <div className="max-w-4xl mx-auto">
                    <DynamicCalendar onAddToStack={onAddToStack} stackedFunds={stackedFunds} />
                  </div>
                </div>
              )}

              {activeTool === "stacker" && (
                <div className="p-1 space-y-4">
                  <div className="bg-paper-dark/50 border-l-4 border-l-ink p-3 text-xs font-sans text-ink/75">
                    Carga combos pre-evaluados o arma tu propio portafolio. El sistema revisará en tiempo real el cumplimiento del reglamento chileno de incompatibilidad fiscal.
                  </div>
                  <Stacker
                    stackedFunds={stackedFunds}
                    onRemoveFromStack={onRemoveFromStack}
                    onClearStack={onClearStack}
                    hasWoman={profile.hasWoman}
                    onApplyPreset={onApplyPreset}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* =========================================================================
          PRIORITARY CHANNELS: Destacados del mes de Mayo
          ========================================================================= */}
      <div className="border-t-2 border-ink pt-10">
        <div className="flex items-center gap-3.5 mb-8">
          <div className="p-2 bg-alert/15 text-alert border border-alert shrink-0">
            <BellRing className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-ink/60">CONVOCATORIAS DE ALTA EXPOSICIÓN</span>
            <h4 className="font-serif font-black text-2xl text-ink leading-tight">
              Los Convocatorias Más Críticas de los 3 Pilares
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlightedPillars.map((p, index) => {
            const isStacked = stackedFunds.some((f) => f.id === p.item.id);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index }}
                className="bg-paper border-2 border-ink p-5 relative shadow-[3px_3px_0px_#000] flex flex-col justify-between hover:translate-y-[-1px] transition-all"
              >
                <div>
                  <div className="flex justify-between items-center gap-2 flex-wrap mb-4">
                    <span className="text-[10px] font-mono font-bold tracking-tight text-ink/65 uppercase bg-paper-dark border border-ink/10 px-1.5 py-0.5">
                      {p.title}
                    </span>
                    <span className={`px-2 py-0.5 text-[8.5px] font-mono font-bold uppercase ${p.badgeColor}`}>
                      {p.tag}
                    </span>
                  </div>

                  <h5 className="font-sans font-black text-base text-ink mb-2 leading-tight">
                    {p.item.name}
                  </h5>

                  <p className="text-xs font-serif text-ink/80 leading-relaxed mb-6">
                    {p.desc} {p.item.description}
                  </p>

                  <div className="space-y-2 border-t border-ink/10 pt-4">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-ink/50 font-medium">Monto Máximo:</span>
                      <span className="font-black text-alert">{formatCLP(p.item.amountNumber)}</span>
                    </div>
                    {p.item.chileCode && (
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-ink/50 font-medium">Código Ficha:</span>
                        <span className="font-bold flex items-center gap-1.5 bg-paper-dark border border-ink/15 px-1.5 py-0.5 text-[11px]">
                          {p.item.chileCode}
                          <button
                            onClick={() => handleCopyCode(p.item.chileCode || "", p.item.id)}
                            className="p-0.5 hover:text-alert transition-colors cursor-pointer shrink-0 text-ink/50 hover:text-ink"
                            title="Copiar Código"
                          >
                            {copiedId === p.item.id ? (
                              <Check className="h-3 w-3 text-safe" />
                            ) : (
                              <Copy className="h-2.5 w-2.5" />
                            )}
                          </button>
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-ink/50 font-medium font-bold">Fecha Límite:</span>
                      <span className="font-bold text-ink underline decoration-1">{p.item.deadline}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-ink/10 flex gap-2 items-center flex-wrap">
                  <button
                    onClick={() => onAddToStack(p.item)}
                    disabled={isStacked}
                    className={`flex-1 py-2 px-1 text-center text-[10.5px] font-mono font-bold uppercase border border-ink cursor-pointer transition-all ${
                      isStacked 
                        ? "bg-safe/10 border-safe text-safe cursor-default" 
                        : "bg-paper hover:bg-paper-dark text-ink shadow-[2.5px_2.5px_0px_#000] active:translate-y-[1px]"
                    }`}
                  >
                    {isStacked ? "✓ Stackeado" : "+ Stackear"}
                  </button>

                  <a
                    href={getGoogleCalendarUrl({
                      id: p.item.id,
                      name: p.item.name,
                      deadlineISO: p.item.deadlineISO || "2026-05-27",
                      description: p.item.description,
                      url: p.item.url,
                      chileCode: p.item.chileCode
                    })}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    className="py-2 px-3 text-center text-[10.5px] bg-paper hover:bg-paper-dark border border-ink text-ink font-mono font-bold uppercase shadow-[2.5px_2.5px_0px_#000] active:translate-y-[1px] inline-flex items-center justify-center gap-1"
                  >
                    <CalendarDays className="h-4 w-4 text-alert" />
                    Agendar
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
