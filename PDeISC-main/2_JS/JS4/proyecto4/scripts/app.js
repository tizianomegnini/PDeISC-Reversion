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

  // ══ C4: API local ══
  async function apiAlumnosFetch() {
  const res = await fetch('../alumnos.json');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data;
}
  function renderAlumnos(alumnos) {
    document.getElementById('resultado-4').innerHTML = `
      <table class="table table-hover table-bordered table-sm align-middle small">
        <thead class="table-light">
          <tr><th>#</th><th>Nombre</th><th>Email</th><th>Materia</th><th class="text-center">Nota</th></tr>
        </thead>
        <tbody>
          ${alumnos.map(a => `<tr>
            <td class="text-secondary">${a.id}</td>
            <td class="fw-semibold">${a.nombre}</td>
            <td class="text-secondary">${a.email}</td>
            <td>${a.materia}</td>
            <td class="text-center"><span class="badge ${a.nota>=7?'bg-success':'bg-warning text-dark'}">${a.nota}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  }
  async function cargarAlumnosFetch() {
  const div = document.getElementById('resultado-4');
  div.innerHTML = '<p class="loading">Cargando con fetch…</p>';

  try {
    const data = await apiAlumnosFetch();
    renderAlumnos(data);
  } catch (e) {
    div.innerHTML = `<div class="response-box error">Error: ${e.message}</div>`;
  }
}
  async function cargarAlumnosAxios() {
  const div = document.getElementById('resultado-4');
  div.innerHTML = '<p class="loading">Cargando con axios…</p>';

  try {
    const res = await axios.get('../alumnos.json');
    renderAlumnos(res.data);
  } catch (e) {
    div.innerHTML = `<div class="response-box error">Error: ${e.message}</div>`;
  }
}