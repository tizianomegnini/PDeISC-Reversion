/**
 * Configuración base de la API
 * @type {string}
 */
const API = 'https://jsonplaceholder.typicode.com';

// ══ TEMA ══

/**
 * Alterna entre el modo claro y oscuro en el documento.
 */
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-bs-theme') === 'dark';
  html.setAttribute('data-bs-theme', isDark ? 'light' : 'dark');
  document.getElementById('theme-icon').className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
}

// ══ BACK TO TOP ══

/**
 * Lógica para mostrar/ocultar el botón "Volver arriba" basado en el scroll.
 */
const btn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  btn.classList.toggle('visible', window.scrollY > 300);
});

// ══ HELPERS ══

/**
 * Renderiza tarjetas de usuario.
 * @param {Array} usuarios - Lista de objetos de usuario.
 * @param {string} id - ID del contenedor en el DOM.
 */
function renderCards(usuarios, id) {
  const div = document.getElementById(id);
  if (!usuarios.length) {
    div.innerHTML = '<div class="col-12"><p class="text-secondary small">No se encontraron usuarios.</p></div>';
    return;
  }
  div.innerHTML = usuarios.map(u => `
    <div class="col-12 col-sm-6 col-md-4 col-lg-3">
      <div class="user-card">
        <div class="u-name">${u.name}</div>
        <div class="u-email">${u.email}</div>
      </div>
    </div>`).join('');
}

/**
 * Valida que un nombre solo contenga letras y espacios.
 * @param {string} nombre 
 * @returns {boolean}
 */
function nombreValido(nombre) {
  return /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s']+$/.test(nombre);
}

/**
 * Validación básica de formato de email.
 * @param {string} email 
 * @returns {boolean}
 */
function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Muestra alertas en la interfaz.
 * @param {string} id - ID del elemento destino.
 * @param {string} html - Contenido del mensaje.
 * @param {boolean} ok - Indica si el mensaje es de éxito o error.
 */
function showMsg(id, html, ok) {
  document.getElementById(id).innerHTML =
    `<div class="alert ${ok ? 'alert-success' : 'alert-danger'} py-2 px-3 small mt-2">${html}</div>`;
}

/**
 * Muestra un indicador de carga.
 * @param {string} id - ID del elemento destino.
 * @param {string} text - Mensaje de carga.
 */
function setLoading(id, text) {
  document.getElementById(id).innerHTML =
    `<div class="col-12"><p class="loading-text"><span class="spinner-border spinner-border-sm me-2"></span>${text}</p></div>`;
}

// ══ TAB SYNC ══

/**
 * Sincroniza la visibilidad de pestañas y limpia los resultados previos.
 * @param {string} sec - Sección actual.
 * @param {string} t - Método seleccionado ('fetch' o 'axios').
 */
function setTab(sec, t) {
  ['fetch', 'axios'].forEach(m => {
    const el = document.getElementById(`c${sec}-${m}`);
    if (el) el.style.display = m === t ? '' : 'none';
  });
  const card = document.querySelectorAll('.consigna-card')[parseInt(sec)-1];
  card.querySelectorAll('.mtab').forEach((btn, i) => {
    btn.classList.remove('active-fetch','active-axios');
    if (i===0 && t==='fetch') btn.classList.add('active-fetch');
    if (i===1 && t==='axios') btn.classList.add('active-axios');
  });
  
  const r = document.getElementById(`resultado-${sec}`);
  if (r) r.innerHTML = '';
  if (sec==='3') { document.getElementById('count-badge').textContent='—'; document.getElementById('buscador').value=''; todosUsuarios=[]; }
}

// ══ C2: POST formulario ══

/**
 * Envía datos del formulario a la API mediante POST usando la API nativa Fetch.
 * Realiza validaciones previas de formato.
 */
async function enviarFormFetch() {
  const nombre = document.getElementById('form-nombre').value.trim();
  const email  = document.getElementById('form-email').value.trim();

  // VALIDACIONES
  if (!nombre || !email) {
    showMsg('resultado-2','Completá nombre y email.', false);
    return;
  }
  if (!nombreValido(nombre)) {
    showMsg('resultado-2','El nombre no puede contener números.', false);
    return;
  }
  if (!emailValido(email)) {
    showMsg('resultado-2','Ingresá un email válido.', false);
    return;
  }

  try {
    const res = await fetch(`${API}/users`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name: nombre, email })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    showMsg('resultado-2', `<i class="bi bi-check-circle me-1"></i>Usuario creado con <strong>fetch</strong>. ID de respuesta: <strong>${data.id}</strong>`, true);
  } catch(e) {
    showMsg('resultado-2', e.message, false);
  }
}

/**
 * Envía datos del formulario a la API mediante POST usando la librería Axios.
 * Realiza validaciones previas de formato.
 */
async function enviarFormAxios() {
  const nombre = document.getElementById('form-nombre').value.trim();
  const email  = document.getElementById('form-email').value.trim();

  // VALIDACIONES
  if (!nombre || !email) {
    showMsg('resultado-2','Completá nombre y email.', false);
    return;
  }
  if (!nombreValido(nombre)) {
    showMsg('resultado-2','El nombre no puede contener números.', false);
    return;
  }
  if (!emailValido(email)) {
    showMsg('resultado-2','Ingresá un email válido.', false);
    return;
  }

  try {
    const res = await axios.post(`${API}/users`, { name: nombre, email });
    showMsg('resultado-2', `<i class="bi bi-check-circle me-1"></i>Usuario creado con <strong>axios</strong>. ID de respuesta: <strong>${res.data.id}</strong>`, true);
  } catch(e) {
    showMsg('resultado-2', e.message, false);
  }
}