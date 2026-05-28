import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Trash2, CheckCircle, AlertCircle, Plus, RefreshCcw, Package, Link } from "lucide-react";
import OpenAI from "openai";
import { Fund, FundStatus } from "../types";
import { ALL_FUNDS } from "../data";
import SectionHeader from "./SectionHeader";
import { SECTION_COPY } from "../copy";

interface ViewImportProps {
  customFunds: Fund[];
  onImportFund: (fund: Fund) => void;
  onDeleteCustomFund: (id: string) => void;
  initialUrl?: string;
  onUrlConsumed?: () => void;
}

const OR_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;

const MODELS = [
  "openai/gpt-oss-120b:free",
  "minimax/minimax-m2.5:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "google/gemini-2.5-flash",
] as const;

const EXTRACTION_SYSTEM_PROMPT = `Eres un asistente de extracción de datos para "Radar Fondos CL", plataforma de inteligencia de financiamiento para startups chilenas.

Tu tarea: analizar el contenido y extraer de forma COMPLETA y DETALLADA los datos de una convocatoria de fondos, licitación o hackaton en formato JSON.

REGLAS ESTRICTAS:
1. Devuelve SOLO JSON válido. Sin markdown, sin explicaciones, sin texto extra.
2. Si el contenido NO contiene una convocatoria real: {"error": "No se encontró información de una convocatoria en el contenido."}
3. type: "financiamiento" (subsidio/capital/no reembolsable), "licitacion" (contrato público), "hackaton" (competencia/desafío).
4. amountNumber: entero en CLP. USD → multiplica por 950. Sin dato → 0.
5. urgency: "CRITICAL" <7 días desde hoy 2026-05-28, "HIGH" <30 días, "MEDIUM" <90 días, "LOW" mayor plazo, "CLOSED" cerrado.
6. Extrae TODOS los requisitos que encuentres (hasta 10 items).
7. basesResumen: redacta un resumen estructurado de las bases con los puntos más importantes (elegibilidad, proceso de postulación, criterios de evaluación, compromisos del beneficiario). Mínimo 300 caracteres, máximo 800.
8. basesUrl: busca activamente el enlace directo al documento de bases, formulario de postulación o página oficial. Si el contenido tiene URLs, extrae la más relevante para postular.
9. cofinancing: porcentaje o monto de cofinanciamiento requerido si aplica.
10. eligibilityNotes: resumen de quién puede y quién NO puede postular.

Formato JSON a devolver:
{
  "name": "Nombre oficial completo",
  "entity": "Organismo convocante",
  "amount": "Monto legible (ej: 'hasta $20.000.000 CLP')",
  "amountNumber": 20000000,
  "deadline": "Fecha límite en español",
  "deadlineISO": "YYYY-MM-DD o ''",
  "description": "Descripción completa del programa — qué financia, para qué etapa, qué resultados espera (máx 500 caracteres)",
  "category": "Seed|Growth|Innovation|Credit|R&D u otro",
  "type": "financiamiento|licitacion|hackaton",
  "url": "URL de la página fuente",
  "basesUrl": "URL directa al documento de bases, formulario o plataforma de postulación",
  "organizer": "Organismo específico",
  "requirements": ["Requisito detallado 1", "Requisito detallado 2"],
  "eligibilityNotes": "Quién puede postular y condiciones de exclusión",
  "urgency": "CRITICAL|HIGH|MEDIUM|LOW|CLOSED",
  "basesResumen": "Resumen estructurado de las bases: objetivo del programa, montos disponibles, proceso de postulación paso a paso, criterios de evaluación, compromisos del beneficiario, plazos clave",
  "cofinancing": "Porcentaje o monto de cofinanciamiento requerido, o '' si no aplica",
  "tips": "Consejo estratégico clave para el postulante (máx 150 caracteres)",
  "chileCode": "Código licitación si aplica",
  "address": "Dirección si es presencial"
}`;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i").replace(/[óòö]/g, "o")
    .replace(/[úùü]/g, "u").replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function normalizeName(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function checkDuplicate(name: string, entity: string, allFunds: Fund[], customFunds: Fund[]): Fund | null {
  const nName = normalizeName(name);
  const nEntity = normalizeName(entity);
  return [...allFunds, ...customFunds].find(f =>
    normalizeName(f.name) === nName ||
    (normalizeName(f.entity) === nEntity && normalizeName(f.name).slice(0, 20) === nName.slice(0, 20))
  ) ?? null;
}

type FundType = "financiamiento" | "licitacion" | "hackaton";

interface FundDraft {
  name: string;
  entity: string;
  amount: string;
  amountNumber: number;
  deadline: string;
  deadlineISO: string;
  description: string;
  category: string;
  type: FundType;
  url: string;
  basesUrl: string;
  organizer: string;
  requirements: string[];
  eligibilityNotes: string;
  urgency: Fund["urgency"];
  basesResumen: string;
  cofinancing: string;
  tips: string;
  chileCode: string;
  address: string;
}

const URGENCY_COLORS: Record<string, string> = {
  CRITICAL: "bg-alert text-white",
  HIGH: "bg-warning text-ink",
  MEDIUM: "bg-accent-blue text-white",
  LOW: "bg-accent-green text-white",
  CLOSED: "bg-ink/40 text-white",
};

const TYPE_LABELS: Record<string, string> = {
  financiamiento: "💰 Subsidio",
  licitacion: "🏛️ Licitación",
  hackaton: "⚡ Hackaton",
};

const PERPLEXITY_MODELS = [
  "perplexity/sonar",
  "perplexity/sonar-pro",
] as const;

export default function ViewImport({ customFunds, onImportFund, onDeleteCustomFund, initialUrl, onUrlConsumed }: ViewImportProps) {
  const [inputText, setInputText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [fetchStatus, setFetchStatus] = useState("");
  const [usePerplexity, setUsePerplexity] = useState<boolean>(() => {
    try { return localStorage.getItem("radar_import_perplexity") === "true"; }
    catch { return false; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<FundDraft | null>(null);
  const [success, setSuccess] = useState(false);

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

  const duplicate = useMemo(
    () => draft ? checkDuplicate(draft.name, draft.entity, ALL_FUNDS, customFunds) : null,
    [draft, customFunds]
  );

  // Shared: parse raw AI response → set draft. Returns true if draft was set.
  const applyParsedJson = useCallback((raw: string, sourceUrl = ""): boolean => {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return false;
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error || !parsed.name) return false;
      const typeVal = ["financiamiento", "licitacion", "hackaton"].includes(parsed.type)
        ? (parsed.type as FundType)
        : "financiamiento";
      const urgencyVal = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "CLOSED"].includes(parsed.urgency)
        ? (parsed.urgency as Fund["urgency"])
        : "MEDIUM";
      setDraft({
        name: String(parsed.name ?? "Sin nombre"),
        entity: String(parsed.entity ?? "Desconocido"),
        amount: String(parsed.amount ?? "N/D"),
        amountNumber: Number(parsed.amountNumber) || 0,
        deadline: String(parsed.deadline ?? "Por confirmar"),
        deadlineISO: String(parsed.deadlineISO ?? ""),
        description: String(parsed.description ?? ""),
        category: String(parsed.category ?? "Innovation"),
        type: typeVal,
        url: sourceUrl || String(parsed.url ?? ""),
        basesUrl: String(parsed.basesUrl ?? ""),
        organizer: String(parsed.organizer ?? parsed.entity ?? ""),
        requirements: Array.isArray(parsed.requirements) ? parsed.requirements.map(String) : [],
        eligibilityNotes: String(parsed.eligibilityNotes ?? ""),
        urgency: urgencyVal,
        basesResumen: String(parsed.basesResumen ?? ""),
        cofinancing: String(parsed.cofinancing ?? ""),
        tips: String(parsed.tips ?? ""),
        chileCode: String(parsed.chileCode ?? ""),
        address: String(parsed.address ?? ""),
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleFetchUrl = useCallback(async (urlOverride?: string) => {
    const targetUrl = (urlOverride ?? urlInput).trim();
    if (!targetUrl) return;
    setUrlLoading(true);
    setError(null);

    // Helper: call Perplexity online and set draft or textarea
    const tryPerplexity = async (): Promise<boolean> => {
      if (!client) return false;
      setFetchStatus("Consultando Perplexity con acceso web…");
      for (const model of PERPLEXITY_MODELS) {
        try {
          const completion = await client.chat.completions.create({
            model,
            messages: [
              { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
              { role: "user", content: `Lee el contenido de esta URL y extrae los datos de la convocatoria en JSON:\n\n${targetUrl}` },
            ],
            temperature: 0.1,
            max_tokens: 1500,
          });
          const raw = completion.choices[0]?.message?.content ?? "";
          if (applyParsedJson(raw, targetUrl)) return true;
          if (raw.trim()) { setInputText(raw.slice(0, 6000)); return true; }
        } catch { /* try next */ }
      }
      return false;
    };

    // If Perplexity-first mode: skip proxies entirely
    if (usePerplexity) {
      const ok = await tryPerplexity();
      if (ok) {
        if (!urlOverride) setUrlInput("");
        onUrlConsumed?.();
      } else {
        setError("Perplexity no pudo procesar la URL. Verifica la API key o copia el texto manualmente.");
      }
      setFetchStatus("");
      setUrlLoading(false);
      return;
    }

    // 1. CORS proxy cascade
    const PROXIES: Array<{ buildUrl: (u: string) => string; parse: (r: Response) => Promise<string> }> = [
      {
        buildUrl: (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        parse: async (r) => await r.text(),
      },
      {
        buildUrl: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
        parse: async (r) => await r.text(),
      },
      {
        buildUrl: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
        parse: async (r) => {
          const d = await r.json() as { contents?: string };
          return d.contents ?? "";
        },
      },
    ];

    for (const proxy of PROXIES) {
      try {
        setFetchStatus("Cargando página…");
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(proxy.buildUrl(targetUrl), { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await proxy.parse(res);
        if (!html) throw new Error("Respuesta vacía.");
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        doc.querySelectorAll("script,style,nav,footer,header,aside,noscript,[role='navigation'],[role='banner']").forEach(el => el.remove());
        const text = (doc.body?.innerText || doc.body?.textContent || "")
          .replace(/\s{3,}/g, "\n\n")
          .trim();
        if (!text) throw new Error("Sin texto extraíble.");
        setInputText(prev => {
          const combined = prev ? `${prev}\n\n---\n\n${text}` : text;
          return combined.slice(0, 6000);
        });
        if (!urlOverride) setUrlInput("");
        onUrlConsumed?.();
        setFetchStatus("");
        setUrlLoading(false);
        return;
      } catch {
        // try next proxy
      }
    }

    // 2. Perplexity fallback when proxies all failed
    setFetchStatus("Proxies bloqueados — intentando Perplexity como respaldo…");
    const ok = await tryPerplexity();
    if (ok) {
      if (!urlOverride) setUrlInput("");
      onUrlConsumed?.();
    } else {
      setError("No se pudo cargar la URL. Proxies y Perplexity fallaron. Copia el texto de la página manualmente.");
    }
    setFetchStatus("");
    setUrlLoading(false);
  }, [urlInput, onUrlConsumed, client, applyParsedJson, usePerplexity]);

  useEffect(() => {
    if (initialUrl) {
      setUrlInput(initialUrl);
      handleFetchUrl(initialUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  const handleAnalyze = async () => {
    if (!inputText.trim() || !client) return;
    setLoading(true);
    setError(null);
    setDraft(null);
    setSuccess(false);

    let lastError: Error | null = null;
    for (const model of MODELS) {
      try {
        const completion = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
            { role: "user", content: `Analiza este contenido y extrae la convocatoria:\n\n${inputText.slice(0, 4000)}` },
          ],
          temperature: 0.1,
          max_tokens: 1500,
        });
        const raw = completion.choices[0]?.message?.content ?? "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Respuesta sin JSON válido.");
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.error) { setError(parsed.error); setLoading(false); return; }
        if (applyParsedJson(raw)) { setLoading(false); return; }
        throw new Error("No se pudo estructurar el JSON extraído.");
      } catch (e) {
        lastError = e as Error;
      }
    }
    setError(`Error al analizar: ${lastError?.message ?? "Ningún modelo disponible."}`);
    setLoading(false);
  };

  const handleSave = () => {
    if (!draft) return;
    const fund: Fund = {
      id: `custom-${slugify(draft.name)}-${Date.now().toString(36)}`,
      name: draft.name,
      entity: draft.entity,
      amount: draft.amount,
      amountNumber: draft.amountNumber,
      deadline: draft.deadline,
      deadlineISO: draft.deadlineISO || undefined,
      status: FundStatus.OPEN,
      urgency: draft.urgency,
      category: draft.category,
      description: draft.description,
      cofinancing: draft.cofinancing || "",
      requirements: draft.requirements,
      eligibilityGenderRequired: false,
      eligibilitySalesRestricted: false,
      SIIRequired: false,
      requiresSpA: false,
      miltonAplica: draft.eligibilityNotes || "Verificar elegibilidad manualmente",
      tips: [draft.basesResumen, draft.tips].filter(Boolean).join(" | ").slice(0, 800),
      url: draft.basesUrl || draft.url,
      referenceUrlText: draft.basesUrl ? "Ver bases oficiales" : "Más información",
      type: draft.type,
      chileCode: draft.chileCode || undefined,
      organizer: draft.organizer || undefined,
      address: draft.address || undefined,
    };
    onImportFund(fund);
    setSuccess(true);
    setDraft(null);
    setInputText("");
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div className="space-y-8">
      <SectionHeader copy={SECTION_COPY.importar} />

      {/* Step 1: Input */}
      <section className="border-2 border-ink bg-paper shadow-[4px_4px_0px_#1a1a1a] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="bg-ink text-paper font-mono font-black text-xs px-2 py-0.5 select-none">1</span>
          <h2 className="font-display font-black text-base uppercase tracking-wide text-ink">Pega el contenido a analizar</h2>
        </div>
        {/* URL fetch */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold uppercase text-ink/50 tracking-wider">
            Opción A — Pegar URL de página web
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              className="flex-1 border-2 border-ink bg-paper-dark font-mono text-xs text-ink px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ink/30 placeholder:text-ink/35"
              placeholder="https://www.corfo.cl/… o mercadopublico.cl/…"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              disabled={urlLoading || loading}
              onKeyDown={e => { if (e.key === "Enter") handleFetchUrl(urlInput); }}
            />
            <button
              onClick={() => handleFetchUrl(urlInput)}
              disabled={!urlInput.trim() || urlLoading || loading}
              className="flex items-center gap-1.5 bg-paper border-2 border-ink px-4 py-2 font-mono font-black text-xs uppercase tracking-wide hover:bg-paper-dark active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer select-none whitespace-nowrap shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
            >
              {urlLoading
                ? <><RefreshCcw className="h-3.5 w-3.5 animate-spin" /> {fetchStatus ? "IA Web…" : "Cargando…"}</>
                : <><Link className="h-3.5 w-3.5" /> Cargar URL</>
              }
            </button>
          </div>
          {urlLoading && fetchStatus && (
            <p className="text-[10px] font-mono text-accent-purple font-bold animate-pulse">{fetchStatus}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={usePerplexity}
              onClick={() => {
                const next = !usePerplexity;
                setUsePerplexity(next);
                try { localStorage.setItem("radar_import_perplexity", String(next)); } catch { /* noop */ }
              }}
              className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer border border-ink transition-colors ${usePerplexity ? "bg-accent-purple" : "bg-ink/20"}`}
            >
              <span className={`inline-block h-3 w-3 mt-[0.5px] bg-white border border-ink transition-transform ${usePerplexity ? "translate-x-[17px]" : "translate-x-[0.5px]"}`} />
            </button>
            <span className="text-[10px] font-mono text-ink/60">
              Usar <strong className={usePerplexity ? "text-accent-purple" : ""}>Perplexity</strong> directamente
              {usePerplexity
                ? " — acceso web real, omite proxies (usa créditos API)"
                : " — proxies CORS primero, Perplexity solo si fallan"}
            </span>
          </div>
          <p className="text-[10px] font-mono text-ink/35">
            Perplexity ON: más confiable para cualquier URL. OFF: proxies gratis primero. Instagram/Facebook requieren copiar texto manualmente.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono text-ink/35 uppercase tracking-widest">
          <div className="flex-1 h-px bg-ink/15" />
          <span>O</span>
          <div className="flex-1 h-px bg-ink/15" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold uppercase text-ink/50 tracking-wider">
            Opción B — Pegar texto copiado
          </label>
        </div>

        <textarea
          className="w-full h-44 border-2 border-ink bg-paper-dark font-mono text-xs text-ink p-3 resize-y focus:outline-none focus:ring-2 focus:ring-ink/40 placeholder:text-ink/35"
          placeholder={`Ejemplos de texto a pegar:\n\n• "CORFO abre convocatoria Capital Semilla hasta $20M CLP, cierre 30 junio 2026. Requisitos: startup tecnológica, equipo de 2+ personas..."\n\n• Texto completo de publicación en LinkedIn de Startup Chile\n\n• Descripción de licitación copiada de Mercado Público`}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          disabled={loading}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleAnalyze}
            disabled={!inputText.trim() || loading || !client}
            className="flex items-center gap-2 bg-ink text-paper px-5 py-2.5 font-mono font-black text-xs uppercase tracking-wide border-2 border-ink shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:bg-ink/85 active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer select-none"
          >
            {loading ? (
              <><RefreshCcw className="h-3.5 w-3.5 animate-spin" /> Analizando…</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" /> Analizar con IA</>
            )}
          </button>
          {inputText.trim() && (
            <span className="text-[10px] font-mono text-ink/40">{inputText.length} caracteres</span>
          )}
          {!client && (
            <span className="text-xs font-mono text-alert font-bold">
              ⚠ Configura VITE_OPENROUTER_API_KEY en .env.local para usar esta función.
            </span>
          )}
        </div>
      </section>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border-2 border-alert bg-alert/10 p-4 flex items-start gap-3"
          >
            <AlertCircle className="h-4 w-4 text-alert shrink-0 mt-0.5" />
            <p className="text-xs font-mono text-alert">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success toast */}
      <AnimatePresence>
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border-2 border-accent-green bg-accent-green/10 p-4 flex items-center gap-3"
          >
            <CheckCircle className="h-4 w-4 text-accent-green shrink-0" />
            <p className="text-xs font-mono text-accent-green font-bold">
              Convocatoria agregada al radar. Aparece en la sección correspondiente.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 2: Preview + Edit */}
      <AnimatePresence>
        {draft && (
          <motion.section
            key="draft"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-2 border-ink bg-paper shadow-[4px_4px_0px_#1a1a1a] p-6 space-y-5"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-ink text-paper font-mono font-black text-xs px-2 py-0.5 select-none">2</span>
              <h2 className="font-display font-black text-base uppercase tracking-wide text-ink">Revisar y confirmar</h2>
              {duplicate && (
                <span className="ml-auto flex items-center gap-1.5 bg-warning/20 border border-warning px-2.5 py-1 text-[10px] font-mono font-bold text-ink">
                  ⚠ Posible duplicado: {duplicate.name}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold border border-ink ${URGENCY_COLORS[draft.urgency]}`}>
                {draft.urgency}
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold border border-ink bg-paper-dark text-ink">
                {TYPE_LABELS[draft.type]}
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-mono text-ink/50 border border-ink/30 bg-paper">
                {draft.category}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono font-bold uppercase text-ink/50 mb-1">Nombre</label>
                <input
                  className="w-full border-2 border-ink bg-paper-dark font-mono text-sm text-ink px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink/30"
                  value={draft.name}
                  onChange={e => setDraft(d => d ? { ...d, name: e.target.value } : d)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-ink/50 mb-1">Entidad</label>
                <input
                  className="w-full border-2 border-ink bg-paper-dark font-mono text-sm text-ink px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink/30"
                  value={draft.entity}
                  onChange={e => setDraft(d => d ? { ...d, entity: e.target.value } : d)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-ink/50 mb-1">Tipo</label>
                <select
                  className="w-full border-2 border-ink bg-paper-dark font-mono text-sm text-ink px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink/30 cursor-pointer"
                  value={draft.type}
                  onChange={e => setDraft(d => d ? { ...d, type: e.target.value as FundType } : d)}
                >
                  <option value="financiamiento">💰 Subsidio / Financiamiento</option>
                  <option value="licitacion">🏛️ Licitación</option>
                  <option value="hackaton">⚡ Hackaton</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-ink/50 mb-1">Monto</label>
                <input
                  className="w-full border-2 border-ink bg-paper-dark font-mono text-sm text-ink px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink/30"
                  value={draft.amount}
                  onChange={e => setDraft(d => d ? { ...d, amount: e.target.value } : d)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-ink/50 mb-1">Fecha límite</label>
                <input
                  className="w-full border-2 border-ink bg-paper-dark font-mono text-sm text-ink px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink/30"
                  value={draft.deadline}
                  onChange={e => setDraft(d => d ? { ...d, deadline: e.target.value } : d)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-ink/50 mb-1">Urgencia</label>
                <select
                  className="w-full border-2 border-ink bg-paper-dark font-mono text-sm text-ink px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink/30 cursor-pointer"
                  value={draft.urgency}
                  onChange={e => setDraft(d => d ? { ...d, urgency: e.target.value as Fund["urgency"] } : d)}
                >
                  <option value="CRITICAL">CRITICAL — cierra en &lt;7 días</option>
                  <option value="HIGH">HIGH — cierra en &lt;30 días</option>
                  <option value="MEDIUM">MEDIUM — cierra en &lt;90 días</option>
                  <option value="LOW">LOW — plazo amplio</option>
                  <option value="CLOSED">CLOSED — ya cerró</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono font-bold uppercase text-ink/50 mb-1">Descripción</label>
                <textarea
                  className="w-full border-2 border-ink bg-paper-dark font-mono text-xs text-ink px-3 py-2 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ink/30"
                  value={draft.description}
                  onChange={e => setDraft(d => d ? { ...d, description: e.target.value } : d)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono font-bold uppercase text-ink/50 mb-1">URL página fuente</label>
                <input
                  className="w-full border-2 border-ink bg-paper-dark font-mono text-xs text-ink px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink/30"
                  value={draft.url}
                  onChange={e => setDraft(d => d ? { ...d, url: e.target.value } : d)}
                  placeholder="https://…"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono font-bold uppercase text-ink/50 mb-1">
                  🔗 URL directa a las bases / formulario de postulación
                </label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border-2 border-ink bg-paper-dark font-mono text-xs text-ink px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink/30"
                    value={draft.basesUrl}
                    onChange={e => setDraft(d => d ? { ...d, basesUrl: e.target.value } : d)}
                    placeholder="https://… (enlace directo al documento PDF o formulario)"
                  />
                  {draft.basesUrl && (
                    <a
                      href={draft.basesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 px-3 py-2 border-2 border-ink bg-accent-blue text-white font-mono text-[10px] font-bold hover:opacity-90 transition-opacity"
                    >
                      <Link className="h-3 w-3" /> Abrir
                    </a>
                  )}
                </div>
              </div>

              {draft.eligibilityNotes && (
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase text-ink/50 mb-1">Elegibilidad</label>
                  <p className="text-xs font-mono text-ink/80 bg-paper-dark border border-ink/30 px-3 py-2 leading-relaxed">{draft.eligibilityNotes}</p>
                </div>
              )}

              {draft.requirements.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase text-ink/50 mb-2">Requisitos ({draft.requirements.length})</label>
                  <div className="flex flex-wrap gap-1.5">
                    {draft.requirements.map((req, i) => (
                      <span key={i} className="bg-paper-dark border border-ink px-2 py-0.5 text-[10px] font-mono text-ink">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {draft.cofinancing && (
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-ink/50 mb-1">Cofinanciamiento</label>
                  <p className="text-xs font-mono text-ink/80 bg-paper-dark border border-ink/30 px-3 py-2">{draft.cofinancing}</p>
                </div>
              )}

              {draft.basesResumen && (
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase text-ink/50 mb-1">
                    📋 Resumen de las Bases
                  </label>
                  <textarea
                    className="w-full border-2 border-ink bg-paper-dark font-mono text-xs text-ink px-3 py-2 resize-y h-32 focus:outline-none focus:ring-2 focus:ring-ink/30 leading-relaxed"
                    value={draft.basesResumen}
                    onChange={e => setDraft(d => d ? { ...d, basesResumen: e.target.value } : d)}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-3 border-t border-ink/20">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-accent-green text-white px-5 py-2.5 font-mono font-black text-xs uppercase tracking-wide border-2 border-ink shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:opacity-90 active:translate-y-[1px] transition-all cursor-pointer select-none"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar al Radar
              </button>
              <button
                onClick={() => { setDraft(null); setError(null); }}
                className="flex items-center gap-2 bg-paper text-ink px-4 py-2.5 font-mono font-bold text-xs uppercase tracking-wide border-2 border-ink hover:bg-paper-dark active:translate-y-[1px] transition-all cursor-pointer select-none"
              >
                Cancelar
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Step 3: Imported list */}
      {customFunds.length > 0 && (
        <section className="border-2 border-ink bg-paper shadow-[4px_4px_0px_#1a1a1a] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-ink text-paper font-mono font-black text-xs px-2 py-0.5 select-none">✓</span>
            <h2 className="font-display font-black text-base uppercase tracking-wide text-ink">
              Convocatorias importadas ({customFunds.length})
            </h2>
          </div>
          <div className="space-y-2">
            {customFunds.map(fund => (
              <div
                key={fund.id}
                className="flex items-start justify-between gap-4 border border-ink/25 bg-paper-dark p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-[9px] font-mono font-bold border border-ink ${URGENCY_COLORS[fund.urgency]}`}>
                      {fund.urgency}
                    </span>
                    <span className="text-[9px] font-mono text-ink/50 border border-ink/25 px-1.5 py-0.5 bg-paper">
                      {TYPE_LABELS[fund.type ?? "financiamiento"]}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-ink/30 uppercase tracking-wider">IMPORTADO</span>
                  </div>
                  <p className="font-display font-bold text-sm text-ink leading-tight">{fund.name}</p>
                  <p className="text-[10px] font-mono text-ink/55 mt-0.5">
                    {fund.entity} · {fund.amount} · cierre: {fund.deadline}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteCustomFund(fund.id)}
                  className="shrink-0 p-2 border border-ink/25 hover:border-alert hover:bg-alert/10 text-ink/35 hover:text-alert transition-colors cursor-pointer"
                  title="Eliminar convocatoria importada"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {customFunds.length === 0 && !draft && !loading && (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-ink/20 text-ink/35">
          <Package className="h-10 w-10 mb-3 opacity-25" />
          <p className="font-mono text-xs uppercase tracking-wider">Aún no has importado convocatorias</p>
          <p className="font-mono text-[10px] mt-1 text-ink/25">Pega texto de Instagram, LinkedIn o páginas web arriba</p>
        </div>
      )}
    </div>
  );
}
