let lista = [];
let editIdx = null;

const input = document.getElementById('inputNum');
const btnAdd = document.getElementById('addBtn');
const display = document.getElementById('display');
const feedback = document.getElementById('liveVal');
const contadorText = document.getElementById('contador');
const btnTop = document.getElementById('scrollToTop');
const actionBox = document.getElementById('actionBox');
const resetBtn = document.getElementById('resetBtn');
const historialLista = document.getElementById('historialLista');

// --- MANEJO DEL HISTORIAL ASÍNCRONO ---
const cargarHistorial = async () => {
    try {
        const res = await fetch('/historial');
        if (!res.ok) throw new Error();
        const archivos = await res.json();

        if (archivos.length === 0) {
            historialLista.innerHTML = `<p class="small text-muted fst-italic mb-0 py-2">No hay reportes generados en el servidor.</p>`;
            return;
        }

        historialLista.innerHTML = `
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Nombre del Reporte</th>
                        <th>Fecha de Registro</th>
                        <th class="text-end">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${archivos.map(file => {
                        const dateFormatted = new Date(file.date).toLocaleString('es-ES');
                        return `
                            <tr>
                                <td class="font-monospace text-primary">📄 ${file.name}</td>
                                <td class="text-muted small">${dateFormatted}</td>
                                <td class="text-end">
                                    <a href="/descargar-historial?file=${encodeURIComponent(file.name)}" class="btn-download-history">Bajar</a>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch {
        historialLista.innerHTML = `<p class="small text-danger mb-0 py-2">⚠️ Error de conexión con el repositorio.</p>`;
    }
};

// --- CONTROLADOR DE INTERFAZ GRÁFICA (UI) ---
const updateUI = () => {
    display.innerHTML = '';
    const total = lista.length;
    contadorText.textContent = total;

    if (total === 0) {
        display.innerHTML = `<span class="small text-muted fst-italic">Ningún número cargado aún.</span>`;
    }

    lista.forEach((item, i) => {
        const chip = document.createElement('div');
        chip.className = 'numero-badge animate-fade';
        chip.innerHTML = `
            <span class="fw-bold">${item.valor}</span>
            <div class="d-flex gap-1">
                <button class="btn-edit" data-idx="${i}">✏️</button>
                <button class="btn-del" data-idx="${i}">🗑️</button>
            </div>
        `;
        display.appendChild(chip);
    });

    // Muestra panel de descarga entre 10 y 20 elementos
    actionBox.classList.toggle('show', total >= 10);
    resetBtn.classList.toggle('d-none', total === 0);
    btnAdd.disabled = (total >= 20 && editIdx === null);
};

// Capturador de clicks dinámicos en los chips (Evita usar onclick en HTML)
display.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-del')) {
        const idx = e.target.getAttribute('data-idx');
        lista.splice(idx, 1);
        if (editIdx == idx) {
            editIdx = null;
            btnAdd.textContent = "Agregar";
            btnAdd.className = "btn btn-primary fw-bold";
            input.value = "";
        }
        updateUI();
    }
    if (e.target.classList.contains('btn-edit')) {
        const idx = e.target.getAttribute('data-idx');
        editIdx = idx;
        input.value = lista[idx].valor;
        btnAdd.textContent = "Guardar";
        btnAdd.className = "btn btn-warning fw-bold text-dark";
        input.focus();
    }
});

// --- LÓGICA DE PROCESAMIENTO ---
const procesar = () => {
    const val = input.value.trim();
    
    if (val === "" || isNaN(parseInt(val))) {
        feedback.textContent = "Ingrese un número entero válido";
        return;
    }

    if (lista.length >= 20 && editIdx === null) {
        feedback.textContent = "Límite máximo (20) alcanzado";
        return;
    }

    const ahora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    if (editIdx !== null) {
        lista[editIdx] = { valor: parseInt(val), fecha: ahora + " (Modificado)" };
        editIdx = null;
        btnAdd.textContent = "Agregar";
        btnAdd.className = "btn btn-primary fw-bold";
    } else {
        lista.push({ valor: parseInt(val), fecha: ahora });
    }

    input.value = '';
    feedback.textContent = '';
    updateUI();
};

// --- EVENTOS ---
btnAdd.addEventListener('click', procesar);
input.addEventListener('keydown', (e) => {
    const prohibidos = ['e', 'E', '.', '-', '+', '=', ','];
    if (prohibidos.includes(e.key)) {
        e.preventDefault();
        feedback.textContent = `Carácter "${e.key}" denegado. Solo enteros.`;
        return;
    }
    if (e.key === 'Enter') procesar();
});

document.getElementById('btnRefreshHistory').addEventListener('click', cargarHistorial);

resetBtn.addEventListener('click', () => {
    lista = [];
    editIdx = null;
    input.value = "";
    feedback.textContent = "";
    btnAdd.textContent = "Agregar";
    btnAdd.className = "btn btn-primary fw-bold";
    updateUI();
});

// --- PERSISTENCIA POST ---
document.getElementById('saveBtn').addEventListener('click', async () => {
    const msg = document.getElementById('msg');
    msg.textContent = "Guardando reporte...";
    msg.className = "text-muted small mt-2";

    try {
        const res = await fetch('/guardar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ datos: lista })
        });

        if (!res.ok) throw new Error();
        const data = await res.json();

        msg.className = "text-success small fw-bold mt-2";
        msg.textContent = "✅ Reporte auditado en /date";

        // Lanzar descarga directa automática
        window.location.href = `/descargar-historial?file=${encodeURIComponent(data.fileName)}`;
        
        // Refrescar automáticamente la tabla sin recargar la web
        setTimeout(cargarHistorial, 400);
    } catch {
        msg.className = "text-danger small mt-2";
        msg.textContent = "❌ Error en el almacenamiento.";
    }
});

// --- COMPORTAMIENTO SECUNDARIO INTERFAZ ---
window.onscroll = () => {
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        btnTop.style.display = "flex";
    } else {
        btnTop.style.display = "none";
    }
};
btnTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

document.getElementById('themeBtn').addEventListener('click', () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
});

// Arrancar vistas
updateUI();
cargarHistorial();