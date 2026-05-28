import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, User, Building2, CheckCircle2, Sparkles } from "lucide-react";
import { MiltonProfile, StartupStage, StartupSector, REGIONS_CL } from "../types";
import { ALL_FUNDS } from "../data";
import { isEligible } from "../utils";

interface OnboardingWizardProps {
  profile: MiltonProfile;
  onSave: (profile: MiltonProfile) => void;
  onDismiss: () => void;
}

const STAGES: { value: StartupStage; label: string; desc: string }[] = [
  { value: "idea", label: "Idea", desc: "Concepto sin producto" },
  { value: "pre-seed", label: "Pre-Seed", desc: "MVP en desarrollo" },
  { value: "seed", label: "Seed", desc: "Producto con primeros usuarios" },
  { value: "series-a", label: "Series A", desc: "Crecimiento validado" },
  { value: "growth", label: "Growth", desc: "Escala activa" },
];

const SECTORS: { value: StartupSector; label: string }[] = [
  { value: "saas", label: "SaaS / Software" },
  { value: "ai", label: "Inteligencia Artificial" },
  { value: "fintech", label: "Fintech" },
  { value: "healthtech", label: "Healthtech" },
  { value: "edtech", label: "Edtech" },
  { value: "ecommerce", label: "E-Commerce" },
  { value: "iot", label: "IoT / Hardware" },
  { value: "otro", label: "Otro TI" },
];

const STEPS = [
  { id: "empresa", label: "Tu empresa", icon: Building2 },
  { id: "legal", label: "Estructura legal", icon: CheckCircle2 },
  { id: "contexto", label: "Contexto", icon: Sparkles },
];

export default function OnboardingWizard({ profile, onSave, onDismiss }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<MiltonProfile>({ ...profile });

  const update = (partial: Partial<MiltonProfile>) =>
    setDraft(prev => ({ ...prev, ...partial }));

  const eligibleCount = useMemo(
    () => ALL_FUNDS.filter(f => f.urgency !== "CLOSED" && isEligible(f, draft)).length,
    [draft]
  );

  const canNext = () => {
    if (step === 0) return draft.companyName.trim().length > 0;
    return true;
  };

  const handleFinish = () => onSave(draft);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-paper border-2 border-ink shadow-[8px_8px_0px_#000] w-full max-w-lg relative overflow-hidden"
      >
        {/* Top accent bar */}
        <div className="h-1 bg-ink w-full" />

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-ink/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-ink text-paper border border-ink">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink/60">
                Configura tu empresa
              </p>
              <h2 className="font-display text-2xl font-black text-ink uppercase leading-tight">
                Perfil de Startup
              </h2>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-ink/50 hover:text-ink cursor-pointer p-1 transition-colors mt-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Eligibility live counter */}
        <div className="bg-accent-green/10 border-b border-ink/10 px-6 py-2 flex items-center gap-2">
          <span className="inline-block h-2 w-2 bg-safe rounded-none animate-pulse" />
          <span className="font-mono text-xs font-bold text-ink">
            <span className="text-safe">{eligibleCount}</span> fondos elegibles con tu perfil actual
          </span>
        </div>

        {/* Step indicators */}
        <div className="flex border-b border-ink/20">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider border-r border-ink/15 last:border-0 transition-colors ${
                  i === step ? "bg-ink text-paper" : i < step ? "bg-paper-dark text-ink/70" : "text-ink/40"
                }`}
              >
                <Icon className="h-3 w-3" />
                {s.label}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="p-6 min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
            >
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-ink/70 mb-2">
                      Nombre de tu empresa / startup *
                    </label>
                    <input
                      type="text"
                      value={draft.companyName}
                      onChange={e => update({ companyName: e.target.value })}
                      placeholder="Ej: TechSur SpA, Nimbus Labs..."
                      className="w-full border border-ink bg-paper py-2.5 px-3 text-sm font-sans text-ink placeholder-ink/40 focus:outline-none focus:bg-paper-dark/20 transition-colors"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-ink/70 mb-2">
                      Sector tecnológico
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SECTORS.map(s => (
                        <button
                          key={s.value}
                          onClick={() => update({ sector: s.value })}
                          className={`text-left px-3 py-2 border text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                            draft.sector === s.value
                              ? "bg-ink text-paper border-ink"
                              : "bg-paper border-ink/40 text-ink/70 hover:border-ink hover:text-ink"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-ink/70 mb-2">
                      Etapa actual
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {STAGES.map(s => (
                        <button
                          key={s.value}
                          onClick={() => update({ stage: s.value })}
                          title={s.desc}
                          className={`px-3 py-1.5 border text-[11px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            draft.stage === s.value
                              ? "bg-ink text-paper border-ink"
                              : "bg-paper border-ink/40 text-ink/70 hover:border-ink hover:text-ink"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-xs font-serif text-ink/70 leading-relaxed">
                    Esta información determina tu elegibilidad para fondos CORFO, SERCOTEC y licitaciones. Marca solo lo que ya tienes constituido hoy.
                  </p>
                  {[
                    {
                      key: "hasSpA" as const,
                      label: "SpA constituida",
                      desc: "Sociedad por Acciones registrada en portalregistros.cl",
                    },
                    {
                      key: "hasSiiInitiated" as const,
                      label: "Iniciación de actividades SII",
                      desc: "Actividades iniciadas en sii.cl (persona natural o SpA)",
                    },
                    {
                      key: "hasWoman" as const,
                      label: "Socia fundadora mujer",
                      desc: "Al menos una mujer como socia o co-fundadora activa",
                    },
                    {
                      key: "hasSales" as const,
                      label: "Ventas iniciadas",
                      desc: "Has facturado al menos $1 a un cliente real",
                    },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => update({ [item.key]: !draft[item.key] })}
                      className={`w-full flex items-start gap-3 p-4 border-2 text-left transition-all cursor-pointer ${
                        draft[item.key]
                          ? "bg-ink text-paper border-ink"
                          : "bg-paper border-ink/30 hover:border-ink"
                      }`}
                    >
                      <div className={`h-4 w-4 border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                        draft[item.key] ? "bg-paper border-paper" : "border-ink/50"
                      }`}>
                        {draft[item.key] && <div className="h-2 w-2 bg-ink" />}
                      </div>
                      <div>
                        <span className="block text-xs font-mono font-bold uppercase">{item.label}</span>
                        <span className={`text-[11px] font-serif leading-relaxed ${draft[item.key] ? "text-paper/80" : "text-ink/60"}`}>
                          {item.desc}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-ink/70 mb-2">
                      Región donde opera
                    </label>
                    <select
                      value={draft.region}
                      onChange={e => update({ region: e.target.value })}
                      className="w-full border border-ink bg-paper py-2.5 px-3 text-sm font-sans text-ink focus:outline-none focus:bg-paper-dark/20 transition-colors cursor-pointer"
                    >
                      {REGIONS_CL.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-ink/70 mb-2">
                      Año de fundación (opcional)
                    </label>
                    <input
                      type="number"
                      value={draft.foundedYear ?? ""}
                      onChange={e => update({ foundedYear: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Ej: 2024"
                      min={2000}
                      max={new Date().getFullYear()}
                      className="w-full border border-ink bg-paper py-2.5 px-3 text-sm font-sans text-ink placeholder-ink/40 focus:outline-none focus:bg-paper-dark/20 transition-colors"
                    />
                  </div>
                  <div className="bg-accent-green/10 border border-ink/20 p-4 mt-2">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink/60 mb-2">Resumen de tu perfil</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-serif text-ink/80">
                      <span>Empresa: <strong className="font-sans font-bold">{draft.companyName || "—"}</strong></span>
                      <span>Sector: <strong className="font-sans font-bold">{draft.sector}</strong></span>
                      <span>Etapa: <strong className="font-sans font-bold">{draft.stage}</strong></span>
                      <span>Región: <strong className="font-sans font-bold">{draft.region}</strong></span>
                      <span>SpA: <strong className="font-sans font-bold">{draft.hasSpA ? "✓" : "✗"}</strong></span>
                      <span>SII: <strong className="font-sans font-bold">{draft.hasSiiInitiated ? "✓" : "✗"}</strong></span>
                      <span>Socia: <strong className="font-sans font-bold">{draft.hasWoman ? "✓" : "✗"}</strong></span>
                      <span>Ventas: <strong className="font-sans font-bold">{draft.hasSales ? "✓" : "✗"}</strong></span>
                    </div>
                    <p className="mt-3 text-xs font-mono font-bold text-safe">
                      → {eligibleCount} fondos elegibles con este perfil
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-5 border-t border-ink/20 bg-paper-dark/30">
          <button
            onClick={step === 0 ? onDismiss : () => setStep(s => s - 1)}
            className="flex items-center gap-1.5 px-4 py-2 border border-ink bg-paper font-mono text-xs font-bold uppercase shadow-[1.5px_1.5px_0px_#000] hover:bg-paper-dark active:translate-y-[0.5px] transition-all cursor-pointer"
          >
            {step === 0 ? (
              <><X className="h-3.5 w-3.5" /> Configurar después</>
            ) : (
              <><ChevronLeft className="h-3.5 w-3.5" /> Atrás</>
            )}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-1.5 px-5 py-2 bg-ink text-paper border-2 border-ink font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000] hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Siguiente <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-5 py-2 bg-accent-green text-white border-2 border-ink font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000] hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Guardar perfil
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
