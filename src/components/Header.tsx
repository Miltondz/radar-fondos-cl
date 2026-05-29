import { motion } from "motion/react";
import { Flame } from "lucide-react";
import { Fund } from "../types";

interface HeaderProps {
  currentDate: string;
  criticalCount: number;
  urgentFunds?: Fund[];
}

const BLIP_ANGLES = [45, 180, 300, 120];
const BLIP_RADII = [40, 75, 120, 160];

export default function Header({ currentDate, criticalCount, urgentFunds = [] }: HeaderProps) {
  const blips = urgentFunds.slice(0, 4).map((fund, i) => ({
    id: i + 1,
    label: fund.name.split(" ").slice(0, 2).join(" "),
    angle: BLIP_ANGLES[i],
    r: BLIP_RADII[i],
    color: fund.urgency === "CRITICAL" ? "bg-red-600" : "bg-amber-500",
    ping: fund.urgency === "CRITICAL",
    desc: fund.deadline,
  }));

  const topFund = urgentFunds[0];
  const secondFund = urgentFunds[1];

  return (
    <header className="relative w-full border-b-2 border-ink bg-paper pb-8 pt-10" id="radar-header">
      {/* Editorial Decorative line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-ink" />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          
          {/* Title & Brand Column */}
          <div className="max-w-2xl flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-alert px-3 py-1 text-xs font-mono font-bold text-white border border-ink uppercase tracking-wider">
                <Flame className="h-3 w-3 animate-pulse" />
                CONFIDENCIAL // MAYO 2026
              </span>
              <span className="inline-flex items-center gap-1 bg-ink px-2.5 py-1 text-xs font-mono text-paper font-semibold">
                EDICIÓN v4.0.0
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-ink uppercase leading-none">
              RADAR <span className="font-serif italic text-alert font-medium lowercase">fondos cl</span>
            </h1>
            
            <p className="mt-3 text-sm sm:text-lg font-serif italic text-ink/80 leading-relaxed max-w-xl">
              Reporte Técnico sobre Financiamiento Gubernamental y Fomento de Startups Tecnológicas en Chile.
              Calibrado con convocatorias de <span className="font-bold underline decoration-1 text-ink">CORFO</span>, <span className="font-bold underline decoration-1 text-ink">SERCOTEC</span> & <span className="font-bold underline decoration-1 text-ink">Startup Chile</span>.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <div className="flex items-center gap-2 bg-paper-dark border border-ink px-3 py-1.5 font-mono text-xs text-ink/90">
                <span className="h-2 w-2 rounded-full bg-safe inline-block animate-pulse" />
                <span>Fecha Reporte: <strong className="font-bold">{currentDate}</strong></span>
              </div>

              <div className="flex items-center gap-2 bg-paper-dark border border-ink px-3 py-1.5 font-mono text-xs text-ink/90">
                <span>Estado: <strong className="font-bold">CONVOCATORIA ABIERTA</strong></span>
              </div>
            </div>
          </div>

          {/* Editorial Architectural Radar Drafting Screen */}
          <div className="hidden sm:flex justify-center md:justify-end">
            <div className="relative h-56 w-56 sm:h-64 sm:w-64 border-2 border-ink bg-white dark:bg-paper flex items-center justify-center overflow-hidden shadow-[4px_4px_0px_#1a1a1a]">
              {/* Target concentric drawing lines */}
              <div className="absolute h-[80%] w-[80%] rounded-full border border-ink/20 dark:border-ink/40 pointer-events-none" />
              <div className="absolute h-[55%] w-[55%] rounded-full border border-ink/25 dark:border-ink/50 pointer-events-none" />
              <div className="absolute h-[30%] w-[30%] rounded-full border border-ink/30 dark:border-ink/60 pointer-events-none" />

              {/* Horizontal and vertical crosshairs like a blueprint */}
              <div className="absolute h-full w-[1px] bg-ink/20 dark:bg-ink/50 pointer-events-none" />
              <div className="absolute w-full h-[1px] bg-ink/20 dark:bg-ink/50 pointer-events-none" />

              {/* Central Target Pin */}
              <div className="absolute h-4 w-4 bg-ink border border-white flex items-center justify-center z-10">
                <div className="h-1.5 w-1.5 bg-paper" />
              </div>

              {/* Radar Blips representing active calls to action */}
              {blips.map((blip) => {
                const rad = (blip.angle * Math.PI) / 180;
                const radiusPercent = (blip.r / 190) * 100;
                const x = Math.cos(rad) * radiusPercent;
                const y = Math.sin(rad) * radiusPercent;

                return (
                  <motion.div
                    key={blip.id}
                    className="absolute z-20"
                    style={{
                      left: `calc(50% + ${x}% - 6px)`,
                      top: `calc(50% + ${y}% - 6px)`,
                    }}
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: blip.ping ? 1.5 : 3.5, ease: "easeInOut" }}
                  >
                    <div className="relative group cursor-help">
                      <div className={`h-3 w-3 rounded-none ${blip.color} border border-ink shadow-sm`} />
                      
                      {/* Tooltip built directly with Editorial aesthetics */}
                      <span className="absolute left-4 -top-3 w-max select-none bg-ink border border-paper px-2 py-0.5 text-[10px] font-mono text-paper opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow z-50">
                        {blip.label} ({blip.desc})
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-ink/60 select-none">
                  MAPA DE DISPERSIÓN FONDOS
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Global Urgent Notice Ribbon */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-ink border-2 border-ink text-paper p-5 relative overflow-hidden"
        >
          <div className="absolute -right-3 -bottom-3 rotate-12 opacity-5 font-black text-6xl tracking-widest uppercase font-sans select-none pointer-events-none">
            EXTRA
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-paper text-ink border border-ink font-mono font-bold text-lg select-none">
                !
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-paper/70 block">ACCIONAR HOY</span>
                <span className="text-sm font-bold text-paper font-display tracking-wide flex items-center gap-1.5 mt-0.5">
                  {topFund
                    ? `${topFund.urgency === "CRITICAL" ? "CRÍTICO" : "URGENTE"}: ${topFund.name} — ${topFund.deadline}`
                    : "Convocatorias activas en curso — revisa el radar"
                  }
                </span>
                <p className="text-xs text-paper/85 mt-1 max-w-3xl leading-snug">
                  {topFund ? (
                    <>
                      {topFund.description.substring(0, 110)}
                      {topFund.description.length > 110 ? "..." : ""}
                      {secondFund && (
                        <> | También urgente: <strong className="text-warning">{secondFund.name}</strong> — cierre: <strong className="text-warning">{secondFund.deadline}</strong>.</>
                      )}
                    </>
                  ) : (
                    "Ajusta los switches del perfil de Milton para ver la simulación de elegibilidad en tiempo real."
                  )}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-between sm:justify-center gap-2 border-t border-paper/20 sm:border-t-0 pt-3 sm:pt-0">
              <span className="inline-flex h-2.5 w-2.5 bg-alert border border-paper animate-pulse" />
              <span className="text-xs text-paper font-mono tracking-wider font-bold">
                {criticalCount} ALERTAS DE CIERRE
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </header>
  );
}
