import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Trophy, Gift, CheckCircle2, AlertTriangle, KeyRound, ExternalLink, Copy, Check, CalendarDays, Zap, ZapOff } from "lucide-react";
import { Fund, FundStatus, MiltonProfile } from "../types";
import { ALL_FUNDS } from "../data";
import { formatCLP, getGoogleCalendarUrl } from "../utils";
import CalendarButton from "./CalendarButton";

interface ViewHackatonesProps {
  profile: MiltonProfile;
  onAddToStack: (fund: Fund) => void;
  stackedFunds: Fund[];
}

export default function ViewHackatones({ profile, onAddToStack, stackedFunds }: ViewHackatonesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"TODOS" | "PREMIO_EFECTIVO" | "TECNOLOGICO">("TODOS");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedHackId, setExpandedHackId] = useState<string | null>("hack-academia-hacklab-2026");

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const hackatones = useMemo(() => {
    return ALL_FUNDS.filter(f => f.type === "hackaton");
  }, []);

  const computeEligibility = (fund: Fund) => {
    if (fund.eligibilityGenderRequired && !profile.hasWoman) {
      return { 
        status: "SOCIA REQUERIDA (EQUIDAD DE GÉNERO)", 
        color: "text-white bg-alert border-ink", 
        icon: <ZapOff className="h-4 w-4 shrink-0" />,
        isEligible: false
      };
    }

    return { 
      status: "ELEGIBLE COMPATIBLE", 
      color: "text-white bg-accent-purple border-ink", 
      icon: <Zap className="h-4 w-4 shrink-0 animate-bounce" />,
      isEligible: true
    };
  };

  const filteredHacks = useMemo(() => {
    return hackatones.filter((hack) => {
      const matchesSearch = 
        hack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (hack.chileCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        hack.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (hack.organizer || "").toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case "PREMIO_EFECTIVO":
          // Award size >= 10M
          return hack.amountNumber >= 10000000;
        case "TECNOLOGICO":
          return hack.category.toLowerCase().includes("ia") || hack.category.toLowerCase().includes("global") || hack.category.toLowerCase().includes("latam");
        case "TODOS":
        default:
          return true;
      }
    });
  }, [hackatones, searchTerm, activeFilter]);

  const toggleExpand = (id: string) => {
    setExpandedHackId(expandedHackId === id ? null : id);
  };

  return (
    <div id="hackatones-desafios-tab" className="space-y-6">
      
      {/* Search and Filters panel */}
      <div className="bg-paper border-2 border-ink p-5 shadow-[3px_3px_0px_rgba(0,0,0,1)] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        
        {/* Left Side: Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink/50">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar hackathon, reto de IA Gen, premios, etc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-ink bg-paper py-2.5 pl-10 pr-4 text-xs text-ink placeholder-ink/65 hover:bg-paper-dark/30 focus:bg-paper focus:outline-none focus:ring-0"
          />
        </div>

        {/* Categories togglers */}
        <div className="flex border border-ink bg-paper p-0.5">
          {(["TODOS", "PREMIO_EFECTIVO", "TECNOLOGICO"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                activeFilter === filter ? "bg-accent-purple text-white" : "bg-paper hover:bg-paper-dark text-ink"
              }`}
            >
              {filter === "TODOS" ? "⚡ Todas" : filter === "PREMIO_EFECTIVO" ? "🏆 Premios > $10M" : "🤖 Desafío IA / Urbano"}
            </button>
          ))}
        </div>

      </div>

      {/* Roster list */}
      <div className="space-y-4">
        {filteredHacks.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-ink bg-paper-dark/30">
            <Trophy className="mx-auto h-12 w-12 text-ink/40" />
            <h5 className="font-sans font-bold text-base text-ink mt-3">No se encontraron desafíos de tecnología</h5>
            <p className="text-xs text-ink/65 mt-1 max-w-sm mx-auto">Prueba limpiando tu texto o seleccionando otras categorías de hackathon.</p>
          </div>
        ) : (
          filteredHacks.map((hack) => {
            const isExpanded = expandedHackId === hack.id;
            const eligibility = computeEligibility(hack);
            const isStacked = stackedFunds.some(f => f.id === hack.id);

            return (
              <div
                key={hack.id}
                className="bg-paper border-2 border-ink shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:border-accent-purple transition-colors"
              >
                
                {/* Row banner */}
                <div
                  onClick={() => toggleExpand(hack.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer select-none hover:bg-paper-dark/40"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-accent-purple text-white px-2 py-0.5">
                        {hack.organizer || "Innovación Abierta"}
                      </span>
                      <span className="bg-paper border border-ink/40 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-ink/80">
                        {hack.category}
                      </span>
                      <span className="bg-paper-dark border border-ink/20 px-2 py-0.5 text-[9.5px] text-ink/70 font-mono font-bold">
                        Cierra: {hack.deadline}
                      </span>
                    </div>

                    <h4 className="font-sans font-black text-lg text-ink tracking-tight truncate flex items-center gap-2">
                      {hack.name}
                    </h4>

                    {/* Copy code badge */}
                    {hack.chileCode && (
                      <div className="flex items-center gap-1.5 w-max">
                        <span className="font-mono text-[11px] bg-paper-dark px-2 py-0.5 border border-ink/20 font-bold text-ink shrink-0">
                          ID Convocatoria: {hack.chileCode}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode(hack.chileCode || "", hack.id);
                          }}
                          className="p-1 hover:text-alert transition-colors cursor-pointer text-ink/60 bg-paper hover:bg-paper-dark border border-ink/30 rounded"
                          title="Click para copiar Código del Reto/Hackathon"
                        >
                          {copiedId === hack.id ? (
                            <span className="text-[9px] font-mono text-safe font-black uppercase flex items-center gap-1">
                              <Check className="h-3 w-3" /> Copiado
                            </span>
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pricing metrics & Eligibility visual indicator */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-2 border-t border-ink/10 md:border-t-0 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="block text-[8px] font-mono uppercase text-ink/50 leading-none">Premios / Financiamiento</span>
                      <strong className="text-sm md:text-[15px] font-mono font-black text-accent-purple block mt-1">
                        {formatCLP(hack.amountNumber)}
                      </strong>
                    </div>

                    <div className={`px-2 py-1 text-[9px] font-mono font-bold flex items-center gap-1 border ${eligibility.color}`}>
                      {eligibility.icon}
                      <span>{eligibility.status}</span>
                    </div>
                  </div>

                </div>

                {/* Dropdown panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t-2 border-dashed border-ink/20 bg-paper-dark"
                    >
                      <div className="p-6 space-y-6 text-xs max-w-5xl">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
                          
                          {/* Left specifications */}
                          <div className="space-y-4">
                            <div>
                              <strong className="block text-[10px] font-mono uppercase tracking-widest text-ink/65 mb-1 text-accent-purple/90">Estructura del Desafío y Premiación:</strong>
                              <p className="font-serif italic text-sm text-ink">{hack.amount}</p>
                              <p className="text-[11px] text-ink/80 mt-1">Detalle Sponsor: {hack.cofinancing}</p>
                            </div>

                            <div>
                              <strong className="block text-[10px] font-mono uppercase tracking-widest text-ink/65 mb-1 block">¿Cómo le afecta a Milton?</strong>
                              <div className="bg-paper p-3 border-l-4 border-accent-purple border-y border-r border-ink/20 font-serif">
                                {hack.miltonAplica}
                              </div>
                            </div>

                            <div>
                              <strong className="block text-[10px] font-mono uppercase tracking-widest text-alert/90 mb-1 font-bold">💡 Tip Estratégico de Pitch de Programación:</strong>
                              <p className="font-serif text-ink">{hack.tips}</p>
                            </div>
                          </div>

                          {/* Right requirements */}
                          <div className="space-y-4">
                            <div>
                              <strong className="block text-[10px] font-mono uppercase tracking-widest text-ink/65 mb-1.5">Requisitos del Equipo Formado:</strong>
                              <ul className="space-y-1.5">
                                {hack.requirements.map((req, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="text-accent-purple font-bold font-mono shrink-0">•</span>
                                    <span className="font-serif text-ink/90 leading-snug">{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Links copy portals */}
                            <div className="pt-2 border-t border-ink/20 leading-relaxed font-mono space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-ink/60">Enlace de Registro / Inscripción:</span>
                                <a 
                                  href={hack.url} 
                                  target="_blank" 
                                  referrerPolicy="no-referrer"
                                  rel="noopener noreferrer" 
                                  className="text-accent-purple hover:underline flex items-center gap-1 font-bold transition-all text-[10px]"
                                >
                                  {hack.referenceUrlText}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-ink/60">Enlace URL Bases Directas:</span>
                                <button
                                  onClick={() => handleCopyCode(hack.url, hack.id)}
                                  className="text-alert font-bold flex items-center gap-1.5 text-[10px] cursor-pointer hover:underline"
                                >
                                  <span>{copiedId === hack.id ? "¡Enlace Copiado!" : "Copiar Enlace Ficha"}</span>
                                  {copiedId === hack.id ? <Check className="h-3 w-3 text-safe" /> : <Copy className="h-3 w-3" />}
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Interactive actions */}
                        <div className="flex gap-2 items-center pt-4 border-t border-ink/20">
                          <button
                            onClick={() => onAddToStack(hack)}
                            disabled={isStacked}
                            className={`px-4 py-2 text-[10.5px] font-mono font-bold uppercase border border-ink cursor-pointer flex items-center gap-1.5 ${
                              isStacked 
                                ? "bg-safe/20 border-safe text-safe" 
                                : "bg-paper hover:bg-paper-dark text-ink shadow-[2.5px_2.5px_0px_#000] hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all"
                            }`}
                          >
                            {isStacked ? "✓ Desafío Agregado al Historial de Tracción" : "+ Guardar en Pila de Sinergias"}
                          </button>

                          <a
                            href={getGoogleCalendarUrl({
                              id: hack.id,
                              name: hack.name,
                              deadlineISO: hack.deadlineISO || "2026-05-27",
                              description: hack.description,
                              url: hack.url,
                              chileCode: hack.chileCode
                            })}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-[10.5px] bg-paper hover:bg-paper-dark border border-ink text-ink font-mono font-bold uppercase shadow-[2.5px_2.5px_0px_#000] hover:translate-y-[-0.5px] inline-flex items-center gap-1.5"
                            title="Crear borrador de hito rápido por enlace standard"
                          >
                            <CalendarDays className="h-4 w-4 text-alert" />
                            Borrador Agenda
                          </a>

                          <CalendarButton item={hack} className="px-4 py-2 text-[10.5px]" />
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
