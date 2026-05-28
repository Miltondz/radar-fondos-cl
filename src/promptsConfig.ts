import { Fund, MiltonProfile } from "./types";
import { ALL_FUNDS } from "./data";
import { formatCLP } from "./utils";

export interface PromptPreset {
  id: string;
  label: string;
  template: string;
}

export interface PromptsConfig {
  systemPrompt: string;
  presets: PromptPreset[];
}

const STORAGE_KEY = "milton_radar_prompts_v1";

const VIEW_LABELS: Record<string, string> = {
  landing: "Resumen e Inicio",
  financiamientos: "Subsidios y Financiamientos",
  licitaciones: "Licitaciones y Compras Públicas",
  hackatones: "Hackatones y Desafíos",
  roadmap: "Plan de Acción",
  agenda: "Agenda y Timeline",
  ia: "Asesor IA (vista completa)",
  configuracion: "Configuración",
};

export const DEFAULT_SYSTEM_PROMPT = `# ROL
Eres "Radar Fondos CL", asesor senior especializado en financiamiento gubernamental chileno (CORFO, SERCOTEC, Startup Chile, Mercado Público, hackatones corporativos) para startups tecnológicas en etapa temprana.

# AUDIENCIA
Fundador técnico chileno, perfil legal/comercial parcial. Necesita decisiones accionables, no teoría.

# FUENTE ÚNICA DE VERDAD (SSOT)
Toda tu respuesta debe basarse EXCLUSIVAMENTE en el bloque DATOS_VALIDADOS a continuación. Este bloque es la única fuente válida. Tu conocimiento previo sobre fondos chilenos NO se usa salvo para contexto general no-fáctico (terminología, normativa pública conocida).

<DATOS_VALIDADOS fecha_corte="Mayo 2026" vista_activa="{{viewLabel}}">
  <perfil_usuario>
    socia_femenina: {{hasWoman}}
    SpA_constituida: {{hasSpA}}
    ventas_iniciadas: {{hasSales}}
    SII_iniciado: {{hasSiiInitiated}}
  </perfil_usuario>
  <portafolio_activo total="{{stackedCount}}">
    {{stackedSummary}}
  </portafolio_activo>
  <financiamientos total="{{financiamientosCount}}">
    {{financiamientosList}}
  </financiamientos>
  <licitaciones total="{{licitacionesCount}}">
    {{licitacionesList}}
  </licitaciones>
  <hackatones total="{{hackatonesCount}}">
    {{hackatonesList}}
  </hackatones>
</DATOS_VALIDADOS>

# REGLAS ANTI-ALUCINACIÓN (obligatorias, sin excepción)
1. CITA OBLIGATORIA: cada vez que menciones un fondo, monto, plazo, entidad o requisito, debe aparecer textualmente en DATOS_VALIDADOS. Si no aparece, no existe.
2. PROHIBIDO INVENTAR: no menciones programas, convocatorias, montos, fechas, links, entidades, leyes ni cifras que no estén en DATOS_VALIDADOS.
3. PROHIBIDO COMPLETAR DE MEMORIA: si DATOS_VALIDADOS dice "cierre: 2026-08-15" y tu memoria dice otra cosa, gana DATOS_VALIDADOS.
4. SIN ESTIMACIONES NO PEDIDAS: no inventes porcentajes, probabilidades, ROI ni promedios sin fuente en el contexto.
5. NO CONFUNDAS NOMBRES: usa el nombre exacto como aparece en DATOS_VALIDADOS (sin abreviaturas inventadas).
6. SIN URLS NI CONTACTOS: no entregues enlaces, mails, RUTs ni teléfonos.

# PROTOCOLO DE FALTA DE DATOS
Si el usuario pregunta por un fondo, monto, plazo o requisito que NO existe en DATOS_VALIDADOS:
- Responde literalmente: "No tengo ese dato en mi contexto validado."
- Sugiere qué dato específico debería agregarse al sistema o cómo verificarlo en fuente oficial (CORFO, Mercado Público, etc.) sin inventar la respuesta.

# FORMATO DE RESPUESTA
- Idioma: español de Chile, registro profesional, sin jerga marketinera.
- Estructura: usa encabezados markdown cortos (\`##\`, \`###\`) cuando la respuesta tenga ≥3 ideas.
- Listas: usa bullets con verbo en imperativo para acciones.
- Citas inline: cuando uses un dato del contexto, anótalo entre paréntesis con su fondo de origen. Ejemplo: "monto CLP 25M (CORFO Semilla Inicia)".
- Concisión: máximo ~400 palabras salvo que el usuario pida desarrollo extenso.
- Cierre: termina con bloque "### Próximos pasos" (3–5 acciones concretas).

# AUTOCHEQUEO ANTES DE ENVIAR (silencioso, no lo muestres)
Antes de entregar la respuesta, verifica internamente:
[ ] ¿Cada fondo/monto/fecha que mencioné aparece en DATOS_VALIDADOS?
[ ] ¿Estoy citando la fuente cuando uso un dato?
[ ] ¿Evité agregar contactos, URLs y cifras inventadas?
[ ] ¿La respuesta es accionable y no genérica?
Si alguna [ ] falla, reescribe antes de enviar.`;

export const DEFAULT_PRESETS: PromptPreset[] = [
  {
    id: "priorizar",
    label: "🎯 Priorizar Fondos",
    template:
      `# Tarea: Priorización Top-3 Fondos del mes

## Mi perfil
- socia_femenina: {{hasWoman}}
- SpA: {{hasSpA}}
- ventas_iniciadas: {{hasSales}}
- SII_iniciado: {{hasSiiInitiated}}

## Portafolio actual
{{stackedDetail}}

## Pide
Considerando SOLO los fondos listados en DATOS_VALIDADOS del sistema, recomienda los 3 fondos a priorizar este mes.

## Criterios obligatorios de priorización (aplícalos en orden)
1. Cierre de postulación más próximo (mayor urgencia primero).
2. Elegibilidad real según mi perfil (descarta los que requieren SpA/SII/mujer si no los tengo).
3. Mayor relación monto/esfuerzo razonable.

## Formato de salida (estricto)
Para cada uno de los 3 fondos:
### {n}. <nombre exacto del fondo>
- **Entidad:** <copia textual desde DATOS_VALIDADOS>
- **Monto:** <copia textual>
- **Cierre:** <copia textual>
- **Encaja con mi perfil:** Sí/No/Parcial — <1 línea explicando con cuál requisito>
- **Por qué ahora:** <1 línea, justificación basada en datos del contexto>
- **Riesgo de descalificación:** <requisito faltante o "ninguno conocido">

### Veredicto final
1 párrafo (≤80 palabras) sobre cuál atacar primero y por qué.

## Restricciones
- NO inventes fondos. Si hay menos de 3 elegibles, dilo y entrega los que existan.
- NO modifiques montos, fechas ni nombres de los fondos.`,
  },
  {
    id: "elegibilidad",
    label: "📋 Diagnóstico Elegibilidad",
    template:
      `# Tarea: Diagnóstico de Elegibilidad de mi Portafolio

## Mi perfil
socia_femenina={{hasWoman}}, SpA={{hasSpA}}, ventas={{hasSales}}, SII={{hasSiiInitiated}}

## Portafolio a auditar
{{stackedDetail}}

## Pide
Para CADA fondo de mi portafolio, valida si soy elegible cruzando mi perfil contra los flags del fondo.

## Reglas de validación
- requiere_mujer=true  ∧  hasWoman=false  → NO ELEGIBLE
- requiere_SpA=true    ∧  hasSpA=false    → NO ELEGIBLE
- requiere_SII=true    ∧  hasSiiInitiated=false → NO ELEGIBLE
- sin_ventas=true      ∧  hasSales=true   → NO ELEGIBLE (fondo es para etapa pre-revenue)
- Si todo coincide → ELEGIBLE

## Formato de salida (estricto)
### <nombre del fondo>
- **Estado:** ✅ ELEGIBLE | ⚠️ ELEGIBLE CON CONDICIÓN | ❌ NO ELEGIBLE
- **Requisitos cumplidos:** <lista>
- **Requisitos faltantes:** <lista o "ninguno">
- **Acción inmediata:** <1 paso accionable: constituir SpA, iniciar actividades SII, etc.>
- **Tiempo estimado para subsanar:** <"hoy", "1 semana", "1 mes", o "imposible" si requiere socia que no tengo>

### Resumen ejecutivo (al final)
- Fondos ELEGIBLES hoy: <n>
- Fondos que se vuelven elegibles tras 1 acción: <n> — y cuál es esa acción
- Fondos descartables: <n>

## Restricciones
- Si el portafolio está vacío, indícalo y no inventes fondos.
- No hagas suposiciones sobre requisitos no listados en DATOS_VALIDADOS.`,
  },
  {
    id: "pitch",
    label: "📝 Pitch CORFO",
    template:
      `# Tarea: Pitch ejecutivo CORFO Semilla Inicia (350 palabras)

## Contexto del autor
Fundador de startup TI chilena. Perfil: socia={{hasWoman}}, SpA={{hasSpA}}, ventas={{hasSales}}, SII={{hasSiiInitiated}}.

## Pide
Redacta un pitch ejecutivo de 320–380 palabras para postular a "CORFO Semilla Inicia" (verifica que el fondo aparezca en DATOS_VALIDADOS; si NO aparece, dilo y no inventes).

## Estructura obligatoria (en este orden, con encabezados)
1. **Problema** (2–3 frases, cuantificado con dato genérico verificable o sin cifra inventada).
2. **Solución** (qué construye la startup, tecnología diferenciadora, sin buzzwords vacías).
3. **Mercado objetivo** (segmento, geografía Chile/LatAm). Sin TAM/SAM/SOM inventados.
4. **Modelo de negocio** (cómo cobra, ticket, recurrencia).
5. **Tracción / validación** (si ventas=false: indícalo y reemplaza por validaciones cualitativas).
6. **Equipo** (qué stack de skills cubre, no nombres inventados — usa "fundador técnico" genérico).
7. **Uso del subsidio** (desglose por categoría: desarrollo, comercial, operación — sin montos inventados).
8. **Impacto regional y escalabilidad** (encaje con misión CORFO de fomento productivo).

## Restricciones anti-alucinación
- NO inventes cifras de mercado, clientes, ARR, ni nombres de personas.
- NO uses logos, premios o respaldos que no estén en DATOS_VALIDADOS.
- Si el fondo CORFO Semilla Inicia no existe en DATOS_VALIDADOS, RESPONDE: "El fondo no está en mi contexto validado" y detén la tarea.
- Tono: profesional, sin marketing inflado, sin emoji.`,
  },
  {
    id: "stacking",
    label: "💡 Estrategia Stacking",
    template:
      `# Tarea: Análisis de Compatibilidad de Stacking de Subsidios

## Portafolio en evaluación
{{stackedWithEntity}}

## Perfil
socia={{hasWoman}}, SpA={{hasSpA}}

## Pide
Evalúa si los fondos en mi portafolio pueden coexistir (stacking) bajo la normativa chilena de concurrencia de subsidios.

## Marco de análisis (aplica todo)
1. **Concurrencia entidad**: dos fondos de la MISMA entidad (ej: dos CORFO) suelen tener cláusula de exclusividad. Marca conflicto.
2. **Concurrencia objeto**: dos fondos que financian el mismo gasto (ej: desarrollo de producto) están en conflicto.
3. **Cláusulas de exclusividad**: si DATOS_VALIDADOS menciona exclusividad de un fondo, respétala.
4. **Compatibilidad temporal**: si los plazos de ejecución se traslapan y el fondo lo prohíbe, marca conflicto.

## Formato de salida (estricto)
### Matriz de compatibilidad
Lista por pares: "Fondo A × Fondo B → ✅ Compatible | ⚠️ Compatible condicional | ❌ Incompatible — <razón>"

### Recomendación de combinación óptima
- Combo recomendado: <subset de fondos>
- Financiamiento total combinado: <suma de montos copiados textuales — sin inventar>
- Por qué este combo: <2–3 líneas>

### Riesgos regulatorios identificados
- <bullet por cada riesgo, con referencia al fondo>

## Restricciones
- Si NO hay datos suficientes en DATOS_VALIDADOS sobre exclusividad de un fondo específico, declara "exclusividad no informada — verificar en bases del concurso".
- NO cites artículos de ley si no aparecen en DATOS_VALIDADOS.
- NO inventes el reglamento de CORFO ni de SERCOTEC.`,
  },
];

export const DEFAULT_PROMPTS_CONFIG: PromptsConfig = {
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  presets: DEFAULT_PRESETS,
};

export const PROMPT_VARIABLES: { name: string; desc: string }[] = [
  { name: "{{viewLabel}}", desc: "Nombre legible de la vista activa" },
  { name: "{{hasWoman}}", desc: "true/false — perfil con socia fundadora" },
  { name: "{{hasSpA}}", desc: "true/false — SpA constituida" },
  { name: "{{hasSales}}", desc: "true/false — ventas iniciadas" },
  { name: "{{hasSiiInitiated}}", desc: "true/false — SII iniciado" },
  { name: "{{stackedCount}}", desc: "Número de fondos en portafolio" },
  { name: "{{stackedNames}}", desc: "Nombres de fondos en portafolio (coma-separados)" },
  { name: "{{stackedSummary}}", desc: "Nombres + monto formateado" },
  { name: "{{stackedDetail}}", desc: "Detalle con flags de elegibilidad de cada fondo" },
  { name: "{{stackedWithEntity}}", desc: "Nombres + entidad organizadora" },
  { name: "{{financiamientosCount}}", desc: "Total financiamientos activos" },
  { name: "{{licitacionesCount}}", desc: "Total licitaciones" },
  { name: "{{hackatonesCount}}", desc: "Total hackatones" },
  { name: "{{financiamientosList}}", desc: "Lista completa financiamientos (texto)" },
  { name: "{{licitacionesList}}", desc: "Lista completa licitaciones (texto)" },
  { name: "{{hackatonesList}}", desc: "Lista completa hackatones (texto)" },
];

export function loadPromptsConfig(): PromptsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROMPTS_CONFIG;
    const parsed = JSON.parse(raw) as Partial<PromptsConfig>;
    const presetsById = new Map((parsed.presets ?? []).map(p => [p.id, p]));
    const merged: PromptsConfig = {
      systemPrompt: parsed.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
      presets: DEFAULT_PRESETS.map(def => {
        const override = presetsById.get(def.id);
        return override ? { ...def, label: override.label ?? def.label, template: override.template ?? def.template } : def;
      }),
    };
    return merged;
  } catch (e) {
    console.warn("Could not load prompts config", e);
    return DEFAULT_PROMPTS_CONFIG;
  }
}

export function savePromptsConfig(config: PromptsConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn("Could not save prompts config", e);
  }
}

export function resetPromptsConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("Could not reset prompts config", e);
  }
}

export type PromptVars = Record<string, string>;

export function buildPromptVars(
  profile: MiltonProfile,
  stackedFunds: Fund[],
  currentView?: string
): PromptVars {
  const financiamientos = ALL_FUNDS.filter(f => f.type === "financiamiento" && f.urgency !== "CLOSED");
  const licitaciones = ALL_FUNDS.filter(f => f.type === "licitacion");
  const hackatones = ALL_FUNDS.filter(f => f.type === "hackaton");

  return {
    viewLabel: currentView ? VIEW_LABELS[currentView] || currentView : "Desconocida",
    hasWoman: String(profile.hasWoman),
    hasSpA: String(profile.hasSpA),
    hasSales: String(profile.hasSales),
    hasSiiInitiated: String(profile.hasSiiInitiated),
    stackedCount: String(stackedFunds.length),
    stackedNames: stackedFunds.map(f => f.name).join(", ") || "ninguno aún",
    stackedSummary:
      stackedFunds.map(f => `${f.name} (${formatCLP(f.amountNumber)})`).join(" + ") || "vacío",
    stackedDetail:
      stackedFunds
        .map(
          f =>
            `${f.name} [requiere_mujer:${f.eligibilityGenderRequired}, requiere_SpA:${f.requiresSpA}, requiere_SII:${f.SIIRequired}, sin_ventas:${f.eligibilitySalesRestricted}]`
        )
        .join("; ") || "vacío",
    stackedWithEntity:
      stackedFunds.map(f => `${f.name} (entidad: ${f.entity || f.organizer})`).join(", ") ||
      "portafolio vacío",
    financiamientosCount: String(financiamientos.length),
    licitacionesCount: String(licitaciones.length),
    hackatonesCount: String(hackatones.length),
    financiamientosList: financiamientos
      .map(
        f =>
          `${f.name}|${f.entity}|${formatCLP(f.amountNumber)}|cierre:${f.deadline}|reqMujer:${f.eligibilityGenderRequired}|reqSpA:${f.requiresSpA}|reqSII:${f.SIIRequired}`
      )
      .join(" // "),
    licitacionesList: licitaciones
      .map(f => `${f.name}|${f.chileCode || ""}|${formatCLP(f.amountNumber)}|${f.organizer}`)
      .join(" // "),
    hackatonesList: hackatones
      .map(f => `${f.name}|${f.organizer}|${formatCLP(f.amountNumber)}|cierre:${f.deadline}`)
      .join(" // "),
  };
}

export function renderTemplate(template: string, vars: PromptVars): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : `{{${key}}}`;
  });
}
