# Radar Fondos CL

Plataforma de inteligencia estratégica para startups tecnológicas chilenas. Centraliza y prioriza oportunidades de financiamiento gubernamental (CORFO, SERCOTEC, Startup Chile), licitaciones de Mercado Público y hackatones corporativos.

## Stack

- **React 19** · **Vite 6** · **TypeScript**
- **Tailwind CSS v4** (sin config file, via `@tailwindcss/vite`)
- **Motion** (Framer Motion) · **Lucide Icons**
- **OpenRouter API** (modelos GPT OSS 120B, MiniMax, Nemotron — gratuitos con fallback Gemini 2.5 Flash)

## Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| 📋 Resumen | Dashboard con portafolio activo, comparación y monto total de stack |
| 💰 Subsidios | Filtrado en tiempo real por perfil (socia, SpA, SII, ventas) |
| 🏛️ Licitaciones | Oportunidades de Mercado Público / ChileCompra |
| ⚡ Hackatones | Retos con premios y validación de startup |
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
    ├── GeminiPanel.tsx  # Panel principal del Asesor IA
    ├── FloatingAI.tsx   # Botón flotante + panel compacto IA
    ├── SettingsPanel.tsx# Editor de prompts con preview
    ├── ViewLanding.tsx
    ├── ViewFinanciamientos.tsx
    ├── ViewLicitaciones.tsx
    ├── ViewHackatones.tsx
    ├── ViewAgenda.tsx
    ├── PlanDeAccion.tsx
    └── ...
```

## Estado global (localStorage)

| Key | Contenido |
|-----|-----------|
| `milton_radar_theme` | `"light"` o `"dark"` |
| `milton_radar_profile` | `MiltonProfile` JSON |
| `milton_radar_stacked` | Array de IDs de fondos en portafolio |
| `milton_radar_roadmap_ticks` | Array de IDs de pasos completados |
| `milton_radar_prompts_v1` | Prompts personalizados del Asesor IA |
