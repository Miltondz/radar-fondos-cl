# Radar Fondos CL

Plataforma de inteligencia estratégica para startups tecnológicas chilenas. Centraliza y prioriza oportunidades de financiamiento gubernamental (CORFO, SERCOTEC, Startup Chile), licitaciones de Mercado Público y hackatones corporativos.

## Stack

- **React 19** · **Vite 6** · **TypeScript**
- **Tailwind CSS v4** (sin config file, via `@tailwindcss/vite`)
- **Motion** (Framer Motion) · **Lucide Icons**
- **OpenRouter API** (DeepSeek Chat v3, Llama 4 Maverick, Qwen3 235B, Gemma 3 27B, Gemini 2.5 Flash — gratuitos con fallback automático)

## Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| 📋 Resumen | Dashboard con portafolio activo, comparación y monto total de stack |
| 💰 Subsidios | Filtrado en tiempo real por perfil (socia, SpA, SII, ventas) |
| 🏛️ Licitaciones | Oportunidades de Mercado Público / ChileCompra |
| ⚡ Hackatones | Retos con premios y validación de startup |
| 📥 Importar | Importación de convocatorias vía URL, texto o extensión Chrome |
| 📅 Agenda | Timeline de cierres con integración Google Calendar |
| 🎯 Plan de Acción | Roadmap con checklist de pasos y requisitos |
| 🤖 Asesor IA | Chat estratégico con contexto completo del sistema |
| ⚙️ Configuración | Editor de prompts del Asesor IA con preview en tiempo real |

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
- **Extensión Chrome** — extrae DOM de la página activa sin CORS, detecta PDFs de bases, envía datos a la app vía `?import=<b64json>`
- **Lectura de PDFs** — OpenRouter file-parser plugin con motor `cloudflare-ai` (gratuito), extrae REQUISITOS / ENTREGABLES / EVALUACIÓN del documento oficial
- **Extracción IA** — cascade de modelos gratuitos (DeepSeek → Llama → Qwen → Gemma), con fallback a Gemini 2.5 Flash
- **Archivar / Borrar** — los registros importados se pueden archivar (se ocultan de las vistas, recuperables) o eliminar; disponible desde ViewImport y desde los cards expandidos en cada sección

### Extensión Chrome

Archivos en `chrome-extension/`. Cargar en `chrome://extensions/` → Developer Mode → Load unpacked.

- Requiere OpenRouter API Key (guardada en `chrome.storage.sync`)
- Detecta y lista PDFs/documentos en la página activa
- Botón "📄 Leer" analiza PDFs con IA y rellena el resumen de bases

## Variables de plantilla disponibles

`{{hasWoman}}` `{{hasSpA}}` `{{hasSales}}` `{{hasSiiInitiated}}` `{{stackedNames}}` `{{stackedDetail}}` `{{stackedWithEntity}}` `{{financiamientosList}}` `{{licitacionesList}}` `{{hackatonesList}}` y más.

## Correr en local

**Requisitos:** Node.js 18+

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local:
#   VITE_OPENROUTER_API_KEY=sk-or-...   ← obtener en openrouter.ai
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

Todo el contenido (fondos, licitaciones, hackatones, roadmap) está en **`src/data.ts`**. No hay backend ni API calls para datos — editar ese archivo es suficiente.

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
    ├── ViewImport.tsx         # Importador de convocatorias externas
    ├── ViewLanding.tsx
    ├── ViewFinanciamientos.tsx
    ├── ViewLicitaciones.tsx
    ├── ViewHackatones.tsx
    ├── ViewAgenda.tsx
    ├── PlanDeAccion.tsx
    └── ...

chrome-extension/
├── manifest.json   # Manifest V3
├── popup.html
├── popup.css
└── popup.js        # Extracción DOM, lectura PDF, envío a la app
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
| `radar_import_perplexity` | Preferencia de modo Perplexity-first en importador |
