import { motion } from "motion/react";
import { Radar, Bell, ShieldCheck, Flame, Info } from "lucide-react";

interface HeaderProps {
  currentDate: string;
  criticalCount: number;
}

export default function Header({ currentDate, criticalCount }: HeaderProps) {
  // Simple radar pulses data
  const blips = [
    { id: 1, label: "Abeja", angle: 45, r: 40, color: "bg-red-600", ping: true, desc: "Cierra hoy!" },
    { id: 2, label: "CORFO RM", angle: 180, r: 75, color: "bg-red-600", ping: true, desc: "Cierra en 2 d" },
    { id: 3, label: "Crea y Valida", angle: 300, r: 120, color: "bg-amber-600", ping: false, desc: "Borrador" },
    { id: 4, label: "Inicia Mujeres", angle: 120, r: 160, color: "bg-amber-600", ping: false, desc: "Junio" },
  ];

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

            <h1 className="font-display text-5xl font-black tracking-tight text-ink sm:text-6xl uppercase leading-none">
              RADAR <span className="font-serif italic text-alert font-medium lowercase">fondos cl</span>
            </h1>
            
            <p className="mt-3 text-lg font-serif italic text-ink/80 leading-relaxed max-w-xl">
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
          <div className="flex justify-center md:justify-end">
            <div className="relative h-56 w-56 sm:h-64 sm:w-64 border-2 border-ink bg-white flex items-center justify-center overflow-hidden shadow-[4px_4px_0px_#1a1a1a]">
              {/* Target concentric drawing lines */}
              <div className="absolute h-[80%] w-[80%] rounded-full border border-ink/10 pointer-events-none" />
              <div className="absolute h-[55%] w-[55%] rounded-full border border-ink/15 pointer-events-none" />
              <div className="absolute h-[30%] w-[30%] rounded-full border border-ink/20 pointer-events-none" />
              
              {/* Horizontal and vertical crosshairs like a blueprint */}
              <div className="absolute h-full w-[1px] bg-ink/15 pointer-events-none" />
              <div className="absolute w-full h-[1px] bg-ink/15 pointer-events-none" />

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

        {/* Global Urgent Notice Ribbon in black background + white and amber font */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-ink border-2 border-ink text-paper p-5 relative overflow-hidden"
        >
          {/* Subtle warning diagonal background label pattern for print theme */}
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
                  CRÍTICO: SERCOTEC Abeja cierra en menos de 24 horas
                </span>
                <p className="text-xs text-paper/85 mt-1 max-w-3xl leading-snug">
                  El fondo especial para mujeres de Sercotec cierra hoy <strong className="text-alert bg-paper px-1">27 de Mayo</strong> y Semilla Inicia RM el <strong className="text-warning font-bold">29 de Mayo</strong>. ¡Ajusta los switches del perfil de Milton en el panel de abajo para ver la simulación en tiempo real!
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-between sm:justify-center gap-2 border-t border-paper/20 sm:border-t-0 pt-3 sm:pt-0">
              <span className="inline-flex h-2.5 w-2.5 bg-alert border border-paper" />
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
