export interface SectionCopy {
  title: string;
  subtitle: string;
  description: string;
  howToUse: string;
  helpItems?: string[];
}

export const SECTION_COPY: Record<string, SectionCopy> = {
  landing: {
    title: "Radar Fondos CL",
    subtitle: "Inteligencia de financiamiento para startups tecnológicas chilenas",
    description:
      "Esta plataforma centraliza las oportunidades de financiamiento gubernamental abiertas hoy: subsidios CORFO/SERCOTEC, licitaciones de Mercado Público y hackatones con premios. Todo filtrado según el perfil legal y comercial de tu empresa.",
    howToUse:
      "Configura tu empresa con el botón 'Mi Empresa' arriba. El sistema calcula automáticamente qué fondos aplican para ti. Agrega los más relevantes a tu Portafolio y sigue el Plan de Acción.",
    helpItems: [
      "Configura tu perfil para ver solo los fondos donde eres elegible",
      "Agrega fondos a tu stack con el botón '★ Agregar'",
      "El Asesor IA puede explicarte cualquier fondo en detalle",
      "Usa la Agenda para ver todos los plazos en un calendario",
    ],
  },
  financiamientos: {
    title: "Subsidios y Financiamientos",
    subtitle: "Fondos no reembolsables CORFO, SERCOTEC, Startup Chile y ANID",
    description:
      "Convocatorias abiertas de subsidios directos para startups tecnológicas. El dinero no se devuelve — la contrapartida es demostrar ejecución del proyecto. Los montos van desde $1M CLP (hackatones) hasta $200M CLP (programas CORFO).",
    howToUse:
      "Filtra por perfil (los candados muestran requisitos faltantes). Ordena por urgencia. Haz clic en una tarjeta para ver requisitos completos, plazos y cómo postular.",
    helpItems: [
      "Verde = elegible con tu perfil actual",
      "Rojo/Naranja = cierre inminente, actuar hoy",
      "Candado = requiere SpA, SII o socia que aún no tienes",
    ],
  },
  licitaciones: {
    title: "Licitaciones y Compras Públicas",
    subtitle: "Contratos del Estado chileno vía Mercado Público / ChileCompra",
    description:
      "Órdenes de compra y licitaciones formales del Estado donde puedes ofrecer servicios TI. Requieres SpA inscrita en ChileProveedores. Las compras ágiles (< 100 UTM) son la entrada más rápida sin experiencia previa.",
    howToUse:
      "Revisa el código de licitación (ID único en Mercado Público). Filtra por monto. Para participar necesitas SpA activa en ChileProveedores — si no la tienes, el Plan de Acción te guía.",
    helpItems: [
      "Sin SpA = no puedes participar en licitaciones formales",
      "Compras ágiles < 100 UTM son más accesibles para startups nuevas",
      "Agrega al calendario las fechas de cierre que te interesan",
    ],
  },
  hackatones: {
    title: "Hackatones y Desafíos",
    subtitle: "Competencias con premios, mentoría y validación de startup",
    description:
      "Retos de innovación organizados por corporaciones, entidades públicas y aceleradoras. Valor principal: premios en efectivo, visibilidad y acceso a redes. La mayoría no requiere SpA ni SII — son ideales para etapa idea/pre-seed.",
    howToUse:
      "Verifica fechas de postulación (distintas de la fecha del evento). Marca como favoritos los que encajan con tu solución TI. Muchos permiten postular como persona natural.",
    helpItems: [
      "No requieren estructura legal en la mayoría de casos",
      "Los premios van de $500K CLP a $30M CLP",
      "Son también oportunidades de networking y validación de mercado",
    ],
  },
  roadmap: {
    title: "Plan de Acción",
    subtitle: "Hoja de ruta paso a paso para maximizar tu acceso a financiamiento",
    description:
      "Secuencia ordenada de acciones críticas para obtener financiamiento: desde constituir la SpA hasta postular a fondos avanzados. Los pasos están agrupados por fase y ordenados por fecha.",
    howToUse:
      "Marca cada paso como completado al ejecutarlo. El sistema calcula tu progreso. Empieza siempre por los pasos URGENTES (rojos). El primer paso pendiente es tu acción prioritaria hoy.",
    helpItems: [
      "Fase Setup Legal: constitución SpA, SII, ChileProveedores",
      "Fase Documentación: pitch, CV equipo, presupuesto",
      "Fase Postulación: plazos de envío activos",
      "Fase Seguimiento: monitoreo de resultados y next-round",
    ],
  },
  agenda: {
    title: "Agenda y Timeline",
    subtitle: "Vista calendario de todos los plazos, eventos y cierres",
    description:
      "Mapa temporal de convocatorias abiertas: cierres de postulación, inicio de eventos y fechas clave. Filtra por tipo (subsidios / licitaciones / hackatones) o muestra solo los que marcaste como interés.",
    howToUse:
      "Usa el toggle 'Solo de interés' para ver únicamente los que añadiste con ★. Haz clic en un evento para ver detalles. Exporta al Google Calendar con el botón de cada evento.",
    helpItems: [
      "Azul = financiamiento / subsidio",
      "Verde = licitación Mercado Público",
      "Morado = hackatón o desafío",
      "Rojo = cierre en menos de 7 días",
    ],
  },
  ia: {
    title: "Asesor IA Estratégico",
    subtitle: "Consultor de financiamiento gubernamental powered by GPT OSS 120B",
    description:
      "Asesor especializado en financiamiento para startups chilenas. Usa como contexto todos los fondos activos del sistema, tu perfil y tu portafolio actual. Solo responde con información que está en el sistema — no inventa fondos ni montos.",
    howToUse:
      "Usa los atajos rápidos para análisis predefinidos, o escribe preguntas específicas. El asesor conoce tu perfil y portafolio — puedes hacer preguntas contextuales sin tener que repetir tu situación.",
    helpItems: [
      "¿Qué fondos puedo postular esta semana con mi perfil actual?",
      "Explícame los requisitos de CORFO Semilla Inicia paso a paso",
      "¿Puedo combinar el fondo X con el fondo Y sin conflicto?",
      "¿Qué me falta para ser elegible para los fondos que requieren SpA?",
      "Redacta un pitch de 200 palabras para mi startup de IA",
      "¿Cuál es la diferencia entre Capital Semilla y Semilla Inicia?",
    ],
  },
  configuracion: {
    title: "Configuración de Prompts",
    subtitle: "Personaliza el comportamiento del Asesor IA",
    description:
      "Editor de los prompts que usa el Asesor IA internamente. Puedes ajustar el tono, agregar contexto específico de tu industria, modificar el formato de respuestas o cambiar los atajos rápidos del panel.",
    howToUse:
      "Edita el prompt de sistema para cambiar el comportamiento general. Edita los presets para modificar los atajos rápidos. Usa variables {{nombre}} para insertar datos dinámicos. Guarda y el cambio es inmediato.",
  },
  importar: {
    title: "Importar Convocatoria",
    subtitle: "Agrega fondos desde Instagram, LinkedIn o cualquier página web",
    description:
      "Pega texto copiado de una publicación en redes sociales o web sobre una convocatoria, licitación o hackaton. La IA extrae automáticamente los datos clave y los agrega al radar en la sección correspondiente.",
    howToUse:
      "Copia el texto completo de la publicación (incluye nombre del fondo, monto, fecha límite y requisitos si los hay). Pégalo en el área de texto y haz clic en Analizar. Revisa y edita los campos extraídos antes de confirmar.",
    helpItems: [
      "Funciona con publicaciones de Instagram, LinkedIn, Facebook y páginas web",
      "Cuanto más texto copies, mejor será la extracción",
      "Puedes editar todos los campos antes de agregar al radar",
      "Las convocatorias importadas aparecen en la sección correcta (Subsidios, Licitaciones o Hackatones)",
    ],
  },
};
