import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Calendar, CheckSquare, Square, ChevronRight, Play, Clock, 
  Award, ArrowUpRight, Check, ListTodo, Trophy, Rocket
} from "lucide-react";
import { RoadmapStep } from "../types";
import { ROADMAP_STEPS } from "../data";

interface PlanDeAccionProps {
  completedSteps: string[];
  onToggleStep: (id: string) => void;
}

export default function PlanDeAccion({ completedSteps, onToggleStep }: PlanDeAccionProps) {
  const [activeTab, setActiveTab] = useState<"ESTA_SEMANA" | "JUNIO_2026" | "JULIO_AGOSTO_2026" | "NOVIEMBRE_2026">("ESTA_SEMANA");

  // Get subset of steps
  const currentSteps = ROADMAP_STEPS.filter(step => step.timeframe === activeTab);

  // Compute dynamic percentage of total steps matching the checklist
  const totalStepsCount = ROADMAP_STEPS.length;
  const completedCount = completedSteps.length;
  const progressPercent = Math.round((completedCount / totalStepsCount) * 100);

  const getReadinessLevel = (percent: number) => {
    if (percent === 100) return { title: "Preparado al 100%", desc: "¡Excepcional! Has completado y asimilado de forma absoluta la ruta de financiamiento v4.", color: "text-safe" };
    if (percent >= 70) return { title: "Excelente Avance", desc: "Posees la gobernanza corporativa, bases de fomento y modelo para cerrar capital.", color: "text-ink" };
    if (percent >= 30) return { title: "Validación en Progreso", desc: "Estás sentando los cimientos correctos. Sigue con tus formularios de postulación.", color: "text-ink/80" };
    return { title: "Fase de Diagnóstico", desc: "No te abrumes: comienza redactando tu propuesta ejecutiva de software esta semana.", color: "text-alert" };
  };

  const statusFeedback = getReadinessLevel(progressPercent);

  // Quick action: check all current tasks in active view
  const toggleViewTasks = () => {
    const activeIds = currentSteps.map(s => s.id);
    const allChecked = activeIds.every(id => completedSteps.includes(id));
    
    // Toggle state batching
    activeIds.forEach(id => {
      const isChecked = completedSteps.includes(id);
      if (allChecked && isChecked) {
        onToggleStep(id);
      } else if (!allChecked && !isChecked) {
        onToggleStep(id);
      }
    });
  };

  const getHeadingText = (tab: typeof activeTab) => {
    switch (tab) {
      case "ESTA_SEMANA": return "FASE 1: Urgente - Esta Semana (26 al 31 de Mayo 2026)";
      case "JUNIO_2026": return "FASE 2: Segunda Oleada y Estructura SpA (Junio 2026)";
      case "JULIO_AGOSTO_2026": return "FASE 3: Consolidación y Desafío Sostenible (Julio - Agosto 2026)";
      case "NOVIEMBRE_2026": return "FASE 4: Escala e Internacionalización (Noviembre 2026)";
    }
  };

  return (
    <div className="bg-paper border-2 border-ink p-6 relative overflow-hidden shadow-[4px_4px_0px_#1a1a1a]" id="checklist-timeline">

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        
        {/* Left pane: dynamic status bar */}
        <div className="md:w-80 shrink-0 space-y-5">
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-widest text-alert font-bold">CRONOGRAMA DE GESTIÓN</span>
            <h3 className="font-serif font-black text-2xl italic text-ink flex items-center gap-2 mt-0.5">
              <ListTodo className="h-5 w-5 text-ink" />
              Plan de Acción
            </h3>
            <p className="text-xs font-serif text-ink/80 mt-1.5 leading-relaxed">
              Planifique y audite cada hito estratégico de Milton en el ecosistema chileno para medir su índice de elegibilidad en tiempo real.
            </p>
          </div>

          <div className="bg-paper-dark border border-ink p-4 space-y-4 shadow-[2px_2px_0px_#1a1a1a]">
            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span className="text-ink/70 font-mono font-bold uppercase tracking-wide">AVANCE GLOBAL DE HITOS:</span>
                <span className="font-mono font-black text-ink text-base">{progressPercent}%</span>
              </div>
              
              {/* Process Bar container */}
              <div className="w-full h-3 bg-paper border border-ink overflow-hidden">
                <motion.div 
                  className="h-full bg-ink" 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className={`text-xs font-black font-sans uppercase tracking-wider ${statusFeedback.color} flex items-center gap-1`}>
                <Trophy className="h-3.5 w-3.5 shrink-0" />
                {statusFeedback.title}
              </span>
              <p className="text-xs font-serif text-ink italic leading-relaxed">
                {statusFeedback.desc}
              </p>
            </div>

            <div className="text-[9px] text-ink/75 pt-2 border-t border-ink/15 font-mono flex items-center justify-between">
              <span>{completedCount} de {totalStepsCount} Hitos Listos</span>
              <span>UTC CL</span>
            </div>
          </div>

          {/* Vertical phase selectors tabs */}
          <div className="flex flex-col gap-2">
            {[
              { id: "ESTA_SEMANA", label: "Fase 1: Mayo 2026", color: "border-ink text-ink" },
              { id: "JUNIO_2026", label: "Fase 2: Junio 2026", color: "border-ink text-ink" },
              { id: "JULIO_AGOSTO_2026", label: "Fase 3: Julio - Agosto", color: "border-ink text-ink" },
              { id: "NOVIEMBRE_2026", label: "Fase 4: Noviembre 2026", color: "border-ink text-ink" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-left p-3 text-xs font-mono font-bold uppercase border cursor-pointer flex items-center justify-between transition-all ${
                  activeTab === tab.id 
                    ? "bg-ink text-paper border-ink font-black shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    : "bg-paper border-ink hover:bg-paper-dark shadow-[1px_1px_0px_rgba(0,0,0,0.15)]"
                }`}
              >
                <span>{tab.label}</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              </button>
            ))}
          </div>

        </div>

        {/* Right pane: list of active timeline cards */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between bg-paper-dark p-3 border border-ink shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
            <h4 className="text-xs font-mono uppercase font-black text-ink flex items-center gap-1.5 leading-none">
              <Calendar className="h-4 w-4 text-ink shrink-0" />
              {getHeadingText(activeTab)}
            </h4>
            <button
              onClick={toggleViewTasks}
              className="text-[10px] text-ink hover:underline font-mono uppercase font-extrabold cursor-pointer"
            >
              Marcar todos de esta fase
            </button>
          </div>

          <div className="space-y-3">
            {currentSteps.map((step) => {
              const isChecked = completedSteps.includes(step.id);
              return (
                <div 
                  key={step.id}
                  onClick={() => onToggleStep(step.id)}
                  className={`border border-ink p-4 hover:bg-paper-dark/30 transition-all cursor-pointer flex gap-3 pb-4 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] ${
                    isChecked ? "opacity-65 bg-paper-dark/50" : "bg-white"
                  }`}
                >
                  {/* Selector checkbox */}
                  <div className="mt-0.5 shrink-0 select-none">
                    {isChecked ? (
                      <div className="flex items-center justify-center h-5 w-5 bg-ink text-paper border border-ink">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 border border-ink bg-paper" />
                    )}
                  </div>

                  {/* Body elements */}
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                      <span className="text-ink font-bold font-sans text-sm leading-tight block">
                        {step.title}
                      </span>
                      <span className="font-mono text-[9px] text-ink bg-paper border border-ink/30 px-2 py-0.5 tracking-wide">
                        {step.dateText}
                      </span>
                    </div>
                    
                    <p className="text-xs text-ink/80 font-serif leading-relaxed">
                      {step.desc}
                    </p>

                    {/* Meta indicator tag */}
                    {step.isUrgent && (
                      <div className="inline-flex items-center gap-1 bg-alert text-white text-[9px] font-mono font-extrabold uppercase py-0.5 px-2.5 border border-ink mt-2">
                        <Clock className="h-2.5 w-2.5 animate-spin text-white" />
                        Acción Prioritaria
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {/* Quick action helper bottom */}
          <div className="text-[11px] text-ink/70 flex items-center justify-center gap-1 text-center py-2 italic font-serif">
            <Rocket className="h-3.5 w-3.5 text-ink shrink-0" />
            <span>Al constituir tu SpA en Junio, se destrabarán las de fomento de forma instantánea.</span>
          </div>

        </div>

      </div>

    </div>
  );
}
