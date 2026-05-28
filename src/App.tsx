import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2, Calendar, ClipboardCheck, Sparkles, Layers, ListTodo,
  MapPin, HelpCircle, Star, Info, Moon, Sun, BookOpen, Flame, Bell, User, Link
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
import OnboardingWizard from "./components/OnboardingWizard";
import ViewImport from "./components/ViewImport";

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
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          hasWoman: parsed.hasWoman ?? false,
          hasSpA: parsed.hasSpA ?? false,
          hasSales: parsed.hasSales ?? false,
          hasSiiInitiated: parsed.hasSiiInitiated ?? false,
          companyName: parsed.companyName ?? "",
          stage: parsed.stage ?? "idea",
          sector: parsed.sector ?? "saas",
          region: parsed.region ?? "Región Metropolitana",
          foundedYear: parsed.foundedYear,
        };
      }
    } catch (e) {
      console.warn("Could not read profile from localStorage", e);
    }
    return {
      hasWoman: false, hasSpA: false, hasSales: false, hasSiiInitiated: false,
      companyName: "", stage: "idea", sector: "saas", region: "Región Metropolitana",
    };
  });

  const [starredFunds, setStarredFunds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("milton_radar_starred");
      if (saved) return JSON.parse(saved) as string[];
    } catch (e) { console.warn("Could not read starred funds", e); }
    return [];
  });

  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    try { return localStorage.getItem("milton_radar_onboarding_done") === "true"; }
    catch (e) { return false; }
  });

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try { return localStorage.getItem("milton_radar_onboarding_done") !== "true"; }
    catch (e) { return true; }
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

  const [customFunds, setCustomFunds] = useState<Fund[]>(() => {
    try {
      const saved = localStorage.getItem("milton_radar_custom_funds");
      if (saved) return JSON.parse(saved) as Fund[];
    } catch (e) {
      console.warn("Could not read custom funds from localStorage", e);
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<"landing" | "financiamientos" | "licitaciones" | "hackatones" | "roadmap" | "agenda" | "ia" | "configuracion" | "importar">("landing");

  useEffect(() => {
    try { localStorage.setItem("milton_radar_profile", JSON.stringify(profile)); } catch (_) {}
  }, [profile]);

  useEffect(() => {
    try { localStorage.setItem("milton_radar_starred", JSON.stringify(starredFunds)); } catch (_) {}
  }, [starredFunds]);

  useEffect(() => {
    try { localStorage.setItem("milton_radar_onboarding_done", String(onboardingCompleted)); } catch (_) {}
  }, [onboardingCompleted]);

  const toggleStar = (fundId: string) => {
    setStarredFunds(prev =>
      prev.includes(fundId) ? prev.filter(id => id !== fundId) : [...prev, fundId]
    );
  };

  useEffect(() => {
    try { localStorage.setItem("milton_radar_stacked", JSON.stringify(stackedFunds.map(f => f.id))); } catch (_) {}
  }, [stackedFunds]);

  useEffect(() => {
    try { localStorage.setItem("milton_radar_roadmap_ticks", JSON.stringify(completedSteps)); } catch (_) {}
  }, [completedSteps]);

  useEffect(() => {
    try { localStorage.setItem("milton_radar_custom_funds", JSON.stringify(customFunds)); } catch (_) {}
  }, [customFunds]);

  const [quickImportUrl, setQuickImportUrl] = useState("");
  const [quickImportBarInput, setQuickImportBarInput] = useState("");

  // Handle ?import=<b64json> from Chrome extension
  const [extensionImportDraft, setExtensionImportDraft] = useState<Record<string, unknown> | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get("import");
      if (!raw) return null;
      const json = JSON.parse(decodeURIComponent(escape(atob(raw))));
      // Clean URL so refresh doesn't re-trigger
      window.history.replaceState({}, "", window.location.pathname);
      return json;
    } catch { return null; }
  });

  const [archivedFundIds, setArchivedFundIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("milton_radar_archived_ids");
      if (saved) return JSON.parse(saved) as string[];
    } catch { /* noop */ }
    return [];
  });

  useEffect(() => {
    try { localStorage.setItem("milton_radar_archived_ids", JSON.stringify(archivedFundIds)); } catch (_) {}
  }, [archivedFundIds]);

  const handleImportFund = (fund: Fund) => {
    setCustomFunds(prev => [...prev, fund]);
  };

  const handleDeleteCustomFund = (id: string) => {
    setCustomFunds(prev => prev.filter(f => f.id !== id));
    setArchivedFundIds(prev => prev.filter(aid => aid !== id));
  };

  const handleArchiveCustomFund = (id: string) => {
    setArchivedFundIds(prev => prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]);
  };

  // Auto-navigate when extension injects data via URL param
  useEffect(() => {
    if (extensionImportDraft) setActiveTab("importar");
  }, [extensionImportDraft]);

  const handleQuickImportSubmit = () => {
    const url = quickImportBarInput.trim();
    if (!url) return;
    setQuickImportUrl(url);
    setQuickImportBarInput("");
    setActiveTab("importar");
  };

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

  // State calculations — includes custom imported funds (excluding archived)
  const activeCustomFunds = customFunds.filter(f => !archivedFundIds.includes(f.id));
  const allFunds = [...ALL_FUNDS, ...activeCustomFunds];
  const criticalCount = allFunds.filter(f => f.urgency === "CRITICAL").length;
  const countFinanciamientos = allFunds.filter(f => f.type === "financiamiento").length;
  const countLicitaciones = allFunds.filter(f => f.type === "licitacion").length;
  const countHackatones = allFunds.filter(f => f.type === "hackaton").length;
  const urgentFunds = allFunds.filter(f => f.urgency === "CRITICAL" || f.urgency === "HIGH")
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
              {activeTab === "landing" ? "Inicio de Reporte" : activeTab === "financiamientos" ? "Fomento y Subsidios" : activeTab === "licitaciones" ? "Tender y Licitaciones" : activeTab === "hackatones" ? "Retos Avanzados" : activeTab === "agenda" ? "Agenda y Timeline" : activeTab === "ia" ? "Asesor IA Gemini" : activeTab === "configuracion" ? "Configuración" : activeTab === "importar" ? "Importar Convocatoria" : "Plan de Acción"}
            </span>
          </div>

          <div className="flex items-center gap-2">
          {/* Mi Empresa button */}
          <button
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-2 px-3 py-1.5 border border-ink bg-paper hover:bg-paper-dark font-mono text-[10px] font-black uppercase transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[1px] select-none cursor-pointer"
            title="Configurar perfil de empresa"
          >
            <User className="h-3 w-3" />
            {profile.companyName ? profile.companyName : "Mi Empresa"}
          </button>

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
        </div>

        {/* 4-Pillar Subpages Navigation Track */}
        <div className="flex border-2 border-ink bg-paper shadow-[4px_4px_0px_#1a1a1a] overflow-x-auto" id="radar-hub-toptabs" style={{ scrollbarWidth: "none" }}>
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

          <button
            onClick={() => setActiveTab("importar")}
            className={`flex-1 min-w-[130px] py-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "importar" ? "bg-accent-green text-white font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            📥 Importar{customFunds.length > 0 ? ` (${customFunds.length})` : ""}
          </button>
        </div>

        {/* Persistent Quick Import URL Bar */}
        <div className="flex items-center gap-0 border-2 border-t-0 border-ink bg-paper-dark shadow-[4px_2px_0px_#1a1a1a]">
          <div className="flex items-center gap-1.5 shrink-0 px-3 py-2.5 border-r border-ink/25 bg-ink/5">
            <Link className="h-3 w-3 text-ink/60" />
            <span className="font-mono font-black text-[9.5px] uppercase tracking-widest text-ink/70 select-none whitespace-nowrap">
              Añadir URL
            </span>
          </div>
          <input
            type="url"
            className="flex-1 min-w-0 bg-transparent font-mono text-xs text-ink px-3 py-2.5 focus:outline-none placeholder:text-ink/30"
            placeholder="Pega URL de CORFO, Mercado Público, SERCOTEC, LinkedIn… y presiona Enter"
            value={quickImportBarInput}
            onChange={e => setQuickImportBarInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleQuickImportSubmit(); }}
          />
          <button
            onClick={handleQuickImportSubmit}
            disabled={!quickImportBarInput.trim()}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 font-mono font-black text-[10px] uppercase tracking-wide bg-ink text-paper hover:bg-ink/85 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer select-none border-l border-ink/25"
          >
            <Sparkles className="h-3 w-3" />
            Analizar
          </button>
        </div>

        {/* Reactive Tab Component Router Frame */}
        <div className="mt-0 min-h-[500px]" id="radar-subpage-mount-element">
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
                  starredFunds={starredFunds}
                  onAddToStack={handleAddToStack}
                  onRemoveFromStack={handleRemoveFromStack}
                  onClearStack={handleClearStack}
                  onApplyPreset={handleApplyPresetStack}
                  onToggleStar={toggleStar}
                  onNavigateTo={(tab) => setActiveTab(tab as typeof activeTab)}
                />
              )}

              {activeTab === "financiamientos" && (
                <ViewFinanciamientos
                  profile={profile}
                  onAddToStack={handleAddToStack}
                  stackedFunds={stackedFunds}
                  starredFunds={starredFunds}
                  onToggleStar={toggleStar}
                  extraFunds={activeCustomFunds}
                  archivedFundIds={archivedFundIds}
                  onDeleteFund={handleDeleteCustomFund}
                  onArchiveFund={handleArchiveCustomFund}
                />
              )}

              {activeTab === "licitaciones" && (
                <ViewLicitaciones
                  profile={profile}
                  onAddToStack={handleAddToStack}
                  stackedFunds={stackedFunds}
                  starredFunds={starredFunds}
                  onToggleStar={toggleStar}
                  extraFunds={activeCustomFunds}
                  archivedFundIds={archivedFundIds}
                  onDeleteFund={handleDeleteCustomFund}
                  onArchiveFund={handleArchiveCustomFund}
                />
              )}

              {activeTab === "hackatones" && (
                <ViewHackatones
                  profile={profile}
                  onAddToStack={handleAddToStack}
                  stackedFunds={stackedFunds}
                  starredFunds={starredFunds}
                  onToggleStar={toggleStar}
                  extraFunds={activeCustomFunds}
                  archivedFundIds={archivedFundIds}
                  onDeleteFund={handleDeleteCustomFund}
                  onArchiveFund={handleArchiveCustomFund}
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

              {activeTab === "importar" && (
                <ViewImport
                  customFunds={customFunds}
                  archivedFundIds={archivedFundIds}
                  onImportFund={handleImportFund}
                  onDeleteCustomFund={handleDeleteCustomFund}
                  onArchiveCustomFund={handleArchiveCustomFund}
                  initialUrl={quickImportUrl}
                  onUrlConsumed={() => setQuickImportUrl("")}
                  initialDraft={extensionImportDraft}
                  onDraftConsumed={() => setExtensionImportDraft(null)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer bar */}
        <div className="flex items-center justify-center py-4 border-t-2 border-ink mt-8 text-ink/75 font-mono text-[9.5px]">
          <span>Radar Fondos CL • v4.1.0 (Santiago, Chile | {new Date().getFullYear()})</span>
        </div>

      </main>

      {/* Floating AI — visible in all views */}
      <FloatingAI profile={profile} stackedFunds={stackedFunds} currentView={activeTab} />

      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          profile={profile}
          onSave={(updated) => {
            setProfile(updated);
            setOnboardingCompleted(true);
            setShowOnboarding(false);
          }}
          onDismiss={() => {
            setOnboardingCompleted(true);
            setShowOnboarding(false);
          }}
        />
      )}

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
