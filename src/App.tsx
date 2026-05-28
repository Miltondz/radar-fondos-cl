import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, Calendar, ClipboardCheck, Sparkles, Layers, ListTodo, 
  MapPin, HelpCircle, RefreshCw, Star, Info, Moon, Sun, BookOpen, Flame, Bell
} from "lucide-react";
import { MiltonProfile, Fund } from "./types";
import { ALL_FUNDS } from "./data";
import Header from "./components/Header";
import ViewLanding from "./components/ViewLanding";
import ViewFinanciamientos from "./components/ViewFinanciamientos";
import ViewLicitaciones from "./components/ViewLicitaciones";
import ViewHackatones from "./components/ViewHackatones";
import ViewAgenda from "./components/ViewAgenda";
import GeminiPanel from "./components/GeminiPanel";
import FloatingAI from "./components/FloatingAI";
import PlanDeAccion from "./components/PlanDeAccion";
import Resources from "./components/Resources";
import SettingsPanel from "./components/SettingsPanel";

export default function App() {
  // 1. Theme State & Storage
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("milton_radar_theme");
      return (saved as "light" | "dark") || "light"; // Default to bright mode
    } catch (e) {
      return "light";
    }
  });

  useEffect(() => {
    localStorage.setItem("milton_radar_theme", theme);
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // 2. Core Reactive States
  const [profile, setProfile] = useState<MiltonProfile>(() => {
    try {
      const saved = localStorage.getItem("milton_radar_profile");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not read profile from localStorage", e);
    }
    return {
      hasWoman: false,
      hasSpA: false,
      hasSales: false,
      hasSiiInitiated: false
    };
  });

  const [stackedFunds, setStackedFunds] = useState<Fund[]>(() => {
    try {
      const saved = localStorage.getItem("milton_radar_stacked");
      if (saved) {
        const ids = JSON.parse(saved) as string[];
        return ALL_FUNDS.filter(f => ids.includes(f.id));
      }
    } catch (e) {
      console.warn("Could not read stacked funds from localStorage", e);
    }
    return [
      ALL_FUNDS.find(f => f.id === "corfo-semilla-inicia-rm-2026")!,
      ALL_FUNDS.find(f => f.id === "sercotec-abeja-2026")!
    ].filter(Boolean);
  });

  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("milton_radar_roadmap_ticks");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not read roadmap status from localStorage", e);
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<"landing" | "financiamientos" | "licitaciones" | "hackatones" | "roadmap" | "agenda" | "ia" | "configuracion">("landing");

  useEffect(() => {
    try { localStorage.setItem("milton_radar_profile", JSON.stringify(profile)); } catch (_) {}
  }, [profile]);

  useEffect(() => {
    try { localStorage.setItem("milton_radar_stacked", JSON.stringify(stackedFunds.map(f => f.id))); } catch (_) {}
  }, [stackedFunds]);

  useEffect(() => {
    try { localStorage.setItem("milton_radar_roadmap_ticks", JSON.stringify(completedSteps)); } catch (_) {}
  }, [completedSteps]);

  // 3. Helper Interactions
  const handleAddToStack = (item: Fund) => {
    if (!stackedFunds.some(f => f.id === item.id)) {
      setStackedFunds(prev => [...prev, item]);
    }
  };

  const handleRemoveFromStack = (id: string) => {
    setStackedFunds(prev => prev.filter(f => f.id !== id));
  };

  const handleClearStack = () => {
    setStackedFunds([]);
  };

  const handleApplyPresetStack = (ids: string[]) => {
    const matched = ALL_FUNDS.filter(f => ids.includes(f.id));
    setStackedFunds(matched);
  };

  const handleToggleStep = (id: string) => {
    setCompletedSteps(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleResetWorkspace = () => {
    if (confirm("¿Estás seguro de que deseas restablecer el simulador a su configuración inicial?")) {
      setProfile({
        hasWoman: false,
        hasSpA: false,
        hasSales: false,
        hasSiiInitiated: false
      });
      setStackedFunds([
        ALL_FUNDS.find(f => f.id === "corfo-semilla-inicia-rm-2026") || ALL_FUNDS[1],
        ALL_FUNDS.find(f => f.id === "sercotec-abeja-2026") || ALL_FUNDS[0]
      ].filter(Boolean));
      setCompletedSteps([]);
      setActiveTab("landing");
    }
  };

  // State calculations
  const criticalCount = ALL_FUNDS.filter(f => f.urgency === "CRITICAL").length;
  const countFinanciamientos = ALL_FUNDS.filter(f => f.type === "financiamiento").length;
  const countLicitaciones = ALL_FUNDS.filter(f => f.type === "licitacion").length;
  const countHackatones = ALL_FUNDS.filter(f => f.type === "hackaton").length;
  const urgentFunds = ALL_FUNDS.filter(f => f.urgency === "CRITICAL" || f.urgency === "HIGH")
    .sort((a, b) => {
      const m: Record<string, number> = { CRITICAL: 1, HIGH: 2 };
      return (m[a.urgency] || 9) - (m[b.urgency] || 9);
    })
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col relative selection:bg-alert/35 selection:text-paper" id="radar-root">
      
      {/* Top visual graphic bar */}
      <div className="h-1 bg-ink w-full" />

      {/* Main Brand Logo & Alerts Header */}
      <Header currentDate={new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })} criticalCount={criticalCount} urgentFunds={urgentFunds} />

      {/* Primary Responsive Workspace */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col gap-6">
        
        {/* Breadcrumb path & Bright/Dark theme switchers */}
        <div className="flex items-center justify-between border-b border-ink/15 pb-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-ink/65 uppercase tracking-wider">
            <span>Milton Workspace</span>
            <span>/</span>
            <span className="font-bold text-ink">
              {activeTab === "landing" ? "Inicio de Reporte" : activeTab === "financiamientos" ? "Fomento y Subsidios" : activeTab === "licitaciones" ? "Tender y Licitaciones" : activeTab === "hackatones" ? "Retos Avanzados" : activeTab === "agenda" ? "Agenda y Timeline" : activeTab === "ia" ? "Asesor IA Gemini" : activeTab === "configuracion" ? "Configuración" : "Plan de Acción"}
            </span>
          </div>

          {/* Toggle Theme Control */}
          <button
            onClick={() => setTheme(prev => prev === "light" ? "dark" : "light")}
            className="flex items-center gap-2 px-3 py-1.5 border border-ink bg-paper hover:bg-paper-dark font-mono text-[10px] font-black uppercase transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[1px] select-none cursor-pointer"
            id="theme-toggle-trigger"
            title="Cambiar entre modo Claro (Marfil) y Oscuro (Negro Slate)"
          >
            {theme === "light" ? (
              <>
                <Moon className="h-3 w-3 text-accent-purple" />
                <span>Modo Oscuro</span>
              </>
            ) : (
              <>
                <Sun className="h-3 w-3 text-warning" />
                <span>Modo Claro</span>
              </>
            )}
          </button>
        </div>

        {/* 4-Pillar Subpages Navigation Track */}
        <div className="flex border-2 border-ink bg-paper p-1 shadow-[4px_4px_0px_#1a1a1a] flex-wrap md:flex-nowrap" id="radar-hub-toptabs">
          <button 
            onClick={() => setActiveTab("landing")}
            className={`flex-1 min-w-[120px] py-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "landing" ? "bg-ink text-paper font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            📋 Resumen e Inicio
          </button>
          
          <button 
            onClick={() => setActiveTab("financiamientos")}
            className={`flex-1 min-w-[140px] py-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "financiamientos" ? "bg-accent-green text-white font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            💰 Subsidios ({countFinanciamientos})
          </button>
          
          <button 
            onClick={() => setActiveTab("licitaciones")}
            className={`flex-1 min-w-[140px] py-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "licitaciones" ? "bg-accent-blue text-white font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            🏛️ Licitaciones ({countLicitaciones})
          </button>
          
          <button 
            onClick={() => setActiveTab("hackatones")}
            className={`flex-1 min-w-[140px] py-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "hackatones" ? "bg-accent-purple text-white font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            ⚡ Hackatones ({countHackatones})
          </button>
          
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`flex-1 min-w-[150px] py-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "roadmap" ? "bg-ink text-paper font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            🎯 Plan y Requisitos
          </button>

          <button
            onClick={() => setActiveTab("agenda")}
            className={`flex-1 min-w-[130px] py-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "agenda" ? "bg-accent-blue text-white font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            📅 Agenda
          </button>

          <button
            onClick={() => setActiveTab("ia")}
            className={`flex-1 min-w-[120px] py-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "ia" ? "bg-accent-purple text-white font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            🤖 Asesor IA
          </button>

          <button
            onClick={() => setActiveTab("configuracion")}
            className={`flex-1 min-w-[130px] py-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "configuracion" ? "bg-ink text-paper font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            ⚙️ Configuración
          </button>
        </div>

        {/* Reactive Tab Component Router Frame */}
        <div className="mt-2 min-h-[500px]" id="radar-subpage-mount-element">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "landing" && (
                <ViewLanding
                  profile={profile}
                  onProfileChange={setProfile}
                  stackedFunds={stackedFunds}
                  onAddToStack={handleAddToStack}
                  onRemoveFromStack={handleRemoveFromStack}
                  onClearStack={handleClearStack}
                  onApplyPreset={handleApplyPresetStack}
                />
              )}

              {activeTab === "financiamientos" && (
                <ViewFinanciamientos
                  profile={profile}
                  onAddToStack={handleAddToStack}
                  stackedFunds={stackedFunds}
                />
              )}

              {activeTab === "licitaciones" && (
                <ViewLicitaciones
                  profile={profile}
                  onAddToStack={handleAddToStack}
                  stackedFunds={stackedFunds}
                />
              )}

              {activeTab === "hackatones" && (
                <ViewHackatones
                  profile={profile}
                  onAddToStack={handleAddToStack}
                  stackedFunds={stackedFunds}
                />
              )}

              {activeTab === "roadmap" && (
                <div className="space-y-10">
                  <PlanDeAccion
                    completedSteps={completedSteps}
                    onToggleStep={handleToggleStep}
                  />
                  <Resources profile={profile} />
                </div>
              )}

              {activeTab === "agenda" && (
                <ViewAgenda
                  profile={profile}
                  onAddToStack={handleAddToStack}
                  stackedFunds={stackedFunds}
                />
              )}

              {activeTab === "ia" && (
                <GeminiPanel
                  profile={profile}
                  stackedFunds={stackedFunds}
                />
              )}

              {activeTab === "configuracion" && (
                <SettingsPanel
                  profile={profile}
                  stackedFunds={stackedFunds}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Workspace Reset controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center py-4 border-t-2 border-ink mt-8 text-ink/75 font-mono text-[9.5px] gap-4">
          <div>
            <span>Radar Fondos CL • v4.1.0 (Santiago, Chile | {new Date().getFullYear()})</span>
          </div>
          <button
            onClick={handleResetWorkspace}
            className="flex items-center gap-1.5 hover:text-alert font-bold uppercase transition-all cursor-pointer bg-paper bg-opacity-100 px-3 py-1.5 border border-ink shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0 active:translate-y-[1px]"
            id="reset-workspace-button"
            title="Sincronizar y resetear workspace"
          >
            <RefreshCw className="h-3 w-3" />
            Reiniciar Simulador
          </button>
        </div>

      </main>

      {/* Floating AI — visible in all views */}
      <FloatingAI profile={profile} stackedFunds={stackedFunds} currentView={activeTab} />

      {/* Main Footer Block */}
      <footer className="w-full bg-paper-dark border-t-2 border-ink py-10 text-center" id="radar-footer">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-ink/80 text-xs font-serif leading-relaxed italic font-medium">
            Reporte de Financiamiento estratégico generado en tiempo real para startups TI chilenas.
          </p>
          <p className="text-ink/65 text-[10px] mt-2.5 font-mono uppercase tracking-wider font-bold">
            Consultoría de Fomento Tecnológico • Todos los derechos reservados © 2026.
          </p>
        </div>
      </footer>

    </div>
  );
}
