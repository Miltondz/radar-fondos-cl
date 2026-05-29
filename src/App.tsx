import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2, Calendar, ClipboardCheck, Sparkles, Layers, ListTodo,
  MapPin, HelpCircle, Star, Info, Moon, Sun, BookOpen, Flame, Bell, User, Link, Search, X,
  ExternalLink, Scale, Printer
} from "lucide-react";
import { formatCLP } from "./utils";
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

  // Postulation tracking: { id, appliedAt, notes }
  const [appliedFunds, setAppliedFunds] = useState<{ id: string; appliedAt: string; notes: string }[]>(() => {
    try {
      const saved = localStorage.getItem("milton_radar_applied");
      if (saved) return JSON.parse(saved);
    } catch { /* noop */ }
    return [];
  });
  useEffect(() => {
    try { localStorage.setItem("milton_radar_applied", JSON.stringify(appliedFunds)); } catch (_) {}
  }, [appliedFunds]);
  const handleToggleApplied = (id: string) => {
    setAppliedFunds(prev =>
      prev.some(a => a.id === id)
        ? prev.filter(a => a.id !== id)
        : [...prev, { id, appliedAt: new Date().toISOString().slice(0, 10), notes: "" }]
    );
  };

  // Notes per fund
  const [fundNotes, setFundNotes] = useState<Record<string, string>>(() => {
    try { const s = localStorage.getItem("milton_radar_notes"); if (s) return JSON.parse(s); } catch { }
    return {};
  });
  useEffect(() => {
    try { localStorage.setItem("milton_radar_notes", JSON.stringify(fundNotes)); } catch (_) {}
  }, [fundNotes]);
  const handleUpdateNote = (id: string, note: string) => {
    setFundNotes(prev => ({ ...prev, [id]: note }));
  };

  // Recent funds (last 6 expanded)
  const [recentFunds, setRecentFunds] = useState<string[]>(() => {
    try { const s = localStorage.getItem("milton_radar_recent"); if (s) return JSON.parse(s); } catch { }
    return [];
  });
  useEffect(() => {
    try { localStorage.setItem("milton_radar_recent", JSON.stringify(recentFunds)); } catch (_) {}
  }, [recentFunds]);
  const handleTrackRecent = (id: string) => {
    setRecentFunds(prev => [id, ...prev.filter(r => r !== id)].slice(0, 6));
  };

  // Compare (up to 3)
  const [compareFundIds, setCompareFundIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const handleToggleCompare = (id: string) => {
    setCompareFundIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  // Deep link: ?fund=<id>
  const [initialExpandedFundId, setInitialExpandedFundId] = useState<string | null>(() => {
    try { return new URLSearchParams(window.location.search).get("fund"); } catch { return null; }
  });

  // Browser notifications for urgent deadlines
  useEffect(() => {
    if (!("Notification" in window)) return;
    const today = new Date().toISOString().slice(0, 10);
    const urgentStack = stackedFunds.filter(f =>
      (f.urgency === "CRITICAL" || f.urgency === "HIGH") &&
      f.deadlineISO && f.deadlineISO >= today
    );
    if (urgentStack.length === 0) return;
    const requestAndNotify = () => {
      urgentStack.forEach(f => {
        const daysLeft = Math.ceil((new Date(f.deadlineISO!).getTime() - Date.now()) / 86400000);
        new Notification(`⏰ ${f.name}`, {
          body: `Cierra en ${daysLeft} día${daysLeft === 1 ? "" : "s"} (${f.deadline}) — ${f.entity}`,
          icon: "/favicon.ico",
          tag: f.id,
        });
      });
    };
    if (Notification.permission === "granted") {
      requestAndNotify();
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(p => { if (p === "granted") requestAndNotify(); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep link navigation
  useEffect(() => {
    if (!initialExpandedFundId) return;
    const fund = [...ALL_FUNDS, ...customFunds].find(f => f.id === initialExpandedFundId);
    if (fund) setActiveTab(fund.type === "licitacion" ? "licitaciones" : fund.type === "hackaton" ? "hackatones" : "financiamientos");
    window.history.replaceState({}, "", window.location.pathname);
    setTimeout(() => setInitialExpandedFundId(null), 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const tabKeys: Record<string, typeof activeTab> = {
      "1": "landing", "2": "financiamientos", "3": "licitaciones",
      "4": "hackatones", "5": "roadmap", "6": "agenda",
      "7": "ia", "8": "configuracion", "9": "importar",
    };
    const handler = (e: KeyboardEvent) => {
      const isInput = (e.target as HTMLElement).matches("input,textarea,select,[contenteditable]");
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search-input")?.focus();
        return;
      }
      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey && tabKeys[e.key]) {
        setActiveTab(tabKeys[e.key]);
      }
      if (e.key === "Escape") {
        setShowCompareModal(false);
        setGlobalSearch("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global search
  const [globalSearch, setGlobalSearch] = useState("");

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
  const globalResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const q = globalSearch.toLowerCase();
    return allFunds.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.entity.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      (f.organizer || "").toLowerCase().includes(q)
    ).slice(0, 12);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSearch, customFunds, archivedFundIds]);
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
      <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8 flex-1 flex flex-col gap-4 sm:gap-6">
        
        {/* Breadcrumb path & Bright/Dark theme switchers */}
        <div className="flex items-center justify-between border-b border-ink/15 pb-2 sm:pb-3 gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-ink/65 uppercase tracking-wider min-w-0">
            <span className="hidden sm:inline shrink-0">Milton Workspace</span>
            <span className="hidden sm:inline shrink-0">/</span>
            <span className="font-bold text-ink truncate">
              {activeTab === "landing" ? "Inicio" : activeTab === "financiamientos" ? "Subsidios" : activeTab === "licitaciones" ? "Licitaciones" : activeTab === "hackatones" ? "Hackatones" : activeTab === "agenda" ? "Agenda" : activeTab === "ia" ? "Asesor IA" : activeTab === "configuracion" ? "Config" : activeTab === "importar" ? "Importar" : "Plan"}
            </span>
          </div>

          <div className="flex items-center gap-2">
          {/* Mi Empresa button */}
          <button
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-ink bg-paper hover:bg-paper-dark font-mono text-[10px] font-black uppercase transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[1px] select-none cursor-pointer max-w-[120px] sm:max-w-none"
            title="Configurar perfil de empresa"
          >
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate hidden xs:inline sm:inline">{profile.companyName ? profile.companyName : "Mi Empresa"}</span>
          </button>

          {/* Toggle Theme Control */}
          <button
            onClick={() => setTheme(prev => prev === "light" ? "dark" : "light")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-ink bg-paper hover:bg-paper-dark font-mono text-[10px] font-black uppercase transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[1px] select-none cursor-pointer"
            id="theme-toggle-trigger"
            title="Cambiar entre modo Claro (Marfil) y Oscuro (Negro Slate)"
          >
            {theme === "light" ? (
              <>
                <Moon className="h-3 w-3 text-accent-purple shrink-0" />
                <span className="hidden sm:inline">Modo Oscuro</span>
              </>
            ) : (
              <>
                <Sun className="h-3 w-3 text-warning shrink-0" />
                <span className="hidden sm:inline">Modo Claro</span>
              </>
            )}
          </button>
          </div>
        </div>

        {/* 4-Pillar Subpages Navigation Track */}
        <div className="sticky top-0 z-40 bg-paper/95 backdrop-blur-sm -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 pt-1 pb-0">
        <div className="flex border-2 border-ink bg-paper shadow-[4px_4px_0px_#1a1a1a] overflow-x-auto" id="radar-hub-toptabs" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
          <button
            onClick={() => setActiveTab("landing")}
            className={`flex-1 min-w-[44px] sm:min-w-[120px] py-3 px-2 sm:px-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "landing" ? "bg-ink text-paper font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            📋<span className="hidden sm:inline"> Inicio</span>
          </button>

          <button
            onClick={() => setActiveTab("financiamientos")}
            className={`flex-1 min-w-[44px] sm:min-w-[130px] py-3 px-2 sm:px-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "financiamientos" ? "bg-accent-green text-white font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            💰<span className="hidden sm:inline"> Subsidios</span>
            <span className="hidden sm:inline"> ({countFinanciamientos})</span>
            <span className="sm:hidden text-[9px]"> {countFinanciamientos}</span>
          </button>

          <button
            onClick={() => setActiveTab("licitaciones")}
            className={`flex-1 min-w-[44px] sm:min-w-[130px] py-3 px-2 sm:px-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "licitaciones" ? "bg-accent-blue text-white font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            🏛️<span className="hidden sm:inline"> Licitaciones</span>
            <span className="hidden sm:inline"> ({countLicitaciones})</span>
            <span className="sm:hidden text-[9px]"> {countLicitaciones}</span>
          </button>

          <button
            onClick={() => setActiveTab("hackatones")}
            className={`flex-1 min-w-[44px] sm:min-w-[130px] py-3 px-2 sm:px-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "hackatones" ? "bg-accent-purple text-white font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            ⚡<span className="hidden sm:inline"> Hackatones</span>
            <span className="hidden sm:inline"> ({countHackatones})</span>
            <span className="sm:hidden text-[9px]"> {countHackatones}</span>
          </button>

          <button
            onClick={() => setActiveTab("roadmap")}
            className={`flex-1 min-w-[44px] sm:min-w-[130px] py-3 px-2 sm:px-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "roadmap" ? "bg-ink text-paper font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            🎯<span className="hidden sm:inline"> Plan</span>
          </button>

          <button
            onClick={() => setActiveTab("agenda")}
            className={`flex-1 min-w-[44px] sm:min-w-[110px] py-3 px-2 sm:px-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "agenda" ? "bg-accent-blue text-white font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            📅<span className="hidden sm:inline"> Agenda</span>
          </button>

          <button
            onClick={() => setActiveTab("ia")}
            className={`flex-1 min-w-[44px] sm:min-w-[100px] py-3 px-2 sm:px-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "ia" ? "bg-accent-purple text-white font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            🤖<span className="hidden sm:inline"> IA</span>
          </button>

          <button
            onClick={() => setActiveTab("configuracion")}
            className={`flex-1 min-w-[44px] sm:min-w-[110px] py-3 px-2 sm:px-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "configuracion" ? "bg-ink text-paper font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            ⚙️<span className="hidden sm:inline"> Config</span>
          </button>

          <button
            onClick={() => setActiveTab("importar")}
            className={`flex-1 min-w-[44px] sm:min-w-[120px] py-3 px-2 sm:px-3 text-center text-[10.5px] font-mono font-black uppercase tracking-wider transition-all border-r border-ink/25 last:border-0 cursor-pointer ${
              activeTab === "importar" ? "bg-accent-green text-white font-extrabold" : "bg-paper hover:bg-paper-dark text-ink"
            }`}
          >
            <span className="inline-flex items-center gap-1 justify-center">
              📥<span className="hidden sm:inline"> Importar</span>
              {customFunds.length > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-none text-[9px] font-black ${activeTab === "importar" ? "bg-white text-accent-green" : "bg-accent-green text-white"}`}>
                  {customFunds.filter(f => !archivedFundIds.includes(f.id)).length}
                </span>
              )}
              {customFunds.filter(f => f.urgency === "CLOSED" || (f.deadlineISO && f.deadlineISO < new Date().toISOString().slice(0,10))).length > 0 && (
                <span className="hidden sm:inline-flex items-center justify-center min-w-[16px] h-[16px] px-0.5 text-[9px] font-black bg-alert text-white" title="Fondos expirados">
                  {customFunds.filter(f => f.urgency === "CLOSED" || (f.deadlineISO && f.deadlineISO < new Date().toISOString().slice(0,10))).length}🔒
                </span>
              )}
            </span>
          </button>
        </div>
        </div>{/* /sticky wrapper */}

        {/* Persistent Quick Import URL Bar */}
        <div className="flex items-center gap-0 border-2 border-t-0 border-ink bg-paper-dark shadow-[4px_2px_0px_#1a1a1a]">
          <div className="flex items-center gap-1.5 shrink-0 px-2.5 sm:px-3 py-2.5 border-r border-ink/25 bg-ink/5">
            <Link className="h-3 w-3 text-ink/60 shrink-0" />
            <span className="hidden sm:block font-mono font-black text-[9.5px] uppercase tracking-widest text-ink/70 select-none whitespace-nowrap">
              Añadir URL
            </span>
          </div>
          <input
            type="url"
            className="flex-1 min-w-0 bg-transparent font-mono text-xs text-ink px-3 py-2.5 focus:outline-none placeholder:text-ink/30"
            placeholder="Pega URL de CORFO, Mercado Público… y Enter"
            value={quickImportBarInput}
            onChange={e => setQuickImportBarInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleQuickImportSubmit(); }}
          />
          <button
            onClick={handleQuickImportSubmit}
            disabled={!quickImportBarInput.trim()}
            className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2.5 font-mono font-black text-[10px] uppercase tracking-wide bg-ink text-paper hover:bg-ink/85 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer select-none border-l border-ink/25"
          >
            <Sparkles className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">Analizar</span>
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative border-2 border-t-0 border-ink bg-paper">
          <div className="flex items-center gap-2 px-3">
            <Search className="h-3.5 w-3.5 text-ink/40 shrink-0" />
            <input
              type="text"
              id="global-search-input"
              className="flex-1 bg-transparent font-mono text-xs text-ink py-2.5 focus:outline-none placeholder:text-ink/30"
              placeholder="Buscar… (Ctrl+K)"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
            />
            {globalSearch && (
              <button onClick={() => setGlobalSearch("")} className="text-ink/40 hover:text-ink cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {globalResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 border-2 border-t-0 border-ink bg-paper shadow-[4px_4px_0px_#1a1a1a] max-h-80 overflow-y-auto">
              {globalResults.map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    setActiveTab(f.type === "licitacion" ? "licitaciones" : f.type === "hackaton" ? "hackatones" : "financiamientos");
                    setGlobalSearch("");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-paper-dark border-b border-ink/10 last:border-0 cursor-pointer text-left"
                >
                  <span className={`shrink-0 px-1.5 py-0.5 text-[8px] font-mono font-black uppercase border border-ink ${
                    f.urgency === "CRITICAL" ? "bg-alert text-white" :
                    f.urgency === "HIGH" ? "bg-warning text-ink" :
                    f.urgency === "CLOSED" ? "bg-ink/30 text-white" : "bg-paper-dark text-ink"
                  }`}>{f.urgency}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-mono font-bold text-xs text-ink truncate">{f.name}</span>
                    <span className="block font-mono text-[10px] text-ink/50 truncate">{f.entity} · {f.amount}</span>
                  </span>
                  <span className="shrink-0 text-[9px] font-mono text-ink/40 uppercase">{f.type}</span>
                </button>
              ))}
            </div>
          )}
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
                  recentFundIds={recentFunds}
                  allFunds={allFunds}
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
                  appliedFundIds={appliedFunds.map(a => a.id)}
                  onToggleApplied={handleToggleApplied}
                  fundNotes={fundNotes}
                  onUpdateNote={handleUpdateNote}
                  compareFundIds={compareFundIds}
                  onToggleCompare={handleToggleCompare}
                  onTrackRecent={handleTrackRecent}
                  initialExpandedFundId={initialExpandedFundId}
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
                  appliedFundIds={appliedFunds.map(a => a.id)}
                  onToggleApplied={handleToggleApplied}
                  fundNotes={fundNotes}
                  onUpdateNote={handleUpdateNote}
                  compareFundIds={compareFundIds}
                  onToggleCompare={handleToggleCompare}
                  onTrackRecent={handleTrackRecent}
                  initialExpandedFundId={initialExpandedFundId}
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
                  appliedFundIds={appliedFunds.map(a => a.id)}
                  onToggleApplied={handleToggleApplied}
                  fundNotes={fundNotes}
                  onUpdateNote={handleUpdateNote}
                  compareFundIds={compareFundIds}
                  onToggleCompare={handleToggleCompare}
                  onTrackRecent={handleTrackRecent}
                  initialExpandedFundId={initialExpandedFundId}
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

      {/* Compare bottom bar */}
      {compareFundIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-ink text-paper border-t-2 border-paper/20 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_0px_rgba(0,0,0,0.4)]">
          <Scale className="h-4 w-4 text-warning shrink-0" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider shrink-0">Comparar ({compareFundIds.length}/3):</span>
          <div className="flex gap-2 flex-1 min-w-0 overflow-x-auto" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
            {compareFundIds.map(id => {
              const f = allFunds.find(x => x.id === id);
              return f ? (
                <span key={id} className="inline-flex items-center gap-1 bg-paper/10 border border-paper/20 px-2 py-0.5 text-[10px] font-mono whitespace-nowrap">
                  {f.name.split(" ").slice(0, 3).join(" ")}
                  <button onClick={() => handleToggleCompare(id)} className="ml-1 hover:text-alert cursor-pointer">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ) : null;
            })}
          </div>
          <button
            onClick={() => setShowCompareModal(true)}
            className="shrink-0 px-4 py-1.5 bg-warning text-ink font-mono font-black text-[10px] uppercase border border-paper/20 hover:bg-warning/80 cursor-pointer transition-colors"
          >
            Ver Comparación
          </button>
          <button onClick={() => setCompareFundIds([])} className="shrink-0 text-paper/50 hover:text-paper cursor-pointer ml-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Compare modal */}
      <AnimatePresence>
        {showCompareModal && compareFundIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/80 backdrop-blur-sm overflow-y-auto py-8 px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCompareModal(false); }}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="w-full max-w-5xl bg-paper border-2 border-ink shadow-[8px_8px_0px_#000]"
            >
              <div className="flex items-center justify-between p-4 border-b-2 border-ink bg-ink text-paper">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  <span className="font-mono font-black text-sm uppercase tracking-wider">Comparador de Convocatorias</span>
                </div>
                <button onClick={() => setShowCompareModal(false)} className="p-1 hover:bg-paper/10 cursor-pointer transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className={`grid gap-0 ${compareFundIds.length === 1 ? "grid-cols-1" : compareFundIds.length === 2 ? "grid-cols-2" : "grid-cols-3"} divide-x-2 divide-ink`}>
                {compareFundIds.map(id => {
                  const fund = allFunds.find(f => f.id === id);
                  if (!fund) return null;
                  const isStacked = stackedFunds.some(f => f.id === id);
                  return (
                    <div key={id} className="p-5 space-y-4">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-ink/50 block">{fund.entity}</span>
                        <h3 className="font-sans font-black text-sm text-ink mt-0.5 leading-snug">{fund.name}</h3>
                      </div>
                      <div className="space-y-2 text-xs">
                        {([
                          ["Monto", <span className="font-black text-alert font-mono text-[11px]">{formatCLP(fund.amountNumber)}</span>],
                          ["Cierre", <span className="font-mono font-bold text-[11px]">{fund.deadline}</span>],
                          ["Urgencia", <span className={`px-1.5 py-0.5 text-[9px] font-black border border-ink ${fund.urgency === "CRITICAL" ? "bg-alert text-white" : fund.urgency === "HIGH" ? "bg-warning text-ink" : fund.urgency === "CLOSED" ? "bg-ink/30 text-white" : "bg-paper-dark text-ink"}`}>{fund.urgency}</span>],
                          ["Categoría", <span className="font-mono text-[10px] font-bold">{fund.category}</span>],
                          ["Requiere SpA", <span className={`font-mono text-[10px] font-bold ${fund.requiresSpA ? "text-alert" : "text-safe"}`}>{fund.requiresSpA ? "Sí" : "No"}</span>],
                          ["Socia", <span className={`font-mono text-[10px] font-bold ${fund.eligibilityGenderRequired ? "text-alert" : "text-safe"}`}>{fund.eligibilityGenderRequired ? "Requerida" : "No requerida"}</span>],
                          ["Ventas $0", <span className={`font-mono text-[10px] font-bold ${fund.eligibilitySalesRestricted ? "text-warning" : "text-safe"}`}>{fund.eligibilitySalesRestricted ? "Necesario" : "Sin restricción"}</span>],
                        ] as [string, React.ReactNode][]).map(([label, value]) => (
                          <div key={label} className="flex justify-between items-center border-b border-ink/10 pb-1">
                            <span className="font-mono text-ink/60 text-[10px] uppercase">{label}</span>
                            {value}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] font-serif text-ink/80 leading-relaxed line-clamp-3">{fund.description}</p>
                      <div className="flex gap-2 flex-wrap pt-2 border-t border-ink/10">
                        <a href={fund.url} target="_blank" rel="noopener noreferrer"
                          className="flex-1 text-center px-3 py-1.5 bg-accent-green text-white font-mono font-black text-[9px] uppercase border border-ink hover:opacity-90 cursor-pointer"
                        >POSTULAR</a>
                        <button onClick={() => handleAddToStack(fund)} disabled={isStacked}
                          className={`flex-1 text-center px-3 py-1.5 font-mono font-black text-[9px] uppercase border border-ink cursor-pointer ${isStacked ? "bg-safe/20 text-safe" : "bg-paper hover:bg-paper-dark text-ink"}`}
                        >{isStacked ? "✓ Stack" : "+ Stack"}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
