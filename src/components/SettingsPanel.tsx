import { useMemo, useState } from "react";
import { Save, RotateCcw, Eye, EyeOff, Settings as SettingsIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { Fund, MiltonProfile } from "../types";
import {
  PromptsConfig,
  PROMPT_VARIABLES,
  DEFAULT_PROMPTS_CONFIG,
  loadPromptsConfig,
  savePromptsConfig,
  resetPromptsConfig,
  buildPromptVars,
  renderTemplate,
} from "../promptsConfig";

interface SettingsPanelProps {
  profile: MiltonProfile;
  stackedFunds: Fund[];
}

export default function SettingsPanel({ profile, stackedFunds }: SettingsPanelProps) {
  const [config, setConfig] = useState<PromptsConfig>(() => loadPromptsConfig());
  const [previewOpen, setPreviewOpen] = useState<Record<string, boolean>>({});
  const [savedFlash, setSavedFlash] = useState(false);

  const vars = useMemo(() => buildPromptVars(profile, stackedFunds, "configuracion"), [profile, stackedFunds]);

  const isDirty = useMemo(() => {
    const saved = loadPromptsConfig();
    return JSON.stringify(saved) !== JSON.stringify(config);
  }, [config]);

  const handleSave = () => {
    savePromptsConfig(config);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  const handleResetAll = () => {
    if (!confirm("¿Restaurar TODOS los prompts a los originales del sistema? Se perderán todas tus ediciones de forma irreversible.")) return;
    resetPromptsConfig();
    setConfig({ ...DEFAULT_PROMPTS_CONFIG, presets: DEFAULT_PROMPTS_CONFIG.presets.map(p => ({ ...p })) });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  const handleResetSystem = () => {
    setConfig(prev => ({ ...prev, systemPrompt: DEFAULT_PROMPTS_CONFIG.systemPrompt }));
  };

  const handleResetPreset = (id: string) => {
    const def = DEFAULT_PROMPTS_CONFIG.presets.find(p => p.id === id);
    if (!def) return;
    setConfig(prev => ({
      ...prev,
      presets: prev.presets.map(p => (p.id === id ? { ...def } : p)),
    }));
  };

  const togglePreview = (key: string) =>
    setPreviewOpen(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-8">
      {/* Header card */}
      <div className="bg-paper border-2 border-ink p-6 shadow-[4px_4px_0px_#1a1a1a]">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-ink text-paper border border-ink shrink-0">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <span className="block text-[10px] font-mono font-bold tracking-widest text-ink/60 uppercase">Configuración Avanzada</span>
            <h2 className="font-display text-3xl font-black text-ink uppercase leading-tight">Editor de Prompts IA</h2>
            <p className="text-sm font-serif text-ink/75 mt-2 leading-relaxed max-w-2xl">
              Lee y modifica los prompts del sistema que usa el Asesor IA. Los cambios se guardan en tu navegador (localStorage).
              Usa <code className="font-mono bg-paper-dark border border-ink/30 px-1 text-[11px]">{`{{variable}}`}</code> para insertar datos dinámicos.
            </p>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-ink/15">
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className="flex items-center gap-2 px-4 py-2 bg-accent-green text-white border-2 border-ink font-mono font-black uppercase text-xs shadow-[2px_2px_0px_#000] hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <Save className="h-3.5 w-3.5" />
            Guardar Cambios
          </button>
          <button
            onClick={handleResetAll}
            className="flex items-center gap-2 px-4 py-2 bg-alert text-white border-2 border-ink font-mono font-black uppercase text-xs shadow-[2px_2px_0px_#000] hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all cursor-pointer"
            title="Restaura los prompts originales del sistema y descarta tus ediciones"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Prompts Originales
          </button>
          {savedFlash && (
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-safe">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Guardado en localStorage
            </span>
          )}
          {isDirty && !savedFlash && (
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-warning">
              <AlertCircle className="h-3.5 w-3.5" />
              Cambios sin guardar
            </span>
          )}
        </div>
      </div>

      {/* Variables reference */}
      <div className="bg-paper-dark border-2 border-ink p-5">
        <h3 className="font-sans font-black text-sm text-ink uppercase mb-3 tracking-wider">Variables disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
          {PROMPT_VARIABLES.map(v => (
            <div key={v.name} className="flex items-baseline gap-2 text-[11px]">
              <code className="font-mono font-bold text-accent-purple bg-paper border border-ink/30 px-1.5 py-0.5 shrink-0">{v.name}</code>
              <span className="font-serif text-ink/75">{v.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System prompt editor */}
      <PromptEditor
        title="Prompt de Sistema"
        subtitle="Contexto inyectado en cada conversación. Define qué sabe la IA sobre el sistema."
        accent="bg-accent-blue"
        value={config.systemPrompt}
        onChange={v => setConfig(prev => ({ ...prev, systemPrompt: v }))}
        onReset={handleResetSystem}
        isDefault={config.systemPrompt === DEFAULT_PROMPTS_CONFIG.systemPrompt}
        previewOpen={!!previewOpen.system}
        onTogglePreview={() => togglePreview("system")}
        rendered={renderTemplate(config.systemPrompt, vars)}
        rows={14}
      />

      {/* Preset prompts */}
      <div className="space-y-6">
        <div className="border-b-2 border-ink pb-2">
          <h3 className="font-display text-2xl font-black uppercase text-ink">Atajos Rápidos (Presets)</h3>
          <p className="text-xs font-mono text-ink/60 mt-1">Los botones que aparecen en el panel del Asesor IA.</p>
        </div>

        {config.presets.map((preset, idx) => {
          const def = DEFAULT_PROMPTS_CONFIG.presets.find(p => p.id === preset.id);
          const isDefault = !!def && def.template === preset.template && def.label === preset.label;
          return (
            <div key={preset.id} className="bg-paper border-2 border-ink p-5 shadow-[3px_3px_0px_#1a1a1a] space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[10px] font-black uppercase text-ink/55 tracking-widest">Preset #{idx + 1} · id={preset.id}</span>
              </div>

              <label className="block">
                <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-ink/70 mb-1.5">Etiqueta del botón</span>
                <input
                  type="text"
                  value={preset.label}
                  onChange={e => {
                    const v = e.target.value;
                    setConfig(prev => ({
                      ...prev,
                      presets: prev.presets.map(p => (p.id === preset.id ? { ...p, label: v } : p)),
                    }));
                  }}
                  className="w-full border border-ink bg-paper py-2 px-3 text-sm font-sans font-bold text-ink focus:outline-none focus:bg-paper-dark/30 transition-colors"
                />
              </label>

              <PromptEditor
                title="Plantilla del prompt"
                subtitle={null}
                accent="bg-accent-purple"
                value={preset.template}
                onChange={v => {
                  setConfig(prev => ({
                    ...prev,
                    presets: prev.presets.map(p => (p.id === preset.id ? { ...p, template: v } : p)),
                  }));
                }}
                onReset={() => handleResetPreset(preset.id)}
                isDefault={isDefault}
                previewOpen={!!previewOpen[preset.id]}
                onTogglePreview={() => togglePreview(preset.id)}
                rendered={renderTemplate(preset.template, vars)}
                rows={6}
                inline
              />
            </div>
          );
        })}
      </div>

      {/* Banner restauración final */}
      <div className="bg-alert/10 border-2 border-alert p-5 shadow-[3px_3px_0px_#1a1a1a]">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <RotateCcw className="h-6 w-6 text-alert shrink-0 mt-0.5" />
            <div>
              <h3 className="font-sans font-black text-base text-ink uppercase">Restaurar Prompts Originales</h3>
              <p className="text-xs font-serif text-ink/75 mt-1 leading-relaxed max-w-2xl">
                Descarta todas tus ediciones y restaura el prompt de sistema y los 4 presets a los valores originales del Asesor IA. Acción irreversible.
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-alert text-white border-2 border-ink font-mono font-black uppercase text-xs shadow-[2px_2px_0px_#000] hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all cursor-pointer shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Originales
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditorProps {
  title: string;
  subtitle: string | null;
  accent: string;
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
  isDefault: boolean;
  previewOpen: boolean;
  onTogglePreview: () => void;
  rendered: string;
  rows: number;
  inline?: boolean;
}

function PromptEditor({
  title,
  subtitle,
  accent,
  value,
  onChange,
  onReset,
  isDefault,
  previewOpen,
  onTogglePreview,
  rendered,
  rows,
  inline,
}: EditorProps) {
  const Wrapper = inline ? "div" : "div";
  return (
    <Wrapper className={inline ? "" : "bg-paper border-2 border-ink p-5 shadow-[3px_3px_0px_#1a1a1a] space-y-4"}>
      {!inline && (
        <div className="flex items-start justify-between gap-3 border-b border-ink/15 pb-3">
          <div className="flex items-center gap-3">
            <span className={`inline-block w-2.5 h-2.5 ${accent} border border-ink`} />
            <div>
              <h3 className="font-sans font-black text-lg text-ink uppercase">{title}</h3>
              {subtitle && <p className="text-xs font-serif text-ink/70 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-1 border ${isDefault ? "border-ink/30 text-ink/50" : "border-accent-blue text-accent-blue"}`}>
            {isDefault ? "Por defecto" : "Modificado"}
          </span>
        </div>
      )}
      {inline && (
        <div className="flex items-center justify-between">
          <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-ink/70">{title}</span>
          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 border ${isDefault ? "border-ink/30 text-ink/50" : "border-accent-purple text-accent-purple"}`}>
            {isDefault ? "Por defecto" : "Modificado"}
          </span>
        </div>
      )}

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
        className="w-full border border-ink bg-paper py-3 px-3 text-xs font-mono text-ink leading-relaxed focus:outline-none focus:bg-paper-dark/20 transition-colors resize-y"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onTogglePreview}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-paper border border-ink font-mono text-[10px] font-bold uppercase shadow-[1.5px_1.5px_0px_#000] hover:bg-paper-dark active:translate-y-[0.5px] transition-all cursor-pointer"
        >
          {previewOpen ? <><EyeOff className="h-3 w-3" /> Ocultar preview</> : <><Eye className="h-3 w-3" /> Ver preview renderizado</>}
        </button>
        <button
          onClick={onReset}
          disabled={isDefault}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-paper border border-ink font-mono text-[10px] font-bold uppercase shadow-[1.5px_1.5px_0px_#000] hover:bg-warning hover:text-ink active:translate-y-[0.5px] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-paper"
        >
          <RotateCcw className="h-3 w-3" />
          Restaurar por defecto
        </button>
      </div>

      {previewOpen && (
        <div className="bg-paper-dark border border-ink/40 border-l-4 border-l-accent-blue p-3">
          <span className="block text-[9px] font-mono font-bold uppercase tracking-widest text-ink/60 mb-2">Preview renderizado (variables sustituidas con datos actuales)</span>
          <pre className="text-[11px] font-mono text-ink whitespace-pre-wrap leading-relaxed">{rendered}</pre>
        </div>
      )}
    </Wrapper>
  );
}
