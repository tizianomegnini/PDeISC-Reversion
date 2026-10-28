document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 🌗 MODO OSCURO / CLARO NATIVO DE BOOTSTRAP
    // ==========================================
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    updateToggleUI(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateToggleUI(newTheme);
    });

    function updateToggleUI(theme) {
        if (theme === 'dark') {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Modo Claro';
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Modo Oscuro';
        }
    }

    // ==========================================
    // 🧬 TEMPLATES HTML UNIFICADOS (AUTO-ADAPTATIVOS)
    // ==========================================
    const htmlTemplates = {
        card: `
<div class="card bg-body-secondary border text-body p-3 rounded-3 shadow-sm animate-fade">
    <div class="d-flex align-items-center gap-3">
        <div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold small" style="width: 40px; height: 40px;">ID</div>
        <div>
            <h6 class="m-0 fw-bold">Usuario Demostración</h6>
            <small class="text-body-secondary">Sesión controlada por Express</small>
        </div>
    </div>
</div>`,

        alert: `
<div class="alert alert-secondary border m-0 shadow-sm animate-fade text-body-emphasis" role="alert">
    ⚙️ <strong>Estructura Inyectada:</strong> Este bloque de texto plano se parseó mediante el uso de <code>innerHTML</code>.
</div>`,

        progress: `
<div class="p-3 bg-body-secondary border rounded-3 shadow-sm animate-fade">
    <div class="d-flex justify-content-between mb-1 text-body-secondary"><span class="small fw-semibold">Rendimiento global</span><span class="small fw-bold">60%</span></div>
    <div class="progress bg-body" style="height: 10px;">
        <div class="progress-bar bg-secondary" style="width: 60%"></div>
    </div>
</div>`,

        table: `
<div class="table-responsive border rounded shadow-sm animate-fade">
    <table class="table table-sm table-hover m-0 align-middle">
        <thead class="table-light text-secondary"><tr><th>ID</th><th>Módulo</th><th>Métrica</th></tr></thead>
        <tbody>
            <tr><td>#01</td><td class="text-body-secondary">Módulo ES Modules</td><td><span class="badge border text-body">Activo</span></td></tr>
            <tr><td>#02</td><td class="text-body-secondary">Inner HTML Inyector</td><td><span class="badge border text-body">Estable</span></td></tr>
        </tbody>
    </table>
</div>`,

        "badge-list": `
<div class="p-3 bg-body-secondary border rounded-3 shadow-sm d-flex flex-wrap gap-2 animate-fade">
    <span class="badge border text-body bg-body">#NodeJS</span>
    <span class="badge border text-body bg-body">#Express</span>
    <span class="badge border text-body bg-body">#JavaScript</span>
    <span class="badge border text-body bg-body">#ESModules</span>
    <span class="badge border text-body bg-body">#Bootstrap5</span>
</div>`
    };

    // ==========================================
    // 🕹️ PROCESAMIENTO RECOLECTOR
    // ==========================================
    const injectionZone = document.getElementById('injection-zone');
    const logContainer = document.getElementById('log-container');
    const btnClearDom = document.getElementById('btn-clear-dom');
    const injectButtons = document.querySelectorAll('.btn-inject');

    // Imprimir el código en el visor oscuro inferior
    const logHTMLCode = (pureHtmlString) => {
        if (logContainer.innerHTML.includes('Esperando flujos')) {
            logContainer.innerHTML = '';
        }
        
        const escapedHTML = pureHtmlString
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .trim();

        const logItem = document.createElement('pre');
        logItem.className = 'text-secondary-emphasis bg-black bg-opacity-25 p-2 rounded border border-secondary mb-2 overflow-x-auto style-code-block';
        logItem.innerHTML = `<code class="text-light-emphasis">${escapedHTML}</code>`;
        
        logContainer.appendChild(logItem);
        logContainer.scrollTop = logContainer.scrollHeight;
    };

    injectButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const objectKey = e.currentTarget.getAttribute('data-object');
            const template = htmlTemplates[objectKey];

            if (!template) return;

            const placeholder = document.getElementById('empty-placeholder');
            if (placeholder) placeholder.remove();

            // Inyección estricta mediante innerHTML
            const wrapper = document.createElement('div');
            wrapper.innerHTML = template; 
            
            injectionZone.appendChild(wrapper.firstElementChild);
            logHTMLCode(template); // Sin alertas ni bloqueos
        });
    });

    btnClearDom.addEventListener('click', () => {
        injectionZone.innerHTML = `
            <div id="empty-placeholder" class="text-body-secondary small text-center my-auto py-5">
                Zona vacía. Presioná un componente para estamparlo de manera fluida.
            </div>
        `;
        logContainer.innerHTML = `<span class="text-muted italic">> Esperando flujos...</span>`;
    });
    // ==========================================
    // 🚀 CONTROL DEL BOTÓN "VOLVER ARRIBA"
    // ==========================================
    const backToTopBtn = document.getElementById('btn-back-to-top');

    // Escuchar el evento de scroll en la ventana
    window.addEventListener('scroll', () => {
        // Si el scroll baja más de 300px, añade la clase para mostrarlo
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    // Acción de click para subir suavemente
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Scroll fluido nativo
        });
    });
});