import { useState } from "react";
import { motion } from "motion/react";
import {
  Calendar, ChevronRight, Clock, Check, ListTodo, Trophy, Rocket, Info,
  Target, ArrowRight
} from "lucide-react";
import { ROADMAP_STEPS } from "../data";
import { SECTION_COPY } from "../copy";

interface PlanDeAccionProps {
  completedSteps: string[];
  onToggleStep: (id: string) => void;
}

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  "setup-legal": { label: "Setup Legal", color: "bg-accent-blue" },
  "documentacion": { label: "Documentación", color: "bg-accent-purple" },
  "postulacion": { label: "Postulación", color: "bg-accent-green" },
  "seguimiento": { label: "Seguimiento", color: "bg-warning" },
};

const TIMEFRAME_CONFIG: {
  id: "ESTA_SEMANA" | "JUNIO_2026" | "JULIO_AGOSTO_2026" | "NOVIEMBRE_2026";
  label: string;
  shortLabel: string;
}[] = [
  { id: "ESTA_SEMANA", label: "Urgente · Mayo 2026", shortLabel: "Mayo" },
  { id: "JUNIO_2026", label: "Junio 2026", shortLabel: "Junio" },
  { id: "JULIO_AGOSTO_2026", label: "Jul – Ago 2026", shortLabel: "Jul–Ago" },
  { id: "NOVIEMBRE_2026", label: "Noviembre 2026", shortLabel: "Nov" },
];

export default function PlanDeAccion({ completedSteps, onToggleStep }: PlanDeAccionProps) {
  const [activeTab, setActiveTab] = useState<typeof TIMEFRAME_CONFIG[number]["id"]>("ESTA_SEMANA");
  const [showHelp, setShowHelp] = useState(false);

  const currentSteps = ROADMAP_STEPS.filter(s => s.timeframe === activeTab);

  const totalStepsCount = ROADMAP_STEPS.length;
  const completedCount = completedSteps.length;
  const progressPercent = Math.round((completedCount / totalStepsCount) * 100);

  // Next uncompleted step across all timeframes
  const nextStep = ROADMAP_STEPS.find(s => !completedSteps.includes(s.id));

  const getReadiness = (pct: number) => {
    if (pct === 100) return { label: "Completado 100%", color: "text-safe" };
    if (pct >= 70) return { label: "Excelente avance", color: "text-ink" };
    if (pct >= 30) return { label: "En progreso", color: "text-ink/80" };
    return { label: "Fase inicial", color: "text-alert" };
  };
  const readiness = getReadiness(progressPercent);

  const togglePhase = () => {
    const ids = currentSteps.map(s => s.id);
    const allDone = ids.every(id => completedSteps.includes(id));
    ids.forEach(id => {
      const done = completedSteps.includes(id);
      if (allDone === done) onToggleStep(id);
    });
  };

  const copy = SECTION_COPY.roadmap;

  return (
    <div className="space-y-6" id="checklist-timeline">

      {/* ── SECTION HEADER ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink/50 block mb-1">Plan de Acción</span>
          <h2 className="font-display text-3xl font-black text-ink uppercase leading-tight">{copy.title}</h2>
          <p className="text-sm font-serif text-ink/70 mt-1 leading-relaxed max-w-2xl">{copy.subtitle}</p>
        </div>
        <button
          onClick={() => setShowHelp(s => !s)}
          className="shrink-0 p-1.5 text-ink/40 hover:text-ink transition-colors cursor-pointer mt-1"
          title="Cómo usar"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {showHelp && (
        <div className="bg-paper-dark border border-ink/20 p-4 space-y-2">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink/60">{copy.description}</p>
          <p className="text-xs font-serif text-ink/70 leading-relaxed">{copy.howToUse}</p>
          {copy.helpItems?.map((item, i) => (
            <p key={i} className="text-xs font-serif text-ink/70 flex items-start gap-2">
              <span className="text-ink/40 mt-0.5 shrink-0">→</span> {item}
            </p>
          ))}
        </div>
      )}

      {/* ── PRÓXIMO PASO HERO ── */}
      {nextStep && (
        <div className={`border-2 border-ink p-5 shadow-[3px_3px_0px_#1a1a1a] bg-gradient-to-r ${nextStep.color}`}>
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-ink text-paper border border-ink shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink/60">
                  Próximo paso
                </span>
                {PHASE_LABELS[nextStep.phase] && (
                  <span className={`${PHASE_LABELS[nextStep.phase].color} text-white text-[9px] font-mono font-bold uppercase px-2 py-0.5 border border-ink`}>
                    {PHASE_LABELS[nextStep.phase].label}
                  </span>
                )}
                {nextStep.isUrgent && (
                  <span className="bg-alert text-white text-[9px] font-mono font-bold uppercase px-2 py-0.5 border border-ink flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5 animate-pulse" /> Urgente
                  </span>
                )}
              </div>
              <h3 className="font-sans font-black text-lg text-ink leading-tight">{nextStep.title}</h3>
              <p className="text-xs font-serif text-ink/80 mt-1.5 leading-relaxed max-w-xl">{nextStep.desc}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-[10px] font-mono font-bold text-ink/60 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {nextStep.dateText}
                </span>
                <button
                  onClick={() => onToggleStep(nextStep.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-paper border-2 border-ink font-mono text-[11px] font-bold uppercase shadow-[1.5px_1.5px_0px_#000] hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all cursor-pointer"
                >
                  <Check className="h-3 w-3" /> Marcar completado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PROGRESS BAR ── */}
      <div className="bg-paper border-2 border-ink p-4 shadow-[2px_2px_0px_#1a1a1a]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-ink/60" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink/70">Progreso global</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-mono font-bold ${readiness.color}`}>{readiness.label}</span>
            <span className="text-base font-mono font-black text-ink">{progressPercent}%</span>
          </div>
        </div>
        <div className="w-full h-3 bg-paper-dark border border-ink overflow-hidden">
          <motion.div
            className="h-full bg-ink"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[9px] font-mono text-ink/50">{completedCount} de {totalStepsCount} pasos completados</span>
          <div className="flex items-center gap-1.5">
            {PHASE_LABELS && Object.entries(PHASE_LABELS).map(([key, val]) => (
              <span key={key} className="flex items-center gap-1 text-[9px] font-mono text-ink/50">
                <span className={`h-1.5 w-1.5 ${val.color} inline-block`} /> {val.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN PANEL ── */}
      <div className="bg-paper border-2 border-ink shadow-[4px_4px_0px_#1a1a1a]">
        {/* Phase tabs */}
        <div className="flex border-b-2 border-ink overflow-x-auto">
          {TIMEFRAME_CONFIG.map(t => {
            const count = ROADMAP_STEPS.filter(s => s.timeframe === t.id).length;
            const done = ROADMAP_STEPS.filter(s => s.timeframe === t.id && completedSteps.includes(s.id)).length;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 min-w-[100px] py-3 px-3 text-center text-[10px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
                  activeTab === t.id ? "bg-ink text-paper" : "bg-paper hover:bg-paper-dark text-ink"
                }`}
              >
                <span className="block">{t.shortLabel}</span>
                <span className={`text-[9px] ${activeTab === t.id ? "text-paper/60" : "text-ink/50"}`}>
                  {done}/{count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Phase header */}
        <div className="flex items-center justify-between px-4 py-3 bg-paper-dark/40 border-b border-ink/15">
          <h4 className="text-xs font-mono font-black uppercase text-ink flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {TIMEFRAME_CONFIG.find(t => t.id === activeTab)?.label}
          </h4>
          <button
            onClick={togglePhase}
            className="text-[10px] font-mono font-bold uppercase text-ink/60 hover:text-ink cursor-pointer transition-colors flex items-center gap-1"
          >
            <Check className="h-3 w-3" /> Marcar fase completa
          </button>
        </div>

        {/* Step list */}
        <div className="divide-y divide-ink/10">
          {currentSteps.map(step => {
            const isChecked = completedSteps.includes(step.id);
            const phaseInfo = PHASE_LABELS[step.phase];
            return (
              <div
                key={step.id}
                onClick={() => onToggleStep(step.id)}
                className={`flex gap-3 p-4 cursor-pointer transition-colors hover:bg-paper-dark/20 ${isChecked ? "opacity-55" : ""}`}
              >
                {/* Checkbox */}
                <div className="shrink-0 mt-0.5">
                  <div className={`h-5 w-5 border flex items-center justify-center transition-colors ${
                    isChecked ? "bg-ink border-ink" : "border-ink/50 bg-paper"
                  }`}>
                    {isChecked && <Check className="h-3 w-3 text-paper stroke-[3]" />}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-sans font-bold text-sm text-ink leading-tight ${isChecked ? "line-through text-ink/50" : ""}`}>
                      {step.title}
                    </span>
                    {phaseInfo && (
                      <span className={`${phaseInfo.color} text-white text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 border border-ink`}>
                        {phaseInfo.label}
                      </span>
                    )}
                    {step.isUrgent && !isChecked && (
                      <span className="bg-alert text-white text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 border border-ink flex items-center gap-1">
                        <Clock className="h-2 w-2 animate-pulse" /> Urgente
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-serif text-ink/75 leading-relaxed">{step.desc}</p>
                  <span className="text-[9px] font-mono text-ink/50 flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" /> {step.dateText}
                  </span>
                </div>

                <ChevronRight className={`h-4 w-4 shrink-0 text-ink/30 mt-0.5 transition-transform ${isChecked ? "opacity-0" : ""}`} />
              </div>
            );
          })}
        </div>

        {/* Bottom hint */}
        <div className="border-t border-ink/10 px-4 py-3 flex items-center gap-2 bg-paper-dark/20">
          <Rocket className="h-3.5 w-3.5 text-ink/40 shrink-0" />
          <p className="text-[10px] font-serif italic text-ink/55">
            Al constituir tu SpA en Junio, se destrabarán fondos que requieren estructura legal formal.
          </p>
          <ArrowRight className="h-3 w-3 text-ink/30 shrink-0 ml-auto" />
        </div>
      </div>

    </div>
  );
}
