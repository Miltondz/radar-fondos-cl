import { motion } from "motion/react";
import { 
  Plus, Trash2, Landmark, HelpCircle, CheckCircle, 
  AlertTriangle, ArrowRight, Layers, Sparkles, RefreshCw
} from "lucide-react";
import { Fund, Entity, FundStatus } from "../types";

interface StackerProps {
  stackedFunds: Fund[];
  onRemoveFromStack: (id: string) => void;
  onClearStack: () => void;
  hasWoman: boolean;
  onApplyPreset: (ids: string[]) => void;
}

export default function Stacker({ 
  stackedFunds, 
  onRemoveFromStack, 
  onClearStack, 
  hasWoman,
  onApplyPreset
}: StackerProps) {

  // Dynamically calculate individual values considering Milton's female-founder advantage
  const getDynamicAmountTextAndValue = (fund: Fund): { text: string; val: number } => {
    if (fund.id === "corfo-semilla-inicia-rm-2026" && hasWoman) {
      return { text: "$17.000.000 CLP (Beca de Género)", val: 17000000 };
    }
    return { text: fund.amount, val: fund.amountNumber };
  };

  // Computes the math
  const totalAmount = stackedFunds.reduce((acc, fund) => {
    const { val } = getDynamicAmountTextAndValue(fund);
    return acc + val;
  }, 0);

  // Stacking Rules Diagnostic
  const numCorfo = stackedFunds.filter(f => f.entity === Entity.CORFO).length;
  const numSercotec = stackedFunds.filter(f => f.entity === Entity.SERCOTEC).length;
  const numStartupChile = stackedFunds.filter(f => f.entity === Entity.STARTUP_CHILE).length;

  let messageState = {
    type: "success" as "success" | "warning" | "neutral",
    title: "Stack Balanceado",
    desc: "Añade fondos para calcular tu subsidio acumulable estratégico."
  };

  if (stackedFunds.length > 0) {
    if (numCorfo > 1 && numSercotec > 1) {
      messageState = {
        type: "warning",
        title: "Doble Restricción Estatal",
        desc: "Atención: Posees múltiples subsidios de CORFO y de SERCOTEC. El Estado de Chile prohíbe adjudicar más de un subsidio para un mismo componente tecnológico por entidad básica."
      };
    } else if (numCorfo > 1) {
      messageState = {
        type: "warning",
        title: "Regla de Oro CORFO",
        desc: "Tienes más de un fondo CORFO. Tendrás que asignar proyectos separados u optar por uno solo en el hito de firma de convenio."
      };
    } else if (numSercotec > 1) {
      messageState = {
        type: "warning",
        title: "Límitaciones de Concurrencia SERCOTEC",
        desc: "SERCOTEC impide recibir dos fondos de emprendimiento concurrentes. Te sugerimos optar por el de mayor financiamiento."
      };
    } else if (numStartupChile > 0 && numCorfo > 0 && numSercotec > 0) {
      messageState = {
        type: "success",
        title: "¡Super Triple Stack Compatible!",
        desc: "Excelente: Combina Startup Chile Build + 1 Corfo Inicia + 1 Sercotec Abeja. Al ser líneas regulatorias independientes, ¡está 100% aprobado!"
      };
    } else if (numStartupChile > 0 && (numCorfo > 0 || numSercotec > 0)) {
      messageState = {
        type: "success",
        title: "Stacking Altamente Recomendado",
        desc: "¡Combo estratégico correcto! Startup Chile se financia sin ceder capital accionario y es totalmente compatible con la red estatal de fomento CORFO/SERCOTEC."
      };
    } else {
      messageState = {
        type: "success",
        title: "Stacking Válido",
        desc: "Tus fondos elegidos son compatibles para ejecuciones paralelas de fomento inicial."
      };
    }
  }

  // Pre-configured Chilean strategic stacks
  const PRESET_STACKS = [
    {
      name: "Combo Inicial Idea",
      desc: "Semilla Inicia RM + Startup Chile Build",
      totalText: "$30.000.000 CLP",
      ids: ["corfo-semilla-inicia-rm-2026", "startup-chile-build-big12"],
      badge: "Recomendado"
    },
    {
      name: "Combo I+D Alta Complejidad",
      desc: "Semilla Inicia RM + Crea y Valida Perfil",
      totalText: "$195.000.000 CLP",
      ids: ["corfo-semilla-inicia-rm-2026", "corfo-crea-valida-2026"],
      badge: "Innovación TI"
    },
    {
      name: "Sinergia Total Femenina",
      desc: "Capital Abeja + Semilla Inicia Mujeres",
      totalText: "$20.500.000 CLP",
      ids: ["sercotec-abeja-2026", "corfo-semilla-inicia-mujeres-2026"],
      badge: "Género Activo"
    }
  ];

  return (
    <div className="bg-paper-dark border-2 border-ink p-6 relative shadow-[4px_4px_0px_#1a1a1a]" id="vis-fund-stacker">
      <div className="absolute top-4 right-4 text-ink">
        <Layers className="h-5 w-5 opacity-50" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        
        {/* Left Column: Presets list & Rule explanations */}
        <div className="flex-1 space-y-5">
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-widest text-alert font-bold">HERRAMIENTAS DE CO-ESTRATEGIA</span>
            <h3 className="font-serif font-black text-2xl italic text-ink flex items-center gap-2 mt-0.5">
              <Sparkles className="h-5 w-5 text-alert animate-bounce" />
              Sinergia y Apilamiento de Subsidios (Stacking)
            </h3>
            <p className="text-xs font-serif text-ink/80 mt-1.5 max-w-2xl leading-relaxed">
              ¿Sabías que puedes adjudicar múltiples fondos si provienen de entidades independientes? 
              Monta tu plan de inyecciones financieras con estos modelos técnicos pre-evaluados:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESET_STACKS.map((preset, index) => (
              <button
                key={index}
                onClick={() => onApplyPreset(preset.ids)}
                className="text-left bg-paper hover:bg-paper-dark border border-ink p-3.5 transition-all group relative cursor-pointer flex flex-col justify-between shadow-[2px_2px_0px_rgba(0,0,0,1)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-paper bg-ink px-1.5 py-0.5">
                      {preset.badge}
                    </span>
                    <span className="text-[10px] text-ink font-mono font-bold uppercase tracking-wide group-hover:underline">
                      Cargar
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-ink font-sans tracking-tight">
                    {preset.name}
                  </h4>
                  <p className="text-[10px] text-ink/75 mt-1 line-clamp-2 leading-relaxed">
                    {preset.desc}
                  </p>
                </div>
                <div className="mt-4 border-t border-ink/20 pt-2 flex items-center justify-between text-xs">
                  <span className="font-mono font-black text-ink">{preset.totalText}</span>
                  <ArrowRight className="h-3 w-3 text-ink group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>

          {/* Quick legal checklist rules */}
          <div className="bg-paper p-4 border border-ink text-xs text-ink/90 space-y-2.5">
            <span className="font-mono text-[9px] text-ink font-black uppercase tracking-wider block border-b border-ink/20 pb-1">📋 REGLAMENTO OFICIAL DE REVOLVENCIA FISCAL</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-relaxed font-serif">
              <div className="flex items-start gap-1">
                <span className="text-safe font-bold font-sans">✓</span>
                <span>Un mismo proyecto puede acumular 1 canasta CORFO y 1 SERCOTEC simultáneamente.</span>
              </div>
              <div className="flex items-start gap-1">
                <span className="text-safe font-bold font-sans">✓</span>
                <span>Startup Chile es un ente propio y NO computa como cupo estatal excluyente de CORFO central.</span>
              </div>
              <div className="flex items-start gap-1">
                <span className="text-safe font-bold font-sans">✓</span>
                <span>Créditos de fomento y contratos con el Estado (Compra Ágil) son 100% compatibles.</span>
              </div>
              <div className="flex items-start gap-1">
                <span className="text-safe font-bold font-sans">✓</span>
                <span>Premios pecuniarios de aceleradoras privadas o universidades de Chile no restan elegibilidad alguna.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Interactive Stack Block */}
        <div className="w-full lg:w-96 bg-paper border border-ink p-5 flex flex-col justify-between gap-5 shadow-[3px_3px_0px_rgba(0,0,0,0.1)] relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-ink pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-ink shrink-0" />
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-ink">Bolsa del Portafolio</h4>
              </div>
              {stackedFunds.length > 0 && (
                <button
                  onClick={onClearStack}
                  className="text-[10px] font-mono text-ink/65 hover:text-alert flex items-center gap-1 cursor-pointer transition-colors font-bold uppercase"
                >
                  <RefreshCw className="h-3 w-3" />
                  Vaciar
                </button>
              )}
            </div>

            {/* List of items in current stack */}
            {stackedFunds.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-ink bg-paper-dark">
                <Layers className="mx-auto h-8 w-8 text-ink/40 stroke-[1.5]" />
                <p className="text-xs font-semibold text-ink/70 mt-2">Bolsa Vacía</p>
                <p className="text-[10px] text-ink/60 mt-1 max-w-[200px] mx-auto leading-relaxed">
                  Presiona el botón de "Stackear" en la tabla de fondos para consolidar tu plan estratégico.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {stackedFunds.map((fund, index) => {
                  const { text } = getDynamicAmountTextAndValue(fund);
                  return (
                    <motion.div
                      key={fund.id}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between bg-paper-dark p-3 border border-ink"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="h-6 w-6 border border-ink bg-paper flex items-center justify-center text-[10px] font-mono font-bold text-ink shrink-0">
                          {index + 1}
                        </div>
                        <div className="truncate">
                          <span className="block text-xs font-bold text-ink truncate font-sans">{fund.name}</span>
                          <span className="block text-[10px] text-ink/75 font-mono">{text}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveFromStack(fund.id)}
                        className="p-1.5 text-ink/50 hover:text-alert hover:bg-alert/5 transition-colors cursor-pointer"
                        title="Borrar de la pila"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dynamic math totals & diagnostic message */}
          {stackedFunds.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-ink">
              
              {/* Stack diagnosis notification */}
              <div className={`border p-3 text-xs leading-relaxed flex items-start gap-2.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                messageState.type === "warning"
                  ? "bg-[#fab1a0] border-ink text-ink font-bold"
                  : "bg-safe/10 border-ink text-ink"
              }`}>
                {messageState.type === "warning" ? (
                  <AlertTriangle className="h-4.5 w-4.5 mt-0.5 text-alert shrink-0" />
                ) : (
                  <CheckCircle className="h-4.5 w-4.5 mt-0.5 text-safe shrink-0" />
                )}
                <div className="font-serif">
                  <strong className="block text-ink font-sans font-bold text-[11px] uppercase tracking-wider">{messageState.title}</strong>
                  <span className="text-[10.5pt] leading-snug block mt-1">{messageState.desc}</span>
                </div>
              </div>

              {/* Mathematics line */}
              <div className="flex flex-col gap-1 border-t border-ink/20 pt-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink/60">Subsidio Ponderado Estimado:</span>
                <span className="text-2xl font-serif font-black text-alert leading-none">
                  ${totalAmount.toLocaleString("es-CL")} CLP
                </span>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
