import { useState } from "react";
import { Bot, X, Sparkles, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Fund, MiltonProfile } from "../types";
import GeminiPanel from "./GeminiPanel";

interface FloatingAIProps {
  profile: MiltonProfile;
  stackedFunds: Fund[];
  currentView: string;
}

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

const VIEW_LABELS: Record<string, string> = {
  landing: "Inicio",
  financiamientos: "Subsidios",
  licitaciones: "Licitaciones",
  hackatones: "Hackatones",
  roadmap: "Plan",
  agenda: "Agenda",
  ia: "IA",
};

export default function FloatingAI({ profile, stackedFunds, currentView }: FloatingAIProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">

      {/* Floating panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto w-[420px] max-w-[calc(100vw-3rem)] border-2 border-ink shadow-[6px_6px_0px_#000] bg-paper flex flex-col overflow-hidden"
            style={{ maxHeight: "80vh" }}
          >
            {/* Floating header bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-accent-purple border-b-2 border-ink shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-white shrink-0" />
                <div>
                  <span className="text-[11px] font-mono font-black uppercase tracking-wider text-white block leading-none">
                    Asesor IA Gemini
                  </span>
                  <span className="text-[9px] font-mono text-white/70 uppercase tracking-widest block mt-0.5">
                    Contexto: {VIEW_LABELS[currentView] || currentView}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white cursor-pointer p-1 transition-colors"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Panel content */}
            <div className="overflow-y-auto flex-1">
              {GEMINI_KEY ? (
                <GeminiPanel
                  profile={profile}
                  stackedFunds={stackedFunds}
                  currentView={currentView}
                  isCompact
                />
              ) : (
                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-3 text-xs font-serif leading-relaxed bg-warning/15 border border-ink p-3">
                    <Bot className="h-5 w-5 shrink-0 mt-0.5 text-ink/60" />
                    <div>
                      <strong className="font-sans font-bold block mb-1">API key no configurada</strong>
                      <p>Agrega <code className="bg-paper px-1 font-mono text-[10px] border border-ink/30">VITE_GEMINI_API_KEY</code> en las variables de entorno de Netlify y redespliega.</p>
                      <p className="mt-1 text-ink/70">Obtén clave gratuita en <strong>aistudio.google.com</strong></p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`pointer-events-auto flex items-center gap-2 px-4 py-3 border-2 border-ink font-mono font-black uppercase text-xs shadow-[4px_4px_0px_#000] hover:translate-y-[-1px] active:translate-y-[0.5px] transition-all cursor-pointer select-none ${
          isOpen
            ? "bg-ink text-paper"
            : GEMINI_KEY
            ? "bg-accent-purple text-white"
            : "bg-paper-dark text-ink/60"
        }`}
        title={GEMINI_KEY ? "Abrir Asesor IA" : "Asesor IA — API key requerida"}
      >
        {isOpen
          ? <><ChevronDown className="h-4 w-4" /> Cerrar IA</>
          : <><Bot className="h-4 w-4" /> Asesor IA</>
        }
      </button>
    </div>
  );
}
