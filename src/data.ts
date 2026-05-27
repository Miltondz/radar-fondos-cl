import { Fund, RoadmapStep, DocRequirement } from "./types";
import financiamientosRaw from "./data/financiamientos.json";
import licitacionesRaw from "./data/licitaciones.json";
import hackatonesRaw from "./data/hackatones.json";

/**
 * ALL_FUNDS is assembled from three JSON files in src/data/.
 * To update or add entries: edit the corresponding JSON file and commit.
 * Schema reference: src/data/SCHEMA.md
 */
export const ALL_FUNDS: Fund[] = [
  ...(financiamientosRaw as unknown as Fund[]),
  ...(licitacionesRaw as unknown as Fund[]),
  ...(hackatonesRaw as unknown as Fund[]),
];

export const ROADMAP_STEPS: RoadmapStep[] = [
  {
    id: "step-1",
    timeframe: "ESTA_SEMANA",
    dateText: "HOY - 27 de Mayo 2026",
    title: "Postulación Express Capital Abeja",
    desc: "Si hay mujer empresaria/socia en tu equipo, presentarse HOY mismo en Sercotec.cl para realizar la postulación en línea. Cierra de forma inminente.",
    isUrgent: true,
    color: "from-red-500/30 to-red-600/10 border-red-500/50"
  },
  {
    id: "step-2",
    timeframe: "ESTA_SEMANA",
    dateText: "27-28 de Mayo 2026",
    title: "Redacción del Pitch y Formulario",
    desc: "Ingresar a Corfo.cl y activar el borrador de postulación del 'Semilla Inicia Región Metropolitana'. Detallar el problema de mercado, la solución TI, y el componente de alto potencial.",
    isUrgent: true,
    color: "from-orange-500/30 to-orange-600/10 border-orange-500/50"
  },
  {
    id: "step-3",
    timeframe: "ESTA_SEMANA",
    dateText: "29 de Mayo 2026 (17:00 Hrs)",
    title: "Envío CORFO Semilla Inicia RM",
    desc: "Revisión definitiva y firma digital del borrador. Enviar obligatoriamente antes de la hora límite para evitar saturación de servidores gubernamentales.",
    isUrgent: true,
    color: "from-red-500/40 to-red-500/10 border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
  },
  {
    id: "step-4",
    timeframe: "JUNIO_2026",
    dateText: "1 al 9 de Junio 2026",
    title: "Enviar Perfil Crea y Valida (I+D)",
    desc: "Redacción del formulario sintético de perfil para proyecto tecnológico aplicado con componente innovador de software.",
    isUrgent: false,
    color: "from-amber-500/20 to-amber-600/5 border-amber-500/30"
  },
  {
    id: "step-5",
    timeframe: "JUNIO_2026",
    dateText: "10 de Junio 2026",
    title: "Constitución Express de SpA",
    desc: "Formalizar la startup mediante el portal estatal Tu Empresa En Un Día (registros.cl) de forma 100% o costo marginal, asignando capital inicial desde $1 CLP.",
    isUrgent: false,
    color: "from-blue-500/20 to-blue-600/5 border-blue-500/30"
  },
  {
    id: "step-6",
    timeframe: "JUNIO_2026",
    dateText: "15 de Junio 2026",
    title: "Padrón del Estado & Proveedores",
    desc: "Asociar la SpA en ChileProveedores y activar visibilidad en Mercado Público para disputar licitaciones del rubro de consultoría digital o desarrollo de software.",
    isUrgent: false,
    color: "from-blue-500/20 to-blue-600/5 border-blue-500/30"
  },
  {
    id: "step-7",
    timeframe: "JULIO_AGOSTO_2026",
    dateText: "1 de Julio 2026",
    title: "Postulación Súmate a Innovar Sostenible",
    desc: "Si el modelo de negocio cuenta con un ángulo de monitoreo energético u optimización ambiental de software, postular al fondo de fomento ecológico de CORFO.",
    isUrgent: false,
    color: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30"
  },
  {
    id: "step-8",
    timeframe: "JULIO_AGOSTO_2026",
    dateText: "Julio 2026",
    title: "Primera Licitación Compra Ágil",
    desc: "Monitorear en Mercado Público compras ágiles menores a 100 UTM para adjudicar los primeros contratos estatales como consultor SpA de informática.",
    isUrgent: false,
    color: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30"
  },
  {
    id: "step-9",
    timeframe: "JULIO_AGOSTO_2026",
    dateText: "1 Jul - 5 Ago 2026",
    title: "AcademIA HackLab 2026",
    desc: "Participar de la convocatoria de Ciudad Emergente y Google para acelerar el uso de Inteligencia Artificial aplicada en sistemas urbanos y ecológicos.",
    isUrgent: false,
    color: "from-indigo-500/20 to-indigo-600/5 border-indigo-500/30"
  },
  {
    id: "step-10",
    timeframe: "NOVIEMBRE_2026",
    dateText: "Noviembre 2026",
    title: "Postulación Startup Chile BIG 12",
    desc: "Postular a la segunda gran ronda internacional en categorías Build ($15M CLP) para ideas o Ignite ($30M CLP) con el producto SaaS en validación inicial.",
    isUrgent: false,
    color: "from-violet-500/30 to-violet-600/5 border-violet-500/45"
  }
];

export const DOCUMENT_REQUIREMENTS: DocRequirement[] = [
  {
    id: "doc-rut",
    title: "Cédula de Identidad Vigente (RUT)",
    desc: "Cédula chilena del titular del proyecto. Clave Única activa de manera obligatoria.",
    isSpecialForkForSpA: false
  },
  {
    id: "doc-sii",
    title: "Iniciación de Actividades en el SII",
    desc: "Si postulas como personal natural, se tramita de forma inmediata y digital en 1 día hábil vía Sii.cl.",
    isSpecialForkForSpA: false
  },
  {
    id: "doc-pitch",
    title: "Descripción del Proyecto TI (Pitch 2 Pág.)",
    desc: "Formulación del Pain/Problem, la solución tecnológica, el diferencial comercial de SaaS/IA, y tamaño de mercado.",
    isSpecialForkForSpA: false
  },
  {
    id: "doc-equipo",
    title: "Resumen de Currículum e Integrantes",
    desc: "Datos, RUTs, porcentaje de participación futura, y antecedentes de experiencia TI del equipo de 2-3 personas.",
    isSpecialForkForSpA: false
  },
  {
    id: "doc-budget",
    title: "Presupuesto Simplificado de 6 Meses",
    desc: "Planificación de fondos para el costeo de hosting, desarrollo, licencias de IA, activos y publicidad.",
    isSpecialForkForSpA: false
  },
  {
    id: "doc-woman",
    title: "Cédula de la Socia Fundadora (Si aplica)",
    desc: "RUT y certificado de nacimiento/vigencia de la mujer que lidera para validar acceso a los fondos con enfoque de género.",
    isSpecialForkForSpA: false
  },
  {
    id: "doc-spa-const",
    title: "Constitución en portalregistros.cl",
    desc: "Firma digital y registro del acta de la SpA. Idealmente capital inicial desde $1 CLP para formalización rápida.",
    isSpecialForkForSpA: true
  },
  {
    id: "doc-chileprov",
    title: "Inscripción en ChileProveedores",
    desc: "Imprescindible para licitaciones públicas y compras ágiles nacionales en Mercado Público.",
    isSpecialForkForSpA: true
  },
  {
    id: "doc-cert-vigency",
    title: "Certificado de Vigencia de la Sociedad",
    desc: "Documento emitido por el Conservador o el Registro de Empresas y Sociedades que acredita legalidad actual.",
    isSpecialForkForSpA: true
  }
];

export const STRATEGIC_LINKS = [
  {
    id: "l1",
    title: "CORFO",
    desc: "Portal central de fomento productivo de Chile. Aquí se gestionan los fondos Semilla Inicia y Crea y Valida.",
    url: "https://www.corfo.cl",
    action: "Semilla Inicia RM 2026"
  },
  {
    id: "l2",
    title: "SERCOTEC",
    desc: "Servicio de Cooperación Técnica. Gestiona el Capital Abeja (cierra hoy 27-05) y Capital Semilla tradicional.",
    url: "https://www.sercotec.cl",
    action: "Capital Abeja Postular HOY"
  },
  {
    id: "l3",
    title: "Startup Chile",
    desc: "La aceleradora pública número 1 de Latinoamérica. Revisa bases para programas Build ($15M) e Ignite ($30M).",
    url: "https://www.startupchile.org",
    action: "Boletín Alertas Noviembre"
  },
  {
    id: "l4",
    title: "Tu Empresa En Un Día",
    desc: "Constituye tu Sociedad por Acciones (SpA) sin intermediarios legales costosos, de forma express.",
    url: "https://www.registrodeempresasysociedades.cl",
    action: "Crear SpA Express"
  },
  {
    id: "l5",
    title: "Mercado Público",
    desc: "Mercado estatal de transacciones de Chile. Acceso a miles de licitaciones públicas y compras ágiles.",
    url: "https://www.mercadopublico.cl",
    action: "Buscar Licitaciones TI"
  }
];
