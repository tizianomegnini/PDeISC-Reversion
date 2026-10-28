/**
 * PROYECTO: ANALIZADOR DE DATOS PRO (CON HISTORIAL)
 */

const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const errorFeedback = document.getElementById('errorFeedback');
const errorText = document.getElementById('errorText');
const resultados = document.getElementById('resultados');
const resetBtn = document.getElementById('resetBtn');
const themeBtn = document.getElementById('themeBtn');
const btnTop = document.getElementById('scrollToTop');
const historialLista = document.getElementById('historialLista');
const btnRefreshHistory = document.getElementById('btnRefreshHistory');

window.reporteFinal = ""; 

const esFormatoValido = (s) => {
    if (s.includes(',')) return false;
    return /^\d+(\.\d+)?$/.test(s);
};

const esFactorial = (num) => {
    if (num < 1 || !Number.isInteger(num)) return false;
    let res = 1, i = 1;
    while (res < num) { i++; res *= i; }
    return res === num;
};

const obtenerRaizFactorial = (n) => {
    let res = 1, i = 1;
    while (res < n) { i++; res *= i; }
    return `${i}!`;
};

const gestionarError = (mensaje) => {
    errorText.textContent = mensaje;
    errorFeedback.classList.remove('d-none');
    fileInput.value = ""; 
    setTimeout(() => errorFeedback.classList.add('d-none'), 5000);
};

// --- NUEVA FUNCIÓN: CARGAR HISTORIAL DESDE EL SERVIDOR ---
const cargarHistorial = async () => {
    if (!historialLista) return;
    try {
        const res = await fetch('/historial');
        const archivos = await res.json();
        
        if (archivos.length === 0) {
            historialLista.innerHTML = `<p class="small text-muted fst-italic mb-0 py-2">No hay reportes archivados en el servidor todavía.</p>`;
            return;
        }

        // 🔍 Busca esta línea dentro de cargarHistorial en app.js:
historialLista.innerHTML = `
    <table class="history-table">  <thead>
            <tr>
                <th>Nombre del Reporte</th>
                <th>Fecha de Registro</th>
                <th class="text-end">Acción</th>
            </tr>
        </thead>
        <tbody>
            ${archivos.map(file => {
                const dateFormatted = new Date(file.date).toLocaleString('es-ES', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
                return `
                    <tr>
                        <td class="font-monospace text-truncate" style="max-width: 220px;">
                            <span class="text-primary me-1">📄</span> ${file.name}
                        </td>
                        <td class="text-muted">${dateFormatted}</td>
                        <td class="text-end">
                            <a href="/descargar-historial?file=${encodeURIComponent(file.name)}" 
                               class="btn-download-history">
                                Bajar
                            </a>
                        </td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    </table>

        `;
    } catch (err) {
        console.error("Error cargando historial:", err);
        historialLista.innerHTML = `<p class="small text-danger mb-0 py-2">Error de conexión con el repositorio.</p>`;
    }
};

const renderizarResultados = (utiles, noUtil, facts, total) => {
    document.getElementById('placeholderUI')?.classList.add('d-none');
    dropZone.classList.add('disabled');
    document.getElementById('uploadUI').classList.add('d-none');
    document.getElementById('successUI').classList.remove('d-none');
    
    resetBtn.classList.remove('d-none');
    resultados.classList.remove('d-none');

    document.getElementById('contUtil').textContent = utiles.length;
    document.getElementById('contNoUtil').textContent = noUtil;
    
    const totalReal = total || 1;
    document.getElementById('percUtil').textContent = ((utiles.length / totalReal) * 100).toFixed(1) + "%";
    document.getElementById('contFact').textContent = facts.length;

    utiles.sort((a, b) => parseFloat(a) - parseFloat(b));
    const listaUtiles = document.getElementById('listaFiltrada');
    listaUtiles.innerHTML = utiles.map((n, idx) => {
        const valorNumerico = parseFloat(n);
        const isFact = !n.includes('.') && facts.includes(valorNumerico);
        return `<span class="badge ${isFact ? 'bg-success' : 'bg-primary'} p-2 border shadow-sm badge-anim" style="animation-delay: ${idx * 0.03}s">${n} ${isFact ? '⭐' : ''}</span>`;
    }).join('') || '<small class="text-muted">Ninguno.</small>';

    const factsUnicos = [...new Set(facts)].sort((a, b) => a - b);
    const listaFacts = document.getElementById('listaFactoriales');
    listaFacts.innerHTML = factsUnicos.map(n => `<span class="badge bg-dark text-success border border-success p-2 badge-anim">${n} <small class="text-white-50">(${obtenerRaizFactorial(n)})</small></span>`).join('') || '<small class="text-muted">Ninguno.</small>';

    window.reporteFinal = `REPORTE DE AUDITORÍA MATEMÁTICA\n=================================\n` +
        `Fecha de Escaneo: ${new Date().toLocaleString()}\n` +
        `Total de Elementos Analizados: ${totalReal}\n` +
        `Números Espejo Útiles: ${utiles.length} [${utiles.join(', ')}]\n` +
        `Factoriales Encontrados: ${factsUnicos.length} [${factsUnicos.join(', ')}]`;

    // Cargamos el historial apenas se pinten los resultados actuales
    cargarHistorial();
};

const procesarArchivo = (archivo) => {
    if (!archivo.name.toLowerCase().endsWith('.txt')) {
        gestionarError(`El archivo "${archivo.name}" no es válido.`);
        return;
    }
    const lector = new FileReader();
    lector.onload = (e) => {
        const tokens = e.target.result.split(/\s+/);
        let utiles = [], noUtiles = 0, factoriales = [], contadorTotal = 0;

        tokens.forEach(t => {
            const token = t.trim();
            if (token === "") return;
            contadorTotal++;
            if (esFormatoValido(token)) {
                if (token.length >= 2 && token[0] === token[token.length - 1]) utiles.push(token);
                else noUtiles++;
                if (!token.includes('.')) {
                    const n = parseInt(token);
                    if (esFactorial(n)) factoriales.push(n);
                }
            } else noUtiles++;
        });

        if (contadorTotal === 0) {
            gestionarError("El archivo está vacío.");
            return;
        }
        renderizarResultados(utiles, noUtiles, factoriales, contadorTotal);
    };
    lector.readAsText(archivo);
};

// --- EVENTOS ---
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) procesarArchivo(file);
});
resetBtn.addEventListener('click', () => location.reload());
btnRefreshHistory.addEventListener('click', cargarHistorial);

document.getElementById('btnExportar').addEventListener('click', async () => {
    if (!window.reporteFinal) return;
    try {
        const res = await fetch('/exportar-filtrado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reporte: window.reporteFinal })
        });
        const blob = await res.blob();
        
        // Simular clic de descarga local para el usuario
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `auditoria_${Date.now()}.txt`;
        a.click();

        // REFRESCAR HISTORIAL: Como el servidor acaba de guardar un archivo nuevo, actualizamos la lista en vivo
        setTimeout(cargarHistorial, 400);
    } catch (err) {
        console.error("Error al exportar:", err);
    }
});

// --- TEMA ---
const temaGuardado = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', temaGuardado);
themeBtn.addEventListener('click', () => {
    const actual = document.documentElement.getAttribute('data-theme');
    const nuevo = actual === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nuevo);
    localStorage.setItem('theme', nuevo);
});