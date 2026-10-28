document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 🔄 NAVEGACIÓN POR SELECTOR NATIVO (MÓVIL)
    // ==========================================
    const selector = document.getElementById('component-selector');
    if (selector) {
        selector.addEventListener('change', (e) => {
            window.location.href = e.target.value;
        });
    }

    // ==========================================
    // 🌗 MODO OSCURO NATIVO
    // ==========================================
    const themeToggleBtns = document.querySelectorAll('.theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-bs-theme', savedTheme);

    themeToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    });

    // ==========================================
    // ⚡ INTERACCIONES DE LOS COMPONENTES (1 al 5)
    // ==========================================

    // Comp 1: Mouse
    const mouseBox = document.getElementById('mouse-box');
    const mouseLog = document.getElementById('mouse-log');
    if (mouseBox && mouseLog) {
        mouseBox.addEventListener('click', () => mouseLog.textContent = '🖱️ Click Simple detectado.');
        mouseBox.addEventListener('dblclick', () => mouseLog.textContent = '💥 ¡Doble Click detectado!');
        mouseBox.addEventListener('mouseenter', () => mouseBox.style.transform = 'scale(1.01)');
        mouseBox.addEventListener('mouseleave', () => mouseBox.style.transform = 'scale(1)');
    }

    // Comp 2: Teclado
    const keyInput = document.getElementById('key-input');
    const keyLog = document.getElementById('key-log');
    if (keyInput && keyLog) {
        keyInput.addEventListener('keydown', (e) => {
            keyLog.innerHTML = `Tecla: <span class="badge bg-primary">${e.key}</span> | Código: <code>${e.code}</code>`;
        });
    }

    // Comp 3: Formulario
    const sampleForm = document.getElementById('sample-form');
    const selectOpt = document.getElementById('select-opt');
    const formLog = document.getElementById('form-log');
    if (sampleForm && formLog) {
        if (selectOpt) {
            selectOpt.addEventListener('change', (e) => {
                formLog.className = "alert alert-info shadow-sm";
                formLog.textContent = `Cambio de opción: ${e.target.value}`;
            });
        }
        sampleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            formLog.className = "alert alert-info shadow-sm";
            formLog.innerHTML = `🚀 Datos enviados con éxito: <strong>${selectOpt ? selectOpt.value : ''}</strong>`;
        });
    }

    // Comp 4: Foco
    const focusInput = document.getElementById('focus-input');
    const focusLog = document.getElementById('focus-log');
    if (focusInput && focusLog) {
        focusInput.addEventListener('focus', () => {
            focusLog.innerHTML = '<span class="text-success">🟢 Input enfocado (focus).</span>';
        });
        focusInput.addEventListener('blur', () => {
            focusLog.innerHTML = '<span class="text-danger">🔴 Foco perdido (blur).</span>';
        });
    }

    // Comp 5: Scroll
    const scrollLog = document.getElementById('scroll-log');
    if (scrollLog) {
        window.addEventListener('scroll', () => {
            scrollLog.textContent = `Scroll: ${Math.round(window.scrollY)}px`;
        });
    }

    // ==========================================
    // 👨‍👦‍👦 PUNTO 3: CONTADOR DE ELEMENTOS HIJOS GLOBAL
    // ==========================================
    const btnCountNodes = document.querySelector('.btn-count-nodes');
    const targetComponent = document.querySelector('.target-component');
    const nodeCountDisplay = document.querySelector('.node-count-display');

    if (btnCountNodes && targetComponent && nodeCountDisplay) {
        btnCountNodes.addEventListener('click', () => {
            // .children cuenta exclusivamente etiquetas HTML hijas directas (nodos Element)
            const cantidadHijos = targetComponent.children.length; 
            nodeCountDisplay.classList.remove('d-none');
            nodeCountDisplay.innerHTML = `👨‍👦‍👦 Este componente tiene actualmente <span class="badge bg-success fs-6">${cantidadHijos}</span> elementos hijos directos en su estructura HTML.`;
        });
    }
});