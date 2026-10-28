const API = "http://localhost:3000/alumnos";

async function cargar() {
    try {
        const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get' })
        });
        const data = await res.json();
        const div = document.getElementById('lista');
        
        div.innerHTML = data.map(a => `
            <div class="col-md-4">
                <div class="card shadow-sm p-3">
                    <h5>${a.nombre} ${a.apellido}</h5>
                    <p class="text-muted">Edad: ${a.edad}</p>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error("Error al conectar:", e);
    }
}
// ... (tu lógica existente de cargarAlumnos)

// Lógica del modo oscuro/claro
const btnTheme = document.getElementById('btnTheme');

btnTheme.addEventListener('click', () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-bs-theme');
    
    if (currentTheme === 'dark') {
        html.setAttribute('data-bs-theme', 'light');
        btnTheme.innerText = "🌙 Modo Dark";
    } else {
        html.setAttribute('data-bs-theme', 'dark');
        btnTheme.innerText = "☀️ Modo Light";
    }
});
cargar();