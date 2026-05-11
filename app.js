/* ════════════════════════════════════════════
   ECUAQUÍMICA — KIOSKO APP JS
   Leads → Google Sheets via Apps Script
════════════════════════════════════════════ */

// ── CONFIGURACIÓN ──────────────────────────
// Pega aquí la URL de tu Google Apps Script desplegado
const SHEETS_URL = 'TU_APPS_SCRIPT_URL_AQUI';

// Auto-retorno al inicio tras N segundos de inactividad
const IDLE_TIMEOUT_MS = 120_000; // 2 minutos

// Intervalo del parpadeo del botón de contacto (ms)
const BLINK_INTERVAL_MS = 90_000; // 90 segundos
// ─────────────────────────────────────────

// ── Estado ─────────────────────────────────
let currentScreen = 'main';
let idleTimer = null;
let blinkTimer = null;
let selectedCatalog = '';

// ── Screens ────────────────────────────────
const screens = {
  main:    document.getElementById('screen-main'),
  pdf:     document.getElementById('screen-pdf'),
  form:    document.getElementById('screen-form'),
  success: document.getElementById('screen-success'),
};

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.remove('active', 'slide-in');
    if (key === name) {
      // Force reflow for animation
      void el.offsetWidth;
      el.classList.add('active', 'slide-in');
    }
  });
  currentScreen = name;
  resetIdle();
}

// ── Catálogo / PDF ──────────────────────────
function openCatalog(btn) {
  const pdf   = btn.dataset.pdf;
  const label = btn.dataset.label;

  // Bounce visual
  btn.classList.remove('bounce');
  void btn.offsetWidth;
  btn.classList.add('bounce');

  // Pequeño delay para que se vea el bounce
  setTimeout(() => {
    selectedCatalog = label;
    const frame = document.getElementById('pdf-frame');
    // Usamos pdf.js viewer si disponible, si no carga directo
    frame.src = pdf;
    showScreen('pdf');
  }, 240);
}

// ── Formulario ─────────────────────────────
function openForm() {
  clearForm();
  // Pre-selecciona el catálogo si viene del visor
  if (selectedCatalog) {
    const sel = document.getElementById('f-catalogo');
    for (let opt of sel.options) {
      if (opt.value === selectedCatalog) { opt.selected = true; break; }
    }
  }
  showScreen('form');
}

function goBack() {
  if (currentScreen === 'pdf' || currentScreen === 'form') {
    showScreen('main');
  }
}

function goHome() {
  selectedCatalog = '';
  document.getElementById('pdf-frame').src = '';
  clearForm();
  showScreen('main');
}

// ── Validación ─────────────────────────────
function validateForm() {
  let valid = true;
  const fields = [
    { id: 'f-nombre',   errId: 'err-nombre',   msg: 'Ingresa tu nombre.' },
    { id: 'f-apellido', errId: 'err-apellido', msg: 'Ingresa tu apellido.' },
    { id: 'f-telefono', errId: 'err-telefono', msg: 'Ingresa un teléfono válido.', pattern: /^\+?[\d\s\-()]{7,15}$/ },
    { id: 'f-catalogo', errId: 'err-catalogo', msg: 'Selecciona un catálogo.' },
  ];

  // Limpiar errores anteriores
  document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
  document.querySelectorAll('.has-error').forEach(e => e.classList.remove('has-error'));

  fields.forEach(({ id, errId, msg, pattern }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    const val = el.value.trim();
    let ok = val.length > 0;
    if (ok && pattern) ok = pattern.test(val);
    if (!ok) {
      err.textContent = msg;
      el.classList.add('has-error');
      valid = false;
    }
  });

  // Email: opcional pero si tiene valor debe ser válido
  const emailEl  = document.getElementById('f-email');
  const emailErr = document.getElementById('err-email');
  const emailVal = emailEl.value.trim();
  if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    emailErr.textContent = 'Ingresa un correo válido.';
    emailEl.classList.add('has-error');
    valid = false;
  }

  return valid;
}

// ── Envío ───────────────────────────────────
async function submitLead(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const btn    = document.getElementById('btn-submit');
  const label  = document.getElementById('btn-submit-text');
  const loader = document.getElementById('btn-submit-loader');

  btn.disabled = true;
  label.textContent = 'Enviando…';
  loader.hidden = false;

  const payload = {
    nombre:   document.getElementById('f-nombre').value.trim(),
    apellido: document.getElementById('f-apellido').value.trim(),
    telefono: document.getElementById('f-telefono').value.trim(),
    email:    document.getElementById('f-email').value.trim(),
    catalogo: document.getElementById('f-catalogo').value,
    fecha:    new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }),
  };

  try {
    if (SHEETS_URL !== 'TU_APPS_SCRIPT_URL_AQUI') {
      const params = new URLSearchParams({
        nombre:   payload.nombre,
        apellido: payload.apellido,
        telefono: payload.telefono,
        email:    payload.email,
        catalogo: payload.catalogo,
        fecha:    payload.fecha,
      });
      // Técnica pixel: Apps Script acepta GET, evita problemas CORS
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = img.onerror = resolve;
        img.src = `${SHEETS_URL}?${params.toString()}`;
        setTimeout(resolve, 4000); // timeout 4s
      });
    }

    // Fallback: guardar en localStorage como respaldo
    saveLocalLead(payload);

    showScreen('success');

    // Auto-volver al inicio después de 8 segundos
    setTimeout(goHome, 8000);

  } catch (err) {
    console.error('Error enviando lead:', err);
    // Aún así guardamos local y mostramos éxito (no pierdas el lead)
    saveLocalLead(payload);
    showScreen('success');
    setTimeout(goHome, 8000);
  } finally {
    btn.disabled = false;
    label.textContent = 'Enviar mis datos';
    loader.hidden = true;
  }
}

// ── Respaldo local (localStorage) ──────────
function saveLocalLead(data) {
  try {
    const key   = 'ecua_leads';
    const leads = JSON.parse(localStorage.getItem(key) || '[]');
    leads.push(data);
    localStorage.setItem(key, JSON.stringify(leads));
  } catch { /* quota exceeded, ignore */ }
}

// Para exportar leads locales: abre consola del navegador y escribe:
// console.table(JSON.parse(localStorage.getItem('ecua_leads')))

// ── Limpiar formulario ──────────────────────
function clearForm() {
  document.getElementById('lead-form').reset();
  document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
  document.querySelectorAll('.has-error').forEach(e => e.classList.remove('has-error'));
  const btn   = document.getElementById('btn-submit');
  const label = document.getElementById('btn-submit-text');
  const loader = document.getElementById('btn-submit-loader');
  btn.disabled = false;
  label.textContent = 'Enviar mis datos';
  loader.hidden = true;
}

// ── Parpadeo del botón contacto ─────────────
function startBlinkTimer() {
  blinkTimer = setInterval(() => {
    const btn = document.getElementById('btn-contacto');
    if (currentScreen !== 'main') return;
    btn.classList.remove('blink');
    void btn.offsetWidth; // reflow
    btn.classList.add('blink');
    btn.addEventListener('animationend', () => btn.classList.remove('blink'), { once: true });
  }, BLINK_INTERVAL_MS);
}

// ── Idle / auto-return ──────────────────────
function resetIdle() {
  clearTimeout(idleTimer);
  if (currentScreen !== 'main') {
    idleTimer = setTimeout(() => {
      goHome();
    }, IDLE_TIMEOUT_MS);
  }
}

// Reset idle on any touch/click
document.addEventListener('touchstart', resetIdle, { passive: true });
document.addEventListener('click', resetIdle);

// ── Teclado físico: ESC vuelve al inicio ─────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') goHome();
});

// ── Init ────────────────────────────────────
(function init() {
  showScreen('main');
  startBlinkTimer();

  // Primer blink a los 5 segundos para dar la bienvenida
  setTimeout(() => {
    const btn = document.getElementById('btn-contacto');
    btn.classList.add('blink');
    btn.addEventListener('animationend', () => btn.classList.remove('blink'), { once: true });
  }, 5000);
})();
