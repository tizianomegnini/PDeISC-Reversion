const API = 'https://jsonplaceholder.typicode.com';

  // ══ TEMA ══
  function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-bs-theme') === 'dark';
    html.setAttribute('data-bs-theme', isDark ? 'light' : 'dark');
    document.getElementById('theme-icon').className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
  }

  // ══ BACK TO TOP ══
  const btn = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  });

  // ══ HELPERS ══
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

  function showMsg(id, html, ok) {
    document.getElementById(id).innerHTML =
      `<div class="alert ${ok ? 'alert-success' : 'alert-danger'} py-2 px-3 small mt-2">${html}</div>`;
  }

  function setLoading(id, text) {
    document.getElementById(id).innerHTML =
      `<div class="col-12"><p class="loading-text"><span class="spinner-border spinner-border-sm me-2"></span>${text}</p></div>`;
  }

  // ══ TAB SYNC ══
  function setTab(sec, t) {
    ['fetch','axios'].forEach(m => {
      const el = document.getElementById(`c${sec}-${m}`);
      if (el) el.style.display = m === t ? '' : 'none';
    });
    const card = document.querySelectorAll('.consigna-card')[parseInt(sec)-1];
    card.querySelectorAll('.mtab').forEach((btn, i) => {
      btn.classList.remove('active-fetch','active-axios');
      if (i===0 && t==='fetch') btn.classList.add('active-fetch');
      if (i===1 && t==='axios') btn.classList.add('active-axios');
    });
    // reset results
    const r = document.getElementById(`resultado-${sec}`);
    if (r) r.innerHTML = '';
    if (sec==='3') { document.getElementById('count-badge').textContent='—'; document.getElementById('buscador').value=''; todosUsuarios=[]; }
  }

  // ══ C3: Búsqueda ══
  let todosUsuarios = [];
  async function cargarBusquedaFetch() {
    setLoading('resultado-3','Cargando con fetch…');
    try {
      const res = await fetch(`${API}/users`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      todosUsuarios = await res.json(); filtrarUsuarios();
    } catch(e) { document.getElementById('resultado-3').innerHTML=`<div class="col-12"><div class="alert alert-danger small py-2">${e.message}</div></div>`; }
  }
  async function cargarBusquedaAxios() {
    setLoading('resultado-3','Cargando con axios…');
    try {
      const res = await axios.get(`${API}/users`);
      todosUsuarios = res.data; filtrarUsuarios();
    } catch(e) { document.getElementById('resultado-3').innerHTML=`<div class="col-12"><div class="alert alert-danger small py-2">${e.message}</div></div>`; }
  }
  function filtrarUsuarios() {
    if (!todosUsuarios.length) return;
    const q = document.getElementById('buscador').value.toLowerCase();
    const f = todosUsuarios.filter(u => u.name.toLowerCase().includes(q));
    document.getElementById('count-badge').textContent = f.length;
    renderCards(f, 'resultado-3');
  }