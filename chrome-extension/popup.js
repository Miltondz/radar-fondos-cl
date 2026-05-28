'use strict';

const RADAR_APP_URL = 'https://radarfondos.netlify.app/';

const MODELS_EXTRACT = [
  'openai/gpt-oss-120b:free',
  'minimax/minimax-m2.5:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemini-2.5-flash',
];

const PERPLEXITY_MODELS = [
  'perplexity/sonar',
  'perplexity/sonar-pro',
];

const EXTRACTION_PROMPT = `Eres un asistente de extracción de datos para "Radar Fondos CL", plataforma de financiamiento para startups chilenas.

Analiza el contenido y extrae los datos de la convocatoria en JSON.

REGLAS:
1. Devuelve SOLO JSON válido. Sin markdown ni explicaciones.
2. Sin convocatoria real: {"error": "No se encontró convocatoria."}
3. type: "financiamiento" | "licitacion" | "hackaton"
4. amountNumber: entero CLP. USD → ×950. Sin dato → 0.
5. urgency: "CRITICAL" <7d, "HIGH" <30d, "MEDIUM" <90d, "LOW" mayor, "CLOSED".
6. basesResumen con estructura:
   "REQUISITOS: [elegibilidad y documentación]
    ENTREGABLES: [formularios, pitch, plan, prototipo, etc.]
    EVALUACIÓN: [criterios, puntajes, comité, etapas]"

JSON a devolver:
{
  "name": "Nombre oficial completo",
  "entity": "Organismo convocante",
  "amount": "Monto legible",
  "amountNumber": 0,
  "deadline": "Fecha en español",
  "deadlineISO": "YYYY-MM-DD",
  "description": "Descripción completa (máx 500 chars)",
  "category": "Seed|Growth|Innovation|Credit|R&D",
  "type": "financiamiento|licitacion|hackaton",
  "url": "URL de la página",
  "basesUrl": "URL directa a bases o formulario de postulación",
  "organizer": "Organismo específico",
  "requirements": ["req 1", "req 2"],
  "eligibilityNotes": "Quién puede y no puede postular",
  "urgency": "CRITICAL|HIGH|MEDIUM|LOW|CLOSED",
  "basesResumen": "REQUISITOS: ...\\nENTREGABLES: ...\\nEVALUACIÓN: ...",
  "cofinancing": "% o monto cofinanciamiento, vacío si no aplica",
  "tips": "Consejo clave (máx 150 chars)",
  "chileCode": "Código licitación si aplica",
  "address": "Dirección si presencial"
}`;

// ── DOM refs ──────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ── State ─────────────────────────────────────────────────────
let currentTab = null;
let extractedText = '';
let draftData = null;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadApiKey();
  await initCurrentTab();
  bindEvents();
});

async function initCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  $('pageUrl').textContent = tab.url || '—';
  $('pageTitle').textContent = tab.title || '';
}

// ── Events ────────────────────────────────────────────────────
function bindEvents() {
  $('btnAnalyze').addEventListener('click', handleAnalyze);
  $('btnRetry').addEventListener('click', () => { showSection('sectionAnalyze'); });
  $('btnSend').addEventListener('click', handleSend);
  $('btnReset').addEventListener('click', () => { draftData = null; showSection('sectionAnalyze'); });
  $('btnSuccessReset').addEventListener('click', () => { draftData = null; showSection('sectionAnalyze'); });
  $('btnToggleSettings').addEventListener('click', () => {
    $('settingsPanel').classList.toggle('hidden');
  });
  $('btnSaveKey').addEventListener('click', saveApiKey);
  $('fieldBasesUrl').addEventListener('input', () => {
    const val = $('fieldBasesUrl').value.trim();
    $('linkBases').href = val || '#';
    $('linkBases').classList.toggle('hidden', !val);
  });
}

// ── Extract page text via scripting API ───────────────────────
async function getPageText() {
  const results = await chrome.scripting.executeScript({
    target: { tabId: currentTab.id },
    func: () => {
      // Extract clean text
      const clone = document.body.cloneNode(true);
      clone.querySelectorAll(
        'script,style,nav,footer,header,aside,noscript,[role="navigation"],[role="banner"]'
      ).forEach((el) => el.remove());
      const text = (clone.innerText || clone.textContent || '')
        .replace(/\s{3,}/g, '\n\n')
        .trim();

      // Extract PDF/document links from the REAL DOM (not clone)
      const pdfLinks = [];
      document.querySelectorAll('a[href]').forEach((a) => {
        const href = a.href || '';
        const label = (a.textContent || '').trim().toLowerCase();
        const isPdf = href.match(/\.(pdf|docx?|xlsx?|pptx?)(\?|$)/i);
        const isBaseKeyword = label.match(/base|reglamento|formulario|postula|requisito|convocatoria|anexo/i);
        if (isPdf || isBaseKeyword) {
          pdfLinks.push({ url: href, label: (a.textContent || '').trim().slice(0, 80) });
        }
      });
      // Deduplicate
      const seen = new Set();
      const uniquePdfs = pdfLinks.filter((l) => {
        if (seen.has(l.url)) return false;
        seen.add(l.url);
        return true;
      }).slice(0, 8);

      return {
        text: text.slice(0, 7000),
        url: window.location.href,
        title: document.title,
        pdfLinks: uniquePdfs,
      };
    },
  });
  return results[0]?.result ?? { text: '', url: currentTab.url, title: currentTab.title, pdfLinks: [] };
}

// ── Main analyze flow ─────────────────────────────────────────
async function handleAnalyze() {
  const apiKey = await getApiKey();
  if (!apiKey) {
    $('settingsPanel').classList.remove('hidden');
    $('inputApiKey').focus();
    return;
  }

  showSection('sectionLoading');
  setLoadingMsg('Extrayendo texto de la página…');

  try {
    const page = await getPageText();
    extractedText = page.text;

    // Append PDF links to extracted text so the model can use them
    if (page.pdfLinks && page.pdfLinks.length > 0) {
      const pdfSection = '\n\nENLACES DE DOCUMENTOS ENCONTRADOS EN LA PÁGINA:\n' +
        page.pdfLinks.map((l) => `- ${l.label}: ${l.url}`).join('\n');
      extractedText = (extractedText + pdfSection).slice(0, 8000);
    }

    setLoadingMsg('Analizando con IA…');
    const raw = await callOpenRouter(apiKey, extractedText, page.url, false);
    const parsed = parseJson(raw);

    if (parsed.error) {
      showError(parsed.error);
      return;
    }

    draftData = parsed;
    draftData._sourceUrl = page.url;
    draftData._pdfLinks = page.pdfLinks || [];
    renderResult(parsed);
    renderPdfLinks(page.pdfLinks || []);
    showSection('sectionResult');
  } catch (err) {
    // Fallback: try Perplexity with the URL directly
    setLoadingMsg('Intentando Perplexity con acceso web…');
    try {
      const raw = await callPerplexity(apiKey, currentTab.url);
      const parsed = parseJson(raw);
      if (parsed.error || !parsed.name) throw new Error(parsed.error || 'Sin datos');
      draftData = parsed;
      draftData._sourceUrl = currentTab.url;
      renderResult(parsed);
      showSection('sectionResult');
    } catch (err2) {
      showError(`Error: ${err2.message}. Verifica la API key o la página.`);
    }
  }
}

// ── OpenRouter call (text extraction models) ──────────────────
async function callOpenRouter(apiKey, text, sourceUrl, usePerplexity) {
  const models = usePerplexity ? PERPLEXITY_MODELS : MODELS_EXTRACT;
  let lastErr = null;

  for (const model of models) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': RADAR_APP_URL,
          'X-Title': 'Radar Fondos CL Extension',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: EXTRACTION_PROMPT },
            {
              role: 'user',
              content: `URL fuente: ${sourceUrl}\n\nContenido:\n\n${text.slice(0, 5000)}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 1800,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.choices[0]?.message?.content ?? '';
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('Todos los modelos fallaron.');
}

// ── Perplexity call (direct URL, web access) ──────────────────
async function callPerplexity(apiKey, url) {
  for (const model of PERPLEXITY_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': RADAR_APP_URL,
          'X-Title': 'Radar Fondos CL Extension',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: EXTRACTION_PROMPT },
            {
              role: 'user',
              content: `Lee el contenido de esta URL y extrae los datos de la convocatoria en JSON:\n\n${url}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 1800,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.choices[0]?.message?.content ?? '';
    } catch (e) { /* try next */ }
  }
  throw new Error('Perplexity no disponible.');
}

// ── Parse JSON from model response ───────────────────────────
function parseJson(raw) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { error: 'Respuesta sin JSON válido.' };
  try { return JSON.parse(match[0]); }
  catch { return { error: 'JSON inválido en respuesta.' }; }
}

// ── Render result preview ─────────────────────────────────────
function renderPdfLinks(pdfLinks) {
  const section = $('pdfLinksSection');
  const list = $('pdfLinksList');
  if (!pdfLinks || pdfLinks.length === 0) { section.classList.add('hidden'); return; }
  list.innerHTML = '';
  pdfLinks.forEach((l) => {
    const row = document.createElement('div');
    row.className = 'pdf-link';
    const label = document.createElement('span');
    label.className = 'pdf-link-label';
    label.textContent = l.label || l.url;
    label.title = l.url;
    const open = document.createElement('a');
    open.className = 'pdf-link-btn';
    open.href = l.url;
    open.target = '_blank';
    open.textContent = 'Abrir';
    const use = document.createElement('button');
    use.className = 'pdf-link-use';
    use.textContent = 'Usar';
    use.addEventListener('click', () => {
      $('fieldBasesUrl').value = l.url;
      $('linkBases').href = l.url;
      $('linkBases').classList.remove('hidden');
    });
    row.appendChild(label);
    row.appendChild(open);
    row.appendChild(use);
    list.appendChild(row);
  });
  section.classList.remove('hidden');
}

function renderResult(d) {
  // Badges
  const urgency = d.urgency || 'MEDIUM';
  const ub = $('badgeUrgency');
  ub.textContent = urgency;
  ub.className = `badge badge-${urgency}`;

  const type = d.type || 'financiamiento';
  const TYPE_LABELS = { financiamiento: '💰 Subsidio', licitacion: '🏛️ Licitación', hackaton: '⚡ Hackaton' };
  $('badgeType').textContent = TYPE_LABELS[type] || type;

  // Fields
  $('fieldName').value = d.name || '';
  $('fieldEntity').value = d.entity || '';
  $('fieldAmount').value = d.amount || '';
  $('fieldDeadline').value = d.deadline || '';
  $('fieldType').value = type;

  const basesUrl = d.basesUrl || '';
  $('fieldBasesUrl').value = basesUrl;
  if (basesUrl) {
    $('linkBases').href = basesUrl;
    $('linkBases').classList.remove('hidden');
  }

  $('fieldBasesResumen').value = d.basesResumen || '';
}

// ── Send to app ───────────────────────────────────────────────
function handleSend() {
  if (!draftData) return;

  // Merge edits from fields
  const payload = {
    ...draftData,
    name: $('fieldName').value,
    entity: $('fieldEntity').value,
    amount: $('fieldAmount').value,
    deadline: $('fieldDeadline').value,
    type: $('fieldType').value,
    basesUrl: $('fieldBasesUrl').value,
    basesResumen: $('fieldBasesResumen').value,
    _source: 'extension',
  };

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const url = `${RADAR_APP_URL}?import=${encoded}`;

  chrome.tabs.create({ url });
  showSection('sectionSuccess');
}

// ── API Key storage ───────────────────────────────────────────
async function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('orApiKey', (data) => resolve(data.orApiKey || ''));
  });
}

async function loadApiKey() {
  const key = await getApiKey();
  if (key) $('inputApiKey').value = key;
}

function saveApiKey() {
  const key = $('inputApiKey').value.trim();
  chrome.storage.sync.set({ orApiKey: key }, () => {
    $('btnSaveKey').textContent = '✓ Guardada';
    setTimeout(() => { $('btnSaveKey').textContent = 'Guardar'; }, 1500);
  });
}

// ── UI helpers ────────────────────────────────────────────────
const SECTIONS = ['sectionAnalyze', 'sectionLoading', 'sectionError', 'sectionResult', 'sectionSuccess'];

function showSection(id) {
  SECTIONS.forEach((s) => $( s).classList.add('hidden'));
  $(id).classList.remove('hidden');
}

function showError(msg) {
  $('errorMsg').textContent = msg;
  showSection('sectionError');
}

function setLoadingMsg(msg) {
  $('loadingMsg').textContent = msg;
}
