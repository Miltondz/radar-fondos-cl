import React, { Fragment, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, SlidersHorizontal, ArrowUpDown, Calendar, HelpCircle, 
  ExternalLink, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, 
  XOctagon, DollarSign, Award, Landmark, Filter, Check, HeartCrack, Flame
} from "lucide-react";
import { Fund, FundStatus, MiltonProfile, Entity } from "../types";
import { ALL_FUNDS } from "../data";

interface FundingDashboardProps {
  profile: MiltonProfile;
  onAddToStack: (fund: Fund) => void;
  stackedFunds: Fund[];
}

export default function FundingDashboard({ profile, onAddToStack, stackedFunds }: FundingDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"TODOS" | "URGENTES" | "MUJERES" | "SEMILLA" | "ID_INNOVACION" | "CREDITOS">("TODOS");
  const [sortBy, setSortBy] = useState<"URGENCY" | "AMOUNT" | "CLOSE_DATE">("URGENCY");
  const [expandedFundId, setExpandedFundId] = useState<string | null>("sercotec-abeja-2026"); // Default first open for visual interest

  // Helper to compute exact dynamic status for a fund based on current inputs
  const computeEligibility = (fund: Fund) => {
    if (fund.status === FundStatus.CLOSED) {
      return { status: "Cerrado", color: "text-ink/60 bg-[#ccc] border-ink", icon: <XOctagon className="h-3.5 w-3.5" />, score: 0 };
    }
    
    if (fund.eligibilityGenderRequired && !profile.hasWoman) {
      return { status: "EXCLUIDO (REQUIERE SOCIA)", color: "text-white bg-alert border-ink", icon: <HeartCrack className="h-3.5 w-3.5" />, score: 1 };
    }

    const missingDocs: string[] = [];
    if (fund.requiresSpA && !profile.hasSpA) missingDocs.push("Crear SpA");
    if (fund.SIIRequired && !profile.hasSiiInitiated) missingDocs.push("Iniciar SII");
    if (fund.eligibilitySalesRestricted && profile.hasSales) missingDocs.push("Ventas deben ser $0");

    if (missingDocs.length > 0) {
      return { 
        status: `REQUISITO: ${missingDocs.join(", ")}`, 
        color: "text-ink bg-warning border-ink", 
        icon: <AlertTriangle className="h-3.5 w-3.5" />, 
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

  // Filtering funds
  const filteredFunds = useMemo(() => {
    return ALL_FUNDS.filter((fund) => {
      // Search matches name, entity, description or category
      const matchesSearch = 
        fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.category.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Filter category
      switch (activeFilter) {
        case "URGENTES":
          return fund.urgency === "CRITICAL" || fund.urgency === "HIGH";
        case "MUJERES":
          return fund.eligibilityGenderRequired === true;
        case "SEMILLA":
          return fund.category === "Seed" || fund.category === "Growth";
        case "ID_INNOVACION":
          return fund.category === "R&D" || fund.category === "Innovation";
        case "CREDITOS":
          return fund.category === "Credit";
        case "TODOS":
        default:
          return true;
      }
    });
  }, [searchTerm, activeFilter]);

  // Sorting funds
  const sortedFunds = useMemo(() => {
    const list = [...filteredFunds];
    if (sortBy === "AMOUNT") {
      return list.sort((a, b) => b.amountNumber - a.amountNumber);
    } else if (sortBy === "CLOSE_DATE") {
      // Rough priority sort on close dates
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
      // Default: Urgency Sort
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
          <span className="inline-flex items-center gap-1 bg-alert px-2 py-0.5 text-[9px] font-mono font-bold text-white border border-ink uppercase">
            ⚠️ {statusText}
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 bg-warning px-2 py-0.5 text-[9px] font-mono font-bold text-ink border border-ink uppercase">
            ⚡ {statusText}
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 bg-paper px-2 py-0.5 text-[9px] font-mono font-bold text-ink/80 border border-ink/40 uppercase">
            {statusText}
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1 bg-[#ccc] border border-ink px-2 py-0.5 text-[9px] text-ink/60 font-mono uppercase">
            {statusText}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-paper border border-ink/20 px-2 py-0.5 text-[9px] text-ink/70">
            {statusText}
          </span>
        );
    }
  };

  const getEntityIcon = (entity: Entity) => {
    switch (entity) {
      case Entity.CORFO:
        return <Award className="h-4 w-4 text-ink" />;
      case Entity.SERCOTEC:
        return <Landmark className="h-4 w-4 text-ink" />;
      case Entity.STARTUP_CHILE:
        return <Flame className="h-4 w-4 text-ink" />;
      default:
        return <DollarSign className="h-4 w-4 text-ink" />;
    }
  };

  return (
    <div className="flex flex-col gap-6" id="funding-control-board">
      
      {/* Title block */}
      <div>
        <h2 className="font-serif text-3xl font-black text-ink flex flex-wrap items-center gap-2">
          <span>La Gran Tabla de Control v4</span>
          <span className="font-mono text-xs font-bold text-paper bg-ink px-2.5 py-0.5 uppercase tracking-wider">
            {sortedFunds.length} FONDOS ACTIVOS
          </span>
        </h2>
        <p className="text-ink/80 font-serif italic text-sm mt-1 max-w-3xl leading-relaxed">
          Utilice los filtros de categoría para segmentar las líneas y presione sobre cualquier fila para auditar las bases de postulación y las claves técnicas.
        </p>
      </div>

      {/* Control panel: search, categorical filters, sorting */}
      <div className="bg-paper border-2 border-ink p-4 shadow-[4px_4px_0px_#1a1a1a]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          
          {/* Text input search */}
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-ink/50" />
            </div>
            <input
              type="text"
              className="w-full bg-paper-dark border border-ink pl-9 pr-4 py-2 text-sm text-ink placeholder-ink/60 focus:outline-none focus:ring-0"
              placeholder="Buscar por fondo, entidad, descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              id="search-funds-input"
            />
          </div>

          {/* Sorting buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-ink/70 flex items-center gap-1 font-mono uppercase font-bold">
              <ArrowUpDown className="h-3.5 w-3.5 text-ink" />
              Ordenar:
            </span>
            <div className="inline-flex bg-paper border border-ink p-0.5">
              <button
                onClick={() => setSortBy("URGENCY")}
                className={`px-3 py-1 text-xs font-mono font-black uppercase cursor-pointer transition-colors ${
                  sortBy === "URGENCY" ? "bg-ink text-paper" : "text-ink/65 hover:text-ink hover:underline"
                }`}
              >
                Urgencia
              </button>
              <button
                onClick={() => setSortBy("CLOSE_DATE")}
                className={`px-3 py-1 text-xs font-mono font-black uppercase cursor-pointer transition-colors ${
                  sortBy === "CLOSE_DATE" ? "bg-ink text-paper" : "text-ink/65 hover:text-ink hover:underline"
                }`}
              >
                Cierre
              </button>
              <button
                onClick={() => setSortBy("AMOUNT")}
                className={`px-3 py-1 text-xs font-mono font-black uppercase cursor-pointer transition-colors ${
                  sortBy === "AMOUNT" ? "bg-ink text-paper" : "text-ink/65 hover:text-ink hover:underline"
                }`}
              >
                Monto
              </button>
            </div>
          </div>

        </div>

        {/* Categorized Pills row */}
        <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-ink/20">
          <button
            onClick={() => setActiveFilter("TODOS")}
            className={`cursor-pointer px-3 py-1.5 text-xs font-mono font-bold uppercase border border-ink ${
              activeFilter === "TODOS" 
                ? "bg-ink text-paper font-black" 
                : "bg-paper text-ink hover:bg-paper-dark"
            }`}
          >
            Todos los Fondos
          </button>
          
          <button
            onClick={() => setActiveFilter("URGENTES")}
            className={`cursor-pointer px-3 py-1.5 text-xs font-mono font-bold uppercase border border-ink flex items-center gap-1.5 ${
              activeFilter === "URGENTES" 
                ? "bg-alert text-white font-black" 
                : "bg-paper text-alert/90 hover:bg-paper-dark border-ink"
            }`}
          >
            ⚠️ Urgentes esta Semana
          </button>

          <button
            onClick={() => setActiveFilter("MUJERES")}
            className={`cursor-pointer px-3 py-1.5 text-xs font-mono font-bold uppercase border border-ink flex items-center gap-1.5 ${
              activeFilter === "MUJERES" 
                ? "bg-ink text-white font-black underline decoration-2 decoration-alert" 
                : "bg-paper text-ink hover:bg-paper-dark"
            }`}
          >
            🌸 Enfoque Mujeres
          </button>

          <button
            onClick={() => setActiveFilter("SEMILLA")}
            className={`cursor-pointer px-3 py-1.5 text-xs font-mono font-bold uppercase border border-ink ${
              activeFilter === "SEMILLA" 
                ? "bg-ink text-paper font-black" 
                : "bg-paper text-ink hover:bg-paper-dark"
            }`}
          >
            🌱 Semilla & Escalamiento
          </button>

          <button
            onClick={() => setActiveFilter("ID_INNOVACION")}
            className={`cursor-pointer px-3 py-1.5 text-xs font-mono font-bold uppercase border border-ink ${
              activeFilter === "ID_INNOVACION" 
                ? "bg-ink text-paper font-black" 
                : "bg-paper text-ink hover:bg-paper-dark"
            }`}
          >
            🔬 I+D Innovación
          </button>

          <button
            onClick={() => setActiveFilter("CREDITOS")}
            className={`cursor-pointer px-3 py-1.5 text-xs font-mono font-bold uppercase border border-ink ${
              activeFilter === "CREDITOS" 
                ? "bg-ink text-paper font-black" 
                : "bg-paper text-ink hover:bg-paper-dark"
            }`}
          >
            🏦 Créditos
          </button>
        </div>

      </div>

      {/* Main interactive table + sub-collapse render */}
      <div className="border-2 border-ink bg-paper overflow-hidden shadow-[4px_4px_0px_#1a1a1a]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-ink bg-paper-dark text-ink uppercase text-[10px] font-mono tracking-wider font-bold">
                <th className="py-3 px-4 font-bold border-r border-ink/20">Fondo / Convocatoria</th>
                <th className="py-3 px-4 font-bold border-r border-ink/20 hidden md:table-cell">Entidad</th>
                <th className="py-3 px-4 font-bold border-r border-ink/20">Inyección Financiera</th>
                <th className="py-3 px-4 font-bold border-r border-ink/20 hidden sm:table-cell">Cierre</th>
                <th className="py-3 px-4 font-bold border-r border-ink/20">Urgencia</th>
                <th className="py-3 px-4 font-bold text-right">Elegibilidad Milton</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-ink/20">
              {sortedFunds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink/70">
                    <p className="text-sm font-serif italic">No se encontraron líneas que coincidan con la búsqueda.</p>
                    <p className="text-xs font-mono mt-1">Pruebe seleccionando "Todos los Fondos".</p>
                  </td>
                </tr>
              ) : (
                sortedFunds.map((fund) => {
                  const isExpanded = expandedFundId === fund.id;
                  const eligibility = computeEligibility(fund);
                  const isAlreadyStacked = stackedFunds.some(f => f.id === fund.id);

                  return (
                    <Fragment key={fund.id}>
                      {/* Main Row */}
                      <tr 
                        onClick={() => toggleExpand(fund.id)}
                        className={`group cursor-pointer hover:bg-paper-dark/40 transition-colors ${
                          isExpanded ? "bg-paper-dark font-semibold border-l-4 border-l-ink" : ""
                        }`}
                      >
                        {/* Name & ID line */}
                        <td className="py-4 px-4 border-r border-ink/10">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 p-1.5 border border-ink bg-paper flex items-center justify-center">
                              {getEntityIcon(fund.entity)}
                            </div>
                            <div>
                              <span className="font-bold text-sm text-ink group-hover:underline block leading-snug">
                                {fund.name}
                              </span>
                              <span className="text-[10px] text-ink/60 font-mono tracking-wide md:hidden">
                                {fund.entity}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Entity (Desktop only) */}
                        <td className="py-4 px-4 hidden md:table-cell border-r border-ink/10">
                          <span className="text-xs font-mono font-medium text-ink">
                            {fund.entity}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 border-r border-ink/10">
                          <span className="font-mono text-xs font-extrabold text-ink block">
                            {fund.amountNumber > 0 
                              ? `$${(fund.amountNumber / 1000000).toFixed(1)}M CLP`
                              : fund.amount
                            }
                          </span>
                          <span className="text-[9px] font-mono text-ink/50 block uppercase">
                            {fund.category}
                          </span>
                        </td>

                        {/* Deadline (Hidden on small mobile) */}
                        <td className="py-4 px-4 hidden sm:table-cell border-r border-ink/10">
                          <div className="flex items-center gap-1 text-ink/90 text-xs font-mono">
                            <Calendar className="h-3 w-3 text-ink/60" />
                            {fund.deadline}
                          </div>
                        </td>

                        {/* Urgency Badge */}
                        <td className="py-4 px-4 border-r border-ink/10">
                          {getUrgencyBadge(fund.urgency, fund.status)}
                        </td>

                        {/* Dynamic Eligibility Match */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[9px] font-mono font-black uppercase ${eligibility.color}`}>
                              {eligibility.icon}
                              <span>{eligibility.status}</span>
                            </span>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-ink" /> : <ChevronDown className="h-4 w-4 text-ink/60 group-hover:text-ink" />}
                          </div>
                        </td>

                      </tr>

                      {/* Expanding Child details */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-paper-dark border-t border-ink p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="p-5 border-t border-ink grid grid-cols-1 md:grid-cols-12 gap-6 leading-relaxed bg-paper">
                                  
                                  {/* Left Info Panel */}
                                  <div className="md:col-span-8 flex flex-col gap-4">
                                    <div>
                                      <h4 className="text-xs font-mono uppercase tracking-wider text-ink/60 font-bold border-b border-ink/10 pb-1">Descripción de la Convocatoria</h4>
                                      <p className="text-xs font-serif text-ink mt-1.5 leading-relaxed">
                                        {fund.description}
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-paper-dark p-3.5 border border-ink">
                                      <div>
                                        <h5 className="text-[10px] font-mono uppercase text-ink/60">Esquema de Cofinanciamiento</h5>
                                        <p className="text-xs font-bold text-ink mt-0.5">{fund.cofinancing}</p>
                                      </div>
                                      <div>
                                        <h5 className="text-[10px] font-mono uppercase text-ink/60">Diagnóstico para Milton</h5>
                                        <p className="text-xs font-bold text-alert mt-0.5">{fund.miltonAplica}</p>
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="text-xs font-mono uppercase tracking-wider text-ink/60 font-bold border-b border-ink/10 pb-1">Requisitos Técnicos de Bases</h4>
                                      <ul className="mt-2 space-y-1.5">
                                        {fund.requirements.map((req, idx) => (
                                          <li key={idx} className="text-xs text-ink/90 flex items-start gap-1.5 font-serif">
                                            <span className="w-1.5 h-1.5 bg-ink mt-2 shrink-0" />
                                            <span>{req}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>

                                  {/* Right strategic panel */}
                                  <div className="md:col-span-4 bg-paper-dark border-2 border-ink p-4 flex flex-col justify-between gap-4 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-1 text-[11px] text-alert font-mono font-bold uppercase tracking-wider">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                        <span>TIP DE ADJUDICACIÓN DE CONSULTORÍA</span>
                                      </div>
                                      <p className="text-xs text-ink italic font-serif bg-white p-3 border border-ink leading-relaxed">
                                        "{fund.tips}"
                                      </p>
                                      
                                      <div className="text-[10px] text-ink/80 flex flex-col gap-1 font-mono pt-1">
                                        <div>• Línea de Fomento: {fund.category}</div>
                                        <div>• Recomendación Constitución: {fund.requiresSpA ? "SpA de Comercio" : "Persona Natural permitida"}</div>
                                        <div>• Ventas permitidas: {fund.eligibilitySalesRestricted ? "$0 (Idea pura)" : "Sin restricción técnica"}</div>
                                        <div>• Calendario Cierre: {fund.deadline}</div>
                                      </div>
                                    </div>

                                    <div className="flex flex-col gap-2 pt-2 border-t border-ink/15">
                                      <a
                                        href={fund.url}
                                        target="_blank"
                                        referrerPolicy="no-referrer"
                                        rel="noopener noreferrer"
                                        className="inline-flex w-full items-center justify-center gap-1.5 bg-ink hover:bg-ink/90 text-paper font-mono font-black uppercase text-xs py-2 border.5 border-ink cursor-pointer tracking-wider "
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Página Oficial
                                      </a>
                                      
                                      {fund.status !== FundStatus.CLOSED && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onAddToStack(fund);
                                          }}
                                          disabled={isAlreadyStacked}
                                          className={`relative inline-flex items-center justify-center border-2 border-ink px-3 py-2 font-mono font-black uppercase text-xs cursor-pointer transition-all ${
                                            isAlreadyStacked 
                                              ? "bg-[#ccc] text-ink/40 cursor-not-allowed" 
                                              : "bg-paper hover:bg-paper-dark text-ink"
                                          }`}
                                        >
                                          {isAlreadyStacked ? <Check className="h-3.5 w-3.5 mr-1 text-safe" /> : <Landmark className="h-3.5 w-3.5 mr-1" />}
                                          {isAlreadyStacked ? "Agregado" : "Stackear Fondo"}
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footnote matching source instructions */}
        <div className="py-3 px-4 bg-paper-dark border-t border-ink text-[9px] text-ink/70 font-mono flex items-center justify-between">
          <span>Fuentes: Corfo.cl, StartupChile.org, Sercotec.cl | Edición y Reportes Mayo 2026</span>
          <span>Reporte v4.0.2</span>
        </div>

      </div>
    </div>
  );
}
