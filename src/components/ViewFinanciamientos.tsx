import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, SlidersHorizontal, ArrowUpDown, Calendar, HelpCircle, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XOctagon, Copy, Check, CalendarDays, Filter, Landmark, Flame, Archive, ArchiveRestore, Trash2, Send, LayoutList, Table2 } from "lucide-react";
import { Fund, FundStatus, MiltonProfile, Entity } from "../types";
import { ALL_FUNDS } from "../data";
import { formatCLP, getGoogleCalendarUrl } from "../utils";
import { SECTION_COPY } from "../copy";
import CalendarButton from "./CalendarButton";
import EligibilityChecklist from "./EligibilityChecklist";
import MapWidget from "./MapWidget";
import SectionHeader from "./SectionHeader";
import NextActionBanner from "./NextActionBanner";

interface ViewFinanciamientosProps {
  profile: MiltonProfile;
  onAddToStack: (fund: Fund) => void;
  stackedFunds: Fund[];
  starredFunds?: string[];
  onToggleStar?: (id: string) => void;
  extraFunds?: Fund[];
  archivedFundIds?: string[];
  onDeleteFund?: (id: string) => void;
  onArchiveFund?: (id: string) => void;
  appliedFundIds?: string[];
  onToggleApplied?: (id: string) => void;
}

export default function ViewFinanciamientos({ profile, onAddToStack, stackedFunds, starredFunds = [], onToggleStar, extraFunds = [], archivedFundIds = [], onDeleteFund, onArchiveFund, appliedFundIds = [], onToggleApplied }: ViewFinanciamientosProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"TODOS" | "URGENTES" | "MUJERES" | "SEMILLA" | "ID_INNOVACION" | "CERRADO">("TODOS");
  const [sortBy, setSortBy] = useState<"URGENCY" | "AMOUNT" | "CLOSE_DATE">("URGENCY");
  const [expandedFundId, setExpandedFundId] = useState<string | null>("corfo-semilla-inicia-rm-2026");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filter content
  const financiamientos = useMemo(() => {
    return [...ALL_FUNDS, ...extraFunds].filter(f => f.type === "financiamiento");
  }, [extraFunds]);

  const computeEligibility = (fund: Fund) => {
    if (fund.status === FundStatus.CLOSED) {
      return { status: "Cerrado", color: "text-ink/60 bg-[#ccc] border-ink", icon: <XOctagon className="h-3.5 w-3.5" />, score: 0 };
    }
    
    if (fund.eligibilityGenderRequired && !profile.hasWoman) {
      return { status: "EXCLUIDO (REQUIERE SOCIA)", color: "text-white bg-alert border-ink", icon: <AlertTriangle className="h-3.5 w-3.5" />, score: 1 };
    }

    const missingDocs: string[] = [];
    if (fund.requiresSpA && !profile.hasSpA) missingDocs.push("Crear SpA");
    if (fund.SIIRequired && !profile.hasSiiInitiated) missingDocs.push("Iniciar SII");
    if (fund.eligibilitySalesRestricted && profile.hasSales) missingDocs.push("Ventas deben ser $0");

    if (missingDocs.length > 0) {
      return { 
        status: `REQUISITO: ${missingDocs.join(", ")}`, 
        color: "text-ink bg-warning border-ink", 
        icon: <SlidersHorizontal className="h-3.5 w-3.5" />, 
        score: 3 
      };
    }

    return { 
      status: "ELEGIBLE COMPATIBLE", 
      color: "text-white bg-safe border-ink", 
      icon: <CheckCircle2 className="h-3.5 w-3.5" />, 
      score: 5 
    };
  };

  // Final filtered list
  const filteredFunds = useMemo(() => {
    return financiamientos.filter((fund) => {
      const matchesSearch = 
        fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.description.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case "URGENTES":
          return (fund.urgency === "CRITICAL" || fund.urgency === "HIGH") && fund.urgency !== "CLOSED";
        case "MUJERES":
          return fund.eligibilityGenderRequired === true && fund.urgency !== "CLOSED";
        case "SEMILLA":
          return (fund.category === "Seed" || fund.category === "Growth") && fund.urgency !== "CLOSED";
        case "ID_INNOVACION":
          return (fund.category === "R&D" || fund.category === "Innovation") && fund.urgency !== "CLOSED";
        case "CERRADO":
          return fund.urgency === "CLOSED" || fund.status === FundStatus.CLOSED;
        case "TODOS":
        default:
          return fund.urgency !== "CLOSED" && fund.status !== FundStatus.CLOSED;
      }
    });
  }, [financiamientos, searchTerm, activeFilter]);

  // Sorted list
  const sortedFunds = useMemo(() => {
    const list = [...filteredFunds];
    if (sortBy === "AMOUNT") {
      return list.sort((a, b) => b.amountNumber - a.amountNumber);
    } else if (sortBy === "CLOSE_DATE") {
      const priorityMap: Record<string, number> = {
        [FundStatus.TODAY]: 1,
        [FundStatus.TOMORROW]: 2,
        [FundStatus.THREE_DAYS]: 3,
        [FundStatus.UPCOMING]: 4,
        [FundStatus.OPEN]: 5,
        [FundStatus.RECURRENT]: 6,
        [FundStatus.VERIFY]: 7,
        [FundStatus.PENDING_OPENING]: 8,
        [FundStatus.ALWAYS]: 9,
        [FundStatus.CLOSED]: 10,
      };
      return list.sort((a, b) => (priorityMap[a.status] || 99) - (priorityMap[b.status] || 99));
    } else {
      const urgencyMap = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4, CLOSED: 5 };
      return list.sort((a, b) => (urgencyMap[a.urgency] || 9) - (urgencyMap[b.urgency] || 9));
    }
  }, [filteredFunds, sortBy]);

  const toggleExpand = (id: string) => {
    setExpandedFundId(expandedFundId === id ? null : id);
  };

  const getUrgencyBadge = (urgency: string, statusText: string) => {
    switch (urgency) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 bg-alert px-2.5 py-0.5 text-[9.5px] font-mono font-bold text-white border border-ink uppercase">
            ⚠️ {statusText}
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 bg-warning px-2.5 py-0.5 text-[9.5px] font-mono font-bold text-ink border border-ink uppercase">
            ⚡ {statusText}
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 bg-paper px-2 py-0.5 text-[9.5px] font-mono font-bold text-ink/80 border border-ink/45 uppercase">
            {statusText}
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1 bg-[#ccc] border border-ink px-2 py-0.5 text-[9.5px] text-ink/60 font-mono uppercase">
            {statusText}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-paper border border-ink/20 px-2 py-0.5 text-[9.5px] text-ink/70">
            {statusText}
          </span>
        );
    }
  };

  return (
    <div id="subsidios-financiamientos-tab" className="space-y-6">
      <SectionHeader copy={SECTION_COPY.financiamientos} />
      <NextActionBanner section="financiamientos" funds={ALL_FUNDS} starredIds={starredFunds} profile={profile} />

      {/* Search and Filters Controls */}
      <div className="bg-paper border-2 border-ink p-5 shadow-[3px_3px_0px_rgba(0,0,0,1)] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        
        {/* Left Side: Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink/50">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar Subsidios o Fondos de Fomento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-ink bg-paper py-2.5 pl-10 pr-4 text-xs text-ink placeholder-ink/65 hover:bg-paper-dark/30 focus:bg-paper focus:outline-none focus:ring-0"
          />
        </div>

        {/* Right Side: Sorting Options + View toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex border border-ink bg-paper p-0.5">
            <button onClick={() => setViewMode("cards")} className={`px-2 py-1 text-[10px] font-mono transition-all cursor-pointer ${viewMode === "cards" ? "bg-ink text-paper" : "bg-paper hover:bg-paper-dark text-ink"}`} title="Vista tarjetas">
              <LayoutList className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setViewMode("table")} className={`px-2 py-1 text-[10px] font-mono transition-all cursor-pointer ${viewMode === "table" ? "bg-ink text-paper" : "bg-paper hover:bg-paper-dark text-ink"}`} title="Vista tabla">
              <Table2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-ink/90">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>Ordenar:</span>
          </div>
          <div className="flex border border-ink bg-paper p-0.5">
            <button
              onClick={() => setSortBy("URGENCY")}
              className={`px-3 py-1 text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                sortBy === "URGENCY" ? "bg-ink text-paper" : "bg-paper hover:bg-paper-dark text-ink"
              }`}
            >
              Urgencia
            </button>
            <button
              onClick={() => setSortBy("AMOUNT")}
              className={`px-3 py-1 text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                sortBy === "AMOUNT" ? "bg-ink text-paper" : "bg-paper hover:bg-paper-dark text-ink"
              }`}
            >
              Monto CLP
            </button>
            <button
              onClick={() => setSortBy("CLOSE_DATE")}
              className={`px-3 py-1 text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                sortBy === "CLOSE_DATE" ? "bg-ink text-paper" : "bg-paper hover:bg-paper-dark text-ink"
              }`}
            >
              Cierre
            </button>
          </div>
        </div>

      </div>

      {/* Categories Fast Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {(["TODOS", "URGENTES", "MUJERES", "SEMILLA", "ID_INNOVACION", "CERRADO"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 font-mono text-xs border transition-all cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
              activeFilter === filter
                ? filter === "CERRADO"
                  ? "bg-ink/50 text-white font-extrabold border-ink"
                  : "bg-accent-green text-white font-extrabold border-ink"
                : filter === "CERRADO"
                  ? "bg-paper border-ink/40 text-ink/50 hover:bg-paper-dark"
                  : "bg-paper border-ink hover:bg-paper-dark text-ink"
            }`}
          >
            {filter === "TODOS" ? "💼 Activos" : filter === "URGENTES" ? "🚨 Cierre Urgente" : filter === "MUJERES" ? "♀️ Enfoque de Género" : filter === "SEMILLA" ? "🌱 Semilla / Escalamiento" : filter === "ID_INNOVACION" ? "🔬 I+D Tecnológica" : "🔒 Cerrados"}
          </button>
        ))}
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="border-2 border-ink overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-ink text-paper text-[10px] uppercase tracking-wider">
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Entidad</th>
                <th className="px-3 py-2 text-right">Monto</th>
                <th className="px-3 py-2 text-left">Cierre</th>
                <th className="px-3 py-2 text-center">Urgencia</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 text-center">Acc.</th>
              </tr>
            </thead>
            <tbody>
              {sortedFunds.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-ink/40">Sin resultados</td></tr>
              ) : sortedFunds.map(fund => {
                const eligibility = computeEligibility(fund);
                const isApplied = appliedFundIds.includes(fund.id);
                const isClosed = fund.urgency === "CLOSED" || fund.status === FundStatus.CLOSED;
                return (
                  <tr key={fund.id} className={`border-t border-ink/15 hover:bg-paper-dark/40 ${isClosed ? "opacity-50" : ""} ${isApplied ? "bg-accent-green/5" : ""}`}>
                    <td className="px-3 py-2">
                      <a href={fund.url} target="_blank" rel="noopener noreferrer" className="font-bold text-ink hover:underline line-clamp-2 block max-w-xs">{fund.name}</a>
                      {isApplied && <span className="text-[8px] font-black text-accent-green uppercase">✓ postulé</span>}
                    </td>
                    <td className="px-3 py-2 text-ink/70 whitespace-nowrap">{fund.entity}</td>
                    <td className="px-3 py-2 text-right font-black text-alert whitespace-nowrap">{formatCLP(fund.amountNumber)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-ink/70">{fund.deadline}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-1.5 py-0.5 text-[8px] font-black border border-ink ${
                        fund.urgency === "CRITICAL" ? "bg-alert text-white" :
                        fund.urgency === "HIGH" ? "bg-warning text-ink" :
                        fund.urgency === "CLOSED" ? "bg-ink/30 text-white" : "bg-paper-dark text-ink"
                      }`}>{fund.urgency}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 border ${eligibility.color}`}>{eligibility.status.slice(0,12)}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <button onClick={() => onAddToStack(fund)} className="px-1.5 py-0.5 bg-paper border border-ink text-[8px] font-bold hover:bg-paper-dark cursor-pointer" title="Agregar al stack">+</button>
                        <button onClick={() => onToggleApplied?.(fund.id)} className={`px-1.5 py-0.5 border text-[8px] font-bold cursor-pointer ${isApplied ? "bg-accent-green text-white border-accent-green" : "border-accent-green/50 text-accent-green hover:bg-accent-green hover:text-white"}`} title="Marcar postulado">✓</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Main Roster List (Cards) */}
      {viewMode === "cards" && <div className="space-y-4">
        {sortedFunds.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-ink bg-paper-dark/30">
            <SlidersHorizontal className="mx-auto h-12 w-12 text-ink/40 animate-pulse" />
            <h5 className="font-sans font-bold text-base text-ink mt-3">No se encontraron financiamientos</h5>
            <p className="text-xs text-ink/65 mt-1 max-w-sm mx-auto">Prueba limpiando tu cuadro de búsquedas o seleccionando otros filtros.</p>
          </div>
        ) : (
          sortedFunds.map((fund) => {
            const isExpanded = expandedFundId === fund.id;
            const eligibility = computeEligibility(fund);
            const isStacked = stackedFunds.some(f => f.id === fund.id);

            const isClosed = fund.urgency === "CLOSED" || fund.status === FundStatus.CLOSED;
            const isApplied = appliedFundIds.includes(fund.id);
            return (
              <div
                key={fund.id}
                className={`bg-paper border-2 ${
                  isApplied ? "border-accent-green" : isClosed ? "border-ink/30 opacity-60" : fund.urgency === "CRITICAL" ? "border-alert" : "border-ink"
                } shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all`}
              >
                
                {/* Header card banner row */}
                <div 
                  onClick={() => toggleExpand(fund.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer select-none hover:bg-paper-dark/40"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-ink text-paper px-2 py-0.5">
                        {fund.entity}
                      </span>
                      <span className="bg-accent-green/15 text-accent-green border border-accent-green/30 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase">
                        {fund.category}
                      </span>
                      {getUrgencyBadge(fund.urgency, fund.deadline)}
                      {isApplied && (
                        <span className="bg-accent-green text-white px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider border border-accent-green">
                          ✓ POSTULÉ
                        </span>
                      )}
                    </div>

                    <h4 className="font-sans font-black text-lg text-ink tracking-tight truncate">
                      {fund.name}
                    </h4>

                    <p className="text-xs font-serif text-ink/80 truncate max-w-3xl">
                      {fund.description}
                    </p>
                  </div>

                  {/* Pricing metrics & Eligibility visual indicator */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-2 border-t border-ink/10 md:border-t-0 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="block text-[8px] font-mono uppercase text-ink/50 leading-none">Monto Máximo</span>
                      <strong className="text-sm md:text-[15px] font-mono font-black text-alert block mt-1">
                        {formatCLP(fund.amountNumber)}
                      </strong>
                    </div>

                    {/* Eligibility Badge */}
                    <div className={`px-2 py-1 text-[9px] font-mono font-bold flex items-center gap-1 border ${eligibility.color}`}>
                      {eligibility.icon}
                      <span>{eligibility.status}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded deep-dive drawer panel */}
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
                        
                        {/* Two Col Grid: Left Details / Right checklists */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
                          
                          {/* Left Col: Core description */}
                          <div className="space-y-4">
                            <div>
                              <strong className="block text-[10px] font-mono uppercase tracking-widest text-ink/65 mb-1">Monto y Cofinanciamiento:</strong>
                              <p className="font-serif italic text-sm text-ink">{fund.amount}</p>
                              <p className="text-[11px] text-ink/80 mt-1">Soporte gubernamental: {fund.cofinancing}</p>
                            </div>

                            <div>
                              <strong className="block text-[10px] font-mono uppercase tracking-widest text-ink/65 mb-1 block">¿Cómo le afecta a Milton?</strong>
                              <div className="bg-paper p-3 border-l-4 border-accent-green border-y border-r border-ink/20 font-serif">
                                {fund.miltonAplica}
                              </div>
                            </div>

                            <div>
                              <strong className="block text-[10px] font-mono uppercase tracking-widest text-alert/90 mb-1 font-bold">💡 Tip Estratégico de Postulación:</strong>
                              <p className="font-serif text-ink">{fund.tips}</p>
                            </div>

                            <div>
                              <strong className="block text-[10px] font-mono uppercase tracking-widest text-ink/65 mb-2">Tu Elegibilidad Actual:</strong>
                              <EligibilityChecklist fund={fund} profile={profile} />
                            </div>
                          </div>

                          {/* Right Col: Admin requirements list with copyable URLs */}
                          <div className="space-y-4">
                            <div>
                              <strong className="block text-[10px] font-mono uppercase tracking-widest text-ink/65 mb-1.5">Requisitos Legales para Adjudicación:</strong>
                              <ul className="space-y-1.5">
                                {fund.requirements.map((req, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="text-alert font-bold font-mono shrink-0">•</span>
                                    <span className="font-serif text-ink/90 leading-snug">{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Copy details */}
                            <div className="pt-2 border-t border-ink/20 leading-relaxed font-mono space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-ink/60">Bases Legales URL:</span>
                                <a 
                                  href={fund.url} 
                                  target="_blank" 
                                  referrerPolicy="no-referrer"
                                  rel="noopener noreferrer" 
                                  className="text-alert hover:underline flex items-center gap-1 font-bold transition-all text-[10px]"
                                >
                                  {fund.referenceUrlText}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-ink/60">Enlace de Postulación Directa:</span>
                                <button
                                  onClick={() => handleCopyCode(fund.url, fund.id)}
                                  className="text-accent-blue font-bold flex items-center gap-1.5 text-[10px] cursor-pointer hover:underline"
                                >
                                  <span>{copiedId === fund.id ? "¡Copiado!" : "Copiar Enlace"}</span>
                                  {copiedId === fund.id ? <Check className="h-3 w-3 text-safe" /> : <Copy className="h-3 w-3" />}
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Map widget if address available */}
                        {fund.address && (
                          <div>
                            <strong className="block text-[10px] font-mono uppercase tracking-widest text-ink/65 mb-2">Ubicación del Organismo:</strong>
                            <MapWidget address={fund.address} />
                          </div>
                        )}

                        {/* Interactive Buttons footer inside drawer */}
                        <div className="flex gap-2 items-center pt-4 border-t border-ink/20 flex-wrap">
                          <a
                            href={fund.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-accent-green text-white font-mono font-black uppercase text-[11px] border-2 border-ink shadow-[3px_3px_0px_#000] hover:translate-y-[-1px] active:translate-y-[0.5px] transition-all inline-flex items-center gap-2 cursor-pointer"
                          >
                            POSTULAR AHORA
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            onClick={() => onAddToStack(fund)}
                            disabled={isStacked}
                            className={`px-4 py-2 text-[10.5px] font-mono font-bold uppercase border border-ink cursor-pointer flex items-center gap-1.5 ${
                              isStacked 
                                ? "bg-safe/20 border-safe text-safe" 
                                : "bg-paper hover:bg-paper-dark text-ink shadow-[2.5px_2.5px_0px_#000] hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all"
                            }`}
                          >
                            {isStacked ? "✓ Subsidio Agregado al Simulador" : "+ Stackear este Subsidio"}
                          </button>

                          <a
                            href={getGoogleCalendarUrl({
                              id: fund.id,
                              name: fund.name,
                              deadlineISO: fund.deadlineISO || "2026-05-27",
                              description: fund.description,
                              url: fund.url,
                              chileCode: fund.chileCode
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

                          <CalendarButton item={fund} className="px-4 py-2 text-[10.5px]" />

                          <button
                            onClick={() => onToggleApplied?.(fund.id)}
                            className={`px-3 py-2 text-[10px] font-mono font-bold uppercase border flex items-center gap-1.5 transition-colors cursor-pointer ${
                              appliedFundIds.includes(fund.id)
                                ? "bg-accent-green text-white border-accent-green"
                                : "border-accent-green/50 text-accent-green hover:bg-accent-green hover:text-white"
                            }`}
                            title={appliedFundIds.includes(fund.id) ? "Marcar como no postulado" : "Marcar como postulado"}
                          >
                            <Send className="h-3.5 w-3.5" />
                            {appliedFundIds.includes(fund.id) ? "✓ Postulé" : "Postulé"}
                          </button>

                          {fund.id.startsWith("custom-") && (
                            <>
                              <button
                                onClick={() => onArchiveFund?.(fund.id)}
                                className="ml-auto px-3 py-2 text-[10px] font-mono font-bold uppercase border border-ink/30 hover:border-ink text-ink/40 hover:text-ink flex items-center gap-1.5 transition-colors cursor-pointer"
                                title={archivedFundIds.includes(fund.id) ? "Restaurar" : "Archivar (ocultar de esta vista)"}
                              >
                                {archivedFundIds.includes(fund.id)
                                  ? <><ArchiveRestore className="h-3.5 w-3.5" /> Restaurar</>
                                  : <><Archive className="h-3.5 w-3.5" /> Archivar</>
                                }
                              </button>
                              <button
                                onClick={() => onDeleteFund?.(fund.id)}
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
      </div>}

    </div>
  );
}
