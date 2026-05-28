import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Building2, ClipboardCopy, CheckCircle2, AlertTriangle, XOctagon, Calendar, ExternalLink, Copy, Check, CalendarDays, KeyRound, Radio, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Fund, FundStatus, MiltonProfile } from "../types";
import { ALL_FUNDS } from "../data";
import { formatCLP, getGoogleCalendarUrl } from "../utils";
import { SECTION_COPY } from "../copy";
import CalendarButton from "./CalendarButton";
import EligibilityChecklist from "./EligibilityChecklist";
import MapWidget from "./MapWidget";
import SectionHeader from "./SectionHeader";
import NextActionBanner from "./NextActionBanner";

interface ViewLicitacionesProps {
  profile: MiltonProfile;
  onAddToStack: (fund: Fund) => void;
  stackedFunds: Fund[];
  starredFunds?: string[];
  onToggleStar?: (id: string) => void;
  extraFunds?: Fund[];
  archivedFundIds?: string[];
  onDeleteFund?: (id: string) => void;
  onArchiveFund?: (id: string) => void;
}

export default function ViewLicitaciones({ profile, onAddToStack, stackedFunds, starredFunds = [], onToggleStar, extraFunds = [], archivedFundIds = [], onDeleteFund, onArchiveFund }: ViewLicitacionesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"TODOS" | "COMPRA_AGIL" | "PUBLICO" | "CONVENIO_MARCO" | "CERRADO">("TODOS");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedLicId, setExpandedLicId] = useState<string | null>("lic-las-condes-participacion-2026");

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const licitaciones = useMemo(() => {
    return [...ALL_FUNDS, ...extraFunds].filter(f => f.type === "licitacion");
  }, [extraFunds]);

  const computeEligibility = (fund: Fund) => {
    const missingDocs: string[] = [];
    if (fund.requiresSpA && !profile.hasSpA) {
      missingDocs.push("Reclama SpA");
    }
    if (fund.SIIRequired && !profile.hasSiiInitiated) {
      missingDocs.push("Iniciación SII");
    }

    if (missingDocs.length > 0) {
      return { 
        status: `REQUISITO: ${missingDocs.sort().join(" y ")}`, 
        color: "text-ink bg-warning border-ink", 
        icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
        isEligible: false
      };
    }

    return { 
      status: "COMPATIBLE PROVEEDOR", 
      color: "text-white bg-accent-blue border-ink", 
      icon: <CheckCircle2 className="h-4 w-4 shrink-0" />,
      isEligible: true
    };
  };

  const filteredLics = useMemo(() => {
    return licitaciones.filter((lic) => {
      const matchesSearch = 
        lic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lic.chileCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        lic.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lic.organizer || "").toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case "COMPRA_AGIL":
          return lic.category === "Compra Ágil" && lic.urgency !== "CLOSED";
        case "PUBLICO":
          return lic.category === "Licitación Pública" && lic.urgency !== "CLOSED";
        case "CONVENIO_MARCO":
          return lic.category === "Convenio Marco" && lic.urgency !== "CLOSED";
        case "CERRADO":
          return lic.urgency === "CLOSED" || lic.status === FundStatus.CLOSED;
        case "TODOS":
        default:
          return lic.urgency !== "CLOSED" && lic.status !== FundStatus.CLOSED;
      }
    });
  }, [licitaciones, searchTerm, activeFilter]);

  const toggleExpand = (id: string) => {
    setExpandedLicId(expandedLicId === id ? null : id);
  };

  return (
    <div id="licitaciones-compras-tab" className="space-y-6">
      <SectionHeader copy={SECTION_COPY.licitaciones} />
      <NextActionBanner section="licitaciones" funds={ALL_FUNDS} starredIds={starredFunds} profile={profile} />

      {/* Search and Filters panel */}
      <div className="bg-paper border-2 border-ink p-5 shadow-[3px_3px_0px_rgba(0,0,0,1)] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        
        {/* Left Side: Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink/50">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por código de ID, organismo o servicio TI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-ink bg-paper py-2.5 pl-10 pr-4 text-xs text-ink placeholder-ink/65 hover:bg-paper-dark/30 focus:bg-paper focus:outline-none focus:ring-0"
          />
        </div>

        {/* Categories togglers */}
        <div className="flex flex-wrap border border-ink bg-paper p-0.5 gap-0.5">
          {(["TODOS", "COMPRA_AGIL", "PUBLICO", "CONVENIO_MARCO", "CERRADO"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                activeFilter === filter
                  ? filter === "CERRADO" ? "bg-ink/50 text-white" : "bg-accent-blue text-white"
                  : filter === "CERRADO" ? "bg-paper text-ink/40 hover:bg-paper-dark" : "bg-paper hover:bg-paper-dark text-ink"
              }`}
            >
              {filter === "TODOS" ? "💼 Activos" : filter === "COMPRA_AGIL" ? "⚡ Compra Ágil" : filter === "PUBLICO" ? "🏛️ Pública" : filter === "CONVENIO_MARCO" ? "📋 Convenio Marco" : "🔒 Cerradas"}
            </button>
          ))}
        </div>

      </div>

      {/* Roster list */}
      <div className="space-y-4">
        {filteredLics.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-ink bg-paper-dark/30">
            <Building2 className="mx-auto h-12 w-12 text-ink/40" />
            <h5 className="font-sans font-bold text-base text-ink mt-3">No se encontraron licitaciones activas</h5>
            <p className="text-xs text-ink/65 mt-1 max-w-sm mx-auto">Prueba limpiando tu texto o seleccionando otras categorías de fomento.</p>
          </div>
        ) : (
          filteredLics.map((lic) => {
            const isExpanded = expandedLicId === lic.id;
            const eligibility = computeEligibility(lic);
            const isStacked = stackedFunds.some(f => f.id === lic.id);
            const isClosed = lic.urgency === "CLOSED" || lic.status === FundStatus.CLOSED;

            return (
              <div
                key={lic.id}
                className={`bg-paper border-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-colors ${isClosed ? "border-ink/30 opacity-60" : "border-ink hover:border-accent-blue"}`}
              >
                
                {/* Row banner */}
                <div
                  onClick={() => toggleExpand(lic.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer select-none hover:bg-paper-dark/40"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-accent-blue text-white px-2 py-0.5">
                        {lic.organizer || "Mercado Público"}
                      </span>
                      <span className="bg-paper border border-ink/40 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-ink/80">
                        {lic.category}
                      </span>
                      <span className="bg-paper-dark border border-ink/20 px-2 py-0.5 text-[9.5px] text-ink/70 font-mono font-bold">
                        Cierre: {lic.deadline}
                      </span>
                    </div>

                    <h4 className="font-sans font-black text-lg text-ink tracking-tight truncate flex items-center gap-2">
                      {lic.name}
                    </h4>

                    {/* Prominent One click copy badge */}
                    {lic.chileCode && (
                      <div className="flex items-center gap-1.5 w-max">
                        <span className="font-mono text-[11px] bg-paper-dark px-2 py-0.5 border border-ink/20 font-bold text-ink shrink-0">
                          Código MP: {lic.chileCode}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode(lic.chileCode || "", lic.id);
                          }}
                          className="p-1 hover:text-alert transition-colors cursor-pointer text-ink/60 bg-paper hover:bg-paper-dark border border-ink/30 rounded"
                          title="Click para copiar Código de Licitación"
                        >
                          {copiedId === lic.id ? (
                            <span className="text-[9px] font-mono text-safe font-black uppercase flex items-center gap-1">
                              <Check className="h-3 w-3" /> Copiado
                            </span>
                          ) : (
                            <ClipboardCopy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Financial amounts and eligibility */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-2 border-t border-ink/10 md:border-t-0 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="block text-[8px] font-mono uppercase text-ink/50 leading-none">Presupuesto Referencial</span>
                      <strong className="text-sm md:text-[15px] font-mono font-black text-accent-blue block mt-1">
                        {formatCLP(lic.amountNumber)}
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
                              <strong className="block text-[10px] font-mono uppercase tracking-widest text-ink/65 mb-1 text-accent-blue/90">Estrategia de Adjudicación e Hitos:</strong>
                              <p className="font-serif italic text-sm text-ink">{lic.amount}</p>
                              <p className="text-[11px] text-ink/80 mt-1">Método de Cobro: {lic.cofinancing}</p>
                            </div>

                            <div>
                              <strong className="block text-[10px] font-mono uppercase tracking-widest text-ink/65 mb-1 block">¿Cómo le afecta a Milton?</strong>
                              <div className="bg-paper p-3 border-l-4 border-accent-blue border-y border-r border-ink/20 font-serif">
                                {lic.miltonAplica}
                              </div>
                            </div>

                            <div>
                              <strong className="block text-[10px] font-mono uppercase tracking-widest text-alert/90 mb-1 font-bold">💡 Tip Estratégico de Consultoría:</strong>
                              <p className="font-serif text-ink">{lic.tips}</p>
                            </div>

                            <div>
                              <strong className="block text-[10px] font-mono uppercase tracking-widest text-ink/65 mb-2">Tu Elegibilidad Actual:</strong>
                              <EligibilityChecklist fund={lic} profile={profile} />
                            </div>
                          </div>

                          {/* Right requirements */}
                          <div className="space-y-4">
                            <div>
                              <strong className="block text-[10px] font-mono uppercase tracking-widest text-ink/65 mb-1.5">Requisitos Formales de Oferta:</strong>
                              <ul className="space-y-1.5">
                                {lic.requirements.map((req, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="text-accent-blue font-bold font-mono shrink-0">•</span>
                                    <span className="font-serif text-ink/90 leading-snug">{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Links copy portals */}
                            <div className="pt-2 border-t border-ink/20 leading-relaxed font-mono space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-ink/60">Portal Mercado Público:</span>
                                <a 
                                  href={lic.url} 
                                  target="_blank" 
                                  referrerPolicy="no-referrer"
                                  rel="noopener noreferrer" 
                                  className="text-accent-blue hover:underline flex items-center gap-1 font-bold transition-all text-[10px]"
                                >
                                  ir a mercadopublico.cl
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-ink/60">Enlace de Cotización Directa:</span>
                                <button
                                  onClick={() => handleCopyCode(lic.url, lic.id)}
                                  className="text-alert font-bold flex items-center gap-1.5 text-[10px] cursor-pointer hover:underline"
                                >
                                  <span>{copiedId === lic.id ? "¡Enlace Copiado!" : "Copiar Enlace Ficha"}</span>
                                  {copiedId === lic.id ? <Check className="h-3 w-3 text-safe" /> : <Copy className="h-3 w-3" />}
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Map widget if address available */}
                        {lic.address && (
                          <div>
                            <strong className="block text-[10px] font-mono uppercase tracking-widest text-ink/65 mb-2">Ubicación del Organismo Contratante:</strong>
                            <MapWidget address={lic.address} />
                          </div>
                        )}

                        {/* Interactive actions */}
                        <div className="flex gap-2 items-center pt-4 border-t border-ink/20 flex-wrap">
                          <a
                            href={lic.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-accent-blue text-white font-mono font-black uppercase text-[11px] border-2 border-ink shadow-[3px_3px_0px_#000] hover:translate-y-[-1px] active:translate-y-[0.5px] transition-all inline-flex items-center gap-2 cursor-pointer"
                          >
                            VER EN MERCADO PÚBLICO
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            onClick={() => onAddToStack(lic)}
                            disabled={isStacked}
                            className={`px-4 py-2 text-[10.5px] font-mono font-bold uppercase border border-ink cursor-pointer flex items-center gap-1.5 ${
                              isStacked 
                                ? "bg-safe/20 border-safe text-safe" 
                                : "bg-paper hover:bg-paper-dark text-ink shadow-[2.5px_2.5px_0px_#000] hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all"
                            }`}
                          >
                            {isStacked ? "✓ Tracción Licitación Stackeada" : "+ Guardar en Pila de Sinergias"}
                          </button>

                          <a
                            href={getGoogleCalendarUrl({
                              id: lic.id,
                              name: lic.name,
                              deadlineISO: lic.deadlineISO || "2026-05-27",
                              description: lic.description,
                              url: lic.url,
                              chileCode: lic.chileCode
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

                          <CalendarButton item={lic} className="px-4 py-2 text-[10.5px]" />

                          {lic.id.startsWith("custom-") && (
                            <>
                              <button
                                onClick={() => onArchiveFund?.(lic.id)}
                                className="ml-auto px-3 py-2 text-[10px] font-mono font-bold uppercase border border-ink/30 hover:border-ink text-ink/40 hover:text-ink flex items-center gap-1.5 transition-colors cursor-pointer"
                                title={archivedFundIds.includes(lic.id) ? "Restaurar" : "Archivar"}
                              >
                                {archivedFundIds.includes(lic.id)
                                  ? <><ArchiveRestore className="h-3.5 w-3.5" /> Restaurar</>
                                  : <><Archive className="h-3.5 w-3.5" /> Archivar</>
                                }
                              </button>
                              <button
                                onClick={() => onDeleteFund?.(lic.id)}
                                className="px-3 py-2 text-[10px] font-mono font-bold uppercase border border-alert/40 bg-alert/5 hover:bg-alert hover:text-white text-alert flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Eliminar definitivamente"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Borrar
                              </button>
                            </>
                          )}
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
