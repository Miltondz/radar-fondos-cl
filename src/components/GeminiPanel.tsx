import { useState, useRef } from "react";
import { Send, Sparkles, AlertCircle, Bot, Trash2 } from "lucide-react";
import OpenAI from "openai";
import { Fund, MiltonProfile } from "../types";
import { ALL_FUNDS } from "../data";
import { formatCLP } from "../utils";

const VIEW_LABELS: Record<string, string> = {
  landing: "Resumen e Inicio",
  financiamientos: "Subsidios y Financiamientos",
  licitaciones: "Licitaciones y Compras Públicas",
  hackatones: "Hackatones y Desafíos",
  roadmap: "Plan de Acción",
  agenda: "Agenda y Timeline",
  ia: "Asesor IA (vista completa)",
};

interface GeminiPanelProps {
  profile: MiltonProfile;
  stackedFunds: Fund[];
  currentView?: string;
  isCompact?: boolean;
}

const OR_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;

const MODELS = [
  "deepseek/deepseek-v4-flash:free",
  "minimax/minimax-m2.5:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
] as const;

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PRESET_PROMPTS = [
  {
    label: "🎯 Priorizar Fondos",
    build: (profile: MiltonProfile, stacked: Fund[]) =>
      `Soy fundador de una startup TI chilena. Mi perfil: socia_femenina=${profile.hasWoman}, SpA=${profile.hasSpA}, ventas_iniciadas=${profile.hasSales}, SII_iniciado=${profile.hasSiiInitiated}. Portafolio actual: ${stacked.map(f => f.name).join(", ") || "ninguno aún"}. Considerando todos los fondos disponibles en el sistema, ¿cuáles son los 3 que debo priorizar absolutamente este mes y por qué? Sé específico sobre plazos y montos.`
  },
  {
    label: "📋 Diagnóstico Elegibilidad",
    build: (profile: MiltonProfile, stacked: Fund[]) =>
      `Analiza mi elegibilidad para los fondos en mi portafolio. Perfil: socia_femenina=${profile.hasWoman}, SpA=${profile.hasSpA}, ventas=${profile.hasSales}, SII=${profile.hasSiiInitiated}. Portafolio: ${stacked.map(f => `${f.name} [requiere_mujer:${f.eligibilityGenderRequired}, requiere_SpA:${f.requiresSpA}, requiere_SII:${f.SIIRequired}, sin_ventas:${f.eligibilitySalesRestricted}]`).join("; ") || "vacío"}. Dame diagnóstico detallado de elegibilidad, requisitos pendientes críticos y próximos pasos concretos para cada fondo.`
  },
  {
    label: "📝 Pitch CORFO",
    build: (_profile: MiltonProfile, _stacked: Fund[]) =>
      `Redacta un pitch ejecutivo de 350 palabras para postular a CORFO Semilla Inicia, orientado a startup de software TI chilena. Incluir: problema claro, solución tecnológica diferenciada, mercado objetivo con tamaño, modelo de negocio, tracción actual o validaciones, descripción del equipo y uso específico de los fondos solicitados. Formato CORFO: claro, sin jerga, énfasis en impacto económico regional y escalabilidad.`
  },
  {
    label: "💡 Estrategia Stacking",
    build: (profile: MiltonProfile, stacked: Fund[]) =>
      `Como asesor experto en financiamiento público chileno, analiza este portafolio de stacking: ${stacked.map(f => `${f.name} (entidad: ${f.entity || f.organizer})`).join(", ") || "portafolio vacío"}. Perfil Milton: ${profile.hasWoman ? "con socia fundadora" : "sin socia"}, ${profile.hasSpA ? "SpA constituida" : "sin SpA"}. ¿Es compatible según normativa chilena de concurrencia de subsidios CORFO/SERCOTEC? Identifica conflictos regulatorios y sugiere la combinación óptima que maximice el financiamiento total sin infringir restricciones.`
  },
];

function buildSystemContext(profile: MiltonProfile, stackedFunds: Fund[], currentView?: string) {
  const financiamientos = ALL_FUNDS.filter(f => f.type === "financiamiento" && f.urgency !== "CLOSED");
  const licitaciones = ALL_FUNDS.filter(f => f.type === "licitacion");
  const hackatones = ALL_FUNDS.filter(f => f.type === "hackaton");
  const viewLabel = currentView ? (VIEW_LABELS[currentView] || currentView) : "Desconocida";
  return `=== CONTEXTO RADAR FONDOS CL — Chile, Mayo 2026 ===
VISTA_ACTIVA: ${viewLabel} — el usuario está revisando este panel ahora mismo.
PERFIL MILTON: socia_femenina=${profile.hasWoman} | SpA_constituida=${profile.hasSpA} | ventas_iniciadas=${profile.hasSales} | SII_iniciado=${profile.hasSiiInitiated}
PORTAFOLIO ACTIVO (${stackedFunds.length} fondos): ${stackedFunds.map(f => `${f.name} (${formatCLP(f.amountNumber)})`).join(" + ") || "vacío"}
FINANCIAMIENTOS ACTIVOS (${financiamientos.length}): ${financiamientos.map(f => `${f.name}|${f.entity}|${formatCLP(f.amountNumber)}|cierre:${f.deadline}|reqMujer:${f.eligibilityGenderRequired}|reqSpA:${f.requiresSpA}|reqSII:${f.SIIRequired}`).join(" // ")}
LICITACIONES (${licitaciones.length}): ${licitaciones.map(f => `${f.name}|${f.chileCode || ""}|${formatCLP(f.amountNumber)}|${f.organizer}`).join(" // ")}
HACKATONES (${hackatones.length}): ${hackatones.map(f => `${f.name}|${f.organizer}|${formatCLP(f.amountNumber)}|cierre:${f.deadline}`).join(" // ")}

Eres un asesor experto en financiamiento gubernamental para startups tecnológicas chilenas. Usa el contexto del sistema para respuestas precisas y personalizadas. Responde siempre en español, de forma concisa y accionable. Cita nombres específicos de fondos, montos y fechas del contexto cuando sea relevante.`;
}

export default function GeminiPanel({ profile, stackedFunds, currentView, isCompact = false }: GeminiPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const client = OR_KEY
    ? new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: OR_KEY,
        dangerouslyAllowBrowser: true,
        defaultHeaders: {
          "HTTP-Referer": "https://radar-fondos-cl.netlify.app",
          "X-Title": "Radar Fondos CL",
        },
      })
    : null;

  const sendMessage = async (userText: string) => {
    if (!userText.trim() || !client) return;
    setError(null);
    const userMsg: Message = { role: "user", content: userText };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setLoading(true);

    const systemCtx = buildSystemContext(profile, stackedFunds, currentView);
    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemCtx },
      ...allMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    let lastError: Error | null = null;
    for (const model of MODELS) {
      try {
        const completion = await client.chat.completions.create({
          model,
          messages: chatMessages,
          temperature: 0.65,
          max_tokens: 1200,
        });
        const text = completion.choices[0]?.message?.content || "Sin respuesta del modelo.";
        setMessages(prev => [...prev, { role: "assistant", content: text }]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        lastError = null;
        break;
      } catch (e: unknown) {
        lastError = e instanceof Error ? e : new Error("Error desconocido");
      }
    }

    if (lastError) {
      setError(lastError.message);
    }
    setLoading(false);
  };

  if (!OR_KEY) {
    return (
      <div className="bg-paper border-2 border-ink p-8 shadow-[4px_4px_0px_#1a1a1a] space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-ink text-paper border border-ink">
            <Bot className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-sans font-black text-2xl text-ink">Asesor IA — DeepSeek V3</h3>
            <p className="text-xs font-mono text-ink/60 uppercase tracking-wider mt-0.5">Configuración de API requerida</p>
          </div>
        </div>
        <div className="bg-warning/20 border-2 border-ink p-5 flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-ink shrink-0 mt-0.5" />
          <div className="text-sm font-serif leading-relaxed space-y-3">
            <strong className="font-sans font-bold block text-base">Clave API no configurada</strong>
            <p>Para activar el Asesor IA, agrega tu clave de OpenRouter al archivo <code className="bg-paper px-1.5 py-0.5 font-mono text-xs border border-ink/40">.env.local</code> en la raíz del proyecto:</p>
            <pre className="bg-paper font-mono text-xs p-3 border border-ink/30 overflow-x-auto">VITE_OPENROUTER_API_KEY=tu_clave_aqui</pre>
            <p className="text-xs">Obtén tu clave en <strong>openrouter.ai</strong> → Keys → Create Key. El modelo <code className="font-mono">deepseek/deepseek-v4-flash:free</code> es gratuito. Luego reinicia el servidor de desarrollo.</p>
          </div>
        </div>
        <div className="bg-paper-dark border border-ink/30 p-4 text-xs font-serif text-ink/75 leading-relaxed">
          <strong className="font-sans font-bold block mb-1 uppercase text-[10px] tracking-wider">¿Qué hace el Asesor IA?</strong>
          Analiza tu perfil de Milton, el portafolio activo y todos los fondos disponibles para darte recomendaciones estratégicas personalizadas: priorización de fondos, diagnóstico de elegibilidad, redacción de pitch CORFO, y estrategias de stacking compatibles con la normativa chilena.
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-paper ${isCompact ? "" : "border-2 border-ink shadow-[4px_4px_0px_#1a1a1a]"} flex flex-col`} style={{ minHeight: isCompact ? "unset" : "620px" }}>

      {/* Header bar */}
      <div className="border-b-2 border-ink p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-purple text-white border-2 border-ink">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <span className="block text-[9px] font-mono font-bold tracking-widest text-ink/60 uppercase">Inteligencia Artificial Estratégica</span>
            <h3 className="font-serif font-black text-xl text-ink leading-none">Asesor IA — DeepSeek V3</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-safe border border-safe px-2 py-1 uppercase">
            ● Activo
          </span>
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); setError(null); }}
              className="p-1.5 border border-ink/40 text-ink/50 hover:text-alert hover:border-alert cursor-pointer transition-colors"
              title="Limpiar conversación"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Preset prompt buttons */}
      <div className="border-b border-ink/20 p-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {PRESET_PROMPTS.map((preset, i) => (
          <button
            key={i}
            onClick={() => sendMessage(preset.build(profile, stackedFunds))}
            disabled={loading}
            className="px-3 py-2.5 text-[10px] font-mono font-bold uppercase border border-ink bg-paper hover:bg-accent-purple hover:text-white hover:border-accent-purple transition-all cursor-pointer text-left leading-snug disabled:opacity-50 disabled:cursor-not-allowed shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] active:translate-y-[0.5px]"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Context summary */}
      <div className="px-5 py-2 border-b border-ink/10 bg-paper-dark/40 font-mono text-[9.5px] text-ink/50 flex flex-wrap gap-3">
        <span>{ALL_FUNDS.length} fondos cargados</span>
        <span>·</span>
        <span>{stackedFunds.length} en portafolio</span>
        <span>·</span>
        <span>Perfil: {[
          profile.hasWoman && "socia ✓",
          profile.hasSpA && "SpA ✓",
          profile.hasSiiInitiated && "SII ✓",
          profile.hasSales && "ventas ✓",
        ].filter(Boolean).join(" · ") || "sin configurar"}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar" style={{ minHeight: isCompact ? "200px" : "320px", maxHeight: isCompact ? "320px" : "440px" }}>
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="mx-auto h-12 w-12 text-ink/25 mb-4" />
            <p className="text-sm font-serif italic text-ink/55 max-w-sm mx-auto leading-relaxed">
              Usa los atajos rápidos de arriba o escribe tu consulta sobre financiamiento, elegibilidad o estrategia.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] p-3.5 border text-xs font-serif leading-relaxed ${
              msg.role === "user"
                ? "bg-ink text-paper border-ink"
                : "bg-paper-dark text-ink border-ink/25 border-l-4 border-l-accent-purple"
            }`}>
              {msg.role === "assistant" && (
                <span className="text-[9px] font-mono font-bold uppercase text-accent-purple block mb-2">Asesor IA →</span>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-paper-dark border border-ink/25 border-l-4 border-l-accent-purple p-3.5 text-xs font-mono text-ink/55 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-accent-purple" />
              <span className="animate-pulse">Analizando fondos, perfil y normativa chilena...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-alert/10 border border-alert p-3 text-xs font-serif text-alert">
            <strong className="font-sans">Error de API:</strong> {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t-2 border-ink p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder="Escribe tu consulta sobre fondos, elegibilidad, stacking, pitch..."
          disabled={loading}
          className="flex-1 border border-ink bg-paper py-2.5 px-3 text-xs text-ink placeholder-ink/45 focus:outline-none focus:ring-0 hover:bg-paper-dark/30 disabled:opacity-50 transition-colors"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-accent-purple text-white border-2 border-ink font-mono font-bold uppercase text-xs shadow-[2px_2px_0px_#000] hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-1.5 shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
          Enviar
        </button>
      </div>
    </div>
  );
}
