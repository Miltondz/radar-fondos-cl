# Radar Fondos CL

Plataforma de inteligencia estratégica para startups tecnológicas chilenas. Centraliza y prioriza oportunidades de financiamiento gubernamental (CORFO, SERCOTEC, Startup Chile), licitaciones de Mercado Público y hackatones corporativos.

🌐 **App en producción:** [radarfondos.netlify.app](https://radarfondos.netlify.app)

## Stack

- **React 19** · **Vite 6** · **TypeScript**
- **Tailwind CSS v4** (sin config file, via `@tailwindcss/vite`)
- **Motion** (Framer Motion) · **Lucide Icons**
- **OpenRouter API** (DeepSeek Chat v3, Llama 4 Maverick, Qwen3 235B, Gemma 3 27B, Gemini 2.5 Flash — gratuitos con fallback automático)

## Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| 📋 Resumen | Dashboard con portafolio activo, comparación, monto total y historial reciente |
| 💰 Subsidios | Filtrado por perfil (socia, SpA, SII, ventas), vista tabla / tarjetas, filtro "Solo elegibles" |
| 🏛️ Licitaciones | Oportunidades de Mercado Público / ChileCompra con filtro CERRADO |
| ⚡ Hackatones | Retos con premios y validación de startup con filtro CERRADO |
| 📥 Importar | Individual o **modo masivo** (N convocatorias separadas por `---`) |
| 📅 Agenda | Timeline de cierres con integración Google Calendar |
| 🎯 Plan de Acción | Roadmap con checklist de pasos y requisitos |
| 🤖 Asesor IA | Chat estratégico con contexto completo del sistema |
| ⚙️ Configuración | Editor de prompts del Asesor IA con preview en tiempo real |

## Mejoras UX implementadas

- **PWA (Progressive Web App)** — instalable en móvil/escritorio, caché offline con Workbox, `clientsClaim: false` para evitar pantalla blanca al activar el SW
- **Historial reciente** — últimas 6 convocatorias expandidas, visible en tab Inicio con navegación directa
- **Exportar PDF** — botón "Exportar Portafolio PDF" en Inicio (`window.print()`) con CSS de impresión dedicado
- **Notas por fondo** — textarea por convocatoria, persiste en localStorage, disponible en Subsidios / Licitaciones / Hackatones
- **Comparador** — selección hasta 3 fondos, barra flotante inferior, modal comparación con campos clave lado a lado
- **Filtro "Solo elegibles"** — toggle en Subsidios que oculta fondos con score de elegibilidad < 5 según perfil activo
- **Countdown de días** — `daysUntil()` en utils, muestra días restantes al cierre en cards expandidas
- **Deep link `?fund=<id>`** — URL que abre directamente un fondo expandido en su tab correspondiente
- **Búsqueda global** — barra de búsqueda transversal con navegación directa a la sección (Ctrl+K)
- **Tracking de postulación** — botón "Postulé" / "Participé" por fondo, persiste en localStorage con fecha
- **Vista tabla** — toggle tarjetas ↔ tabla en Subsidios con columnas ordenables
- **Importación masiva** — modo "Masivo" en tab Importar: pega N convocatorias separadas por `---`, la IA extrae cada una en paralelo con opción de guardar/descartar individual o "Guardar todas"
- **Notificaciones del browser** — alertas automáticas al cargar la app para fondos CRITICAL/HIGH del stack con cierre próximo
- **Archivar / Borrar** — registros importados archivables (ocultos de vistas, recuperables) o eliminables desde ViewImport y cards expandidos
- **Auto-detección CERRADO** — fondos importados con `deadlineISO` pasada se marcan automáticamente como `urgency: "CLOSED"`
- **Exportar JSON** — descarga de todas las convocatorias importadas como `.json`
- **Mobile-first** — tabs compactos en móvil (emoji + número), header adaptativo, padding y tipografía ajustados por breakpoint

## Asesor IA — Prompts configurables

El Asesor IA usa prompts anti-alucinación con **Single Source of Truth**: solo puede citar fondos, montos, plazos y entidades que existan en el contexto validado del sistema.

Presets incluidos:
- 🎯 Priorizar Fondos (Top-3 por urgencia + elegibilidad real)
- 📋 Diagnóstico de Elegibilidad (validación booleana por flag)
- 📝 Pitch CORFO (estructura oficial 8 secciones)
- 💡 Estrategia Stacking (análisis de concurrencia de subsidios)

Los prompts son editables en tab **⚙️ Configuración** → guardado en `localStorage` → restaurables a originales con un clic.

## Importador de Convocatorias

El módulo **📥 Importar** permite añadir convocatorias externas al radar:

- **URL directa** — carga vía cascade de proxies CORS (corsproxy.io → codetabs.com → allorigins.win) con fallback a **Perplexity Sonar** (acceso web real, opcional)
- **Texto pegado** — desde LinkedIn, Instagram, correo o cualquier fuente
- **Importación masiva** — modo "Masivo": pega varias convocatorias separadas por `---`, la IA extrae cada una secuencialmente
- **Extensión Chrome** — extrae DOM de la página activa sin CORS, auto-analiza en sitios conocidos (CORFO, SERCOTEC, Mercado Público), caché por URL 7 días
- **Lectura de PDFs** — OpenRouter file-parser plugin con motor `cloudflare-ai` (gratuito), extrae REQUISITOS / ENTREGABLES / EVALUACIÓN del documento oficial
- **Extracción IA** — cascade de modelos gratuitos (DeepSeek → Llama → Qwen → Gemma), con fallback a Gemini 2.5 Flash

### Extensión Chrome

Archivos en `chrome-extension/`. Distribución lista en `radar-fondos-extension.zip`.

**Instalar:**
1. `chrome://extensions/` → activar **Modo desarrollador**
2. → **Cargar descomprimida** → seleccionar carpeta `chrome-extension/`

O descomprimir `radar-fondos-extension.zip` y cargar la carpeta extraída.

**Funcionalidades:**
- Requiere OpenRouter API Key (guardada en `chrome.storage.sync`, persiste entre sesiones)
- Auto-analiza en sitios conocidos (corfo.cl, sercotec.cl, mercadopublico.cl, startupchile.org…) al abrir el popup
- Caché por URL con TTL de 7 días (hasta 50 entradas en `chrome.storage.local`)
- Extractores DOM específicos por dominio para mejor extracción de texto
- Detecta y lista PDFs/documentos en la página activa — botón "📄 Leer" analiza con IA
- Fix de encoding base64: `encodeURIComponent()` previene corrupción de `+` en URLSearchParams
- Panel "ℹ Acerca de" con enlace directo a [radarfondos.netlify.app](https://radarfondos.netlify.app)

## Variables de plantilla del Asesor IA

`{{hasWoman}}` `{{hasSpA}}` `{{hasSales}}` `{{hasSiiInitiated}}` `{{stackedNames}}` `{{stackedDetail}}` `{{stackedWithEntity}}` `{{financiamientosList}}` `{{licitacionesList}}` `{{hackatonesList}}` y más.

## Correr en local

**Requisitos:** Node.js 18+

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local:
#   VITE_OPENROUTER_API_KEY=sk-or-...   ← obtener en openrouter.ai/keys
#   VITE_GOOGLE_CLIENT_ID=...            ← opcional, para Google Calendar

# 3. Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000
```

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `VITE_OPENROUTER_API_KEY` | Sí (para IA) | Clave OpenRouter — modelos gratuitos disponibles |
| `VITE_GOOGLE_CLIENT_ID` | No | Habilita integración directa con Google Calendar |

## Comandos

```bash
npm run dev      # Servidor dev → localhost:3000
npm run build    # Build producción → dist/
npm run preview  # Preview del build
npm run lint     # TypeScript type check (tsc --noEmit)
npm run clean    # Elimina dist/ y server.js
```

## Agregar / actualizar datos

Los fondos están divididos en tres archivos JSON en `src/data/`:

| Archivo | Tipo |
|---------|------|
| `src/data/financiamientos.json` | Subsidios CORFO / SERCOTEC / Startup Chile |
| `src/data/licitaciones.json` | Mercado Público / ChileCompra |
| `src/data/hackatones.json` | Hackatones corporativos y concursos |

Editar el JSON correspondiente y commitear. `src/data.ts` los importa y exporta como `ALL_FUNDS`. El esquema de campos está en `src/data/SCHEMA.md`.

Roadmap y requisitos de documentos siguen en `src/data.ts`.

## Arquitectura

```
src/
├── data.ts              # Todos los datos estáticos (SSOT de contenido)
├── types.ts             # Tipos TypeScript / interfaces / enums
├── utils.ts             # formatCLP(), getGoogleCalendarUrl()
├── promptsConfig.ts     # Prompts del Asesor IA + motor de plantillas
├── App.tsx              # Root: estado global, routing de tabs
├── services/
│   └── googleCalendar.ts
└── components/
    ├── GeminiPanel.tsx        # Panel principal del Asesor IA
    ├── FloatingAI.tsx         # Botón flotante + panel compacto IA
    ├── SettingsPanel.tsx      # Editor de prompts con preview
    ├── ViewImport.tsx         # Importador: individual + modo masivo
    ├── ViewLanding.tsx        # Dashboard / portafolio
    ├── ViewFinanciamientos.tsx
    ├── ViewLicitaciones.tsx
    ├── ViewHackatones.tsx
    ├── ViewAgenda.tsx
    ├── PlanDeAccion.tsx
    └── ...

chrome-extension/
├── manifest.json        # Manifest V3
├── popup.html
├── popup.css
└── popup.js             # Extracción DOM, caché, auto-analizar, envío a la app

radar-fondos-extension.zip  # Extensión empaquetada lista para instalar
```

## Estado global (localStorage)

| Key | Contenido |
|-----|-----------|
| `milton_radar_theme` | `"light"` o `"dark"` |
| `milton_radar_profile` | `MiltonProfile` JSON |
| `milton_radar_stacked` | Array de IDs de fondos en portafolio |
| `milton_radar_roadmap_ticks` | Array de IDs de pasos completados |
| `milton_radar_prompts_v1` | Prompts personalizados del Asesor IA |
| `milton_radar_custom_funds` | Convocatorias importadas por el usuario |
| `milton_radar_archived_ids` | IDs de fondos archivados (ocultos de vistas) |
| `milton_radar_applied` | Tracking de postulaciones `{id, appliedAt, notes}[]` |
| `milton_radar_notes` | Notas personales por fondo `{[id]: string}` |
| `milton_radar_starred` | IDs de fondos destacados (estrella) |
| `milton_radar_recent` | Últimos 6 IDs de fondos expandidos (historial) |
| `radar_import_perplexity` | Preferencia de modo Perplexity-first en importador |
