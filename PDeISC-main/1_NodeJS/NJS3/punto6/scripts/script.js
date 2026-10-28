document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 🌗 MODO OSCURO / CLARO CONTROLADO
    // ==========================================
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
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
        } else {
            themeIcon.textContent = '🌙';
        }
    }

    // ==========================================
    // 📋 REGISTRO, CAPTURA Y VALIDACIONES
    // ==========================================
    const registerForm = document.getElementById('register-form');
    const usersContainer = document.getElementById('users-container');
    const logContainer = document.getElementById('log-container');
    
    // Captura del input de edad para el bloqueo preventivo
    const regAgeInput = document.getElementById('reg-age');

    let userCounter = 0;

    // Consola de Logs unificada libre de alerts
    const addLog = (message, type = 'info') => {
        if (logContainer.innerHTML.includes('Esperando envíos')) {
            logContainer.innerHTML = '';
        }
        const colorMap = { info: '#0dcaf0', success: '#198754', warning: '#ffc107' };
        const logItem = document.createElement('div');
        logItem.style.color = colorMap[type];
        logItem.className = 'mb-1 border-bottom border-secondary pb-1 small';
        logItem.innerHTML = `> ${message}`;
        logContainer.appendChild(logItem);
        logContainer.scrollTop = logContainer.scrollHeight;
    };

    // 🛑 FILTRO DE TECLADO: Bloquear la 'e', 'E', puntos, comas y signos en la Edad
    regAgeInput.addEventListener('keydown', (e) => {
        const invalidChars = ['e', 'E', '.', ',', '-', '+'];
        if (invalidChars.includes(e.key)) {
            e.preventDefault(); // Cancela la pulsación de la tecla inmediatamente
        }
    });

    // ESCUCHADOR PRINCIPAL DEL FORMULARIO
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault(); 

        // Captura de valores limpios (sin espacios extra al principio o final)
        const nameVal = document.getElementById('reg-name').value.trim();
        const ageVal = document.getElementById('reg-age').value.trim();
        const emailVal = document.getElementById('reg-email').value.trim();
        const countryVal = document.getElementById('reg-country').value;
        
        const modeRadio = document.querySelector('input[name="reg-mode"]:checked');
        const modeVal = modeRadio ? modeRadio.value : 'No especificado';
        
        const newsletterChecked = document.getElementById('reg-newsletter').checked;
        const newsletterVal = newsletterChecked ? 'Suscrito' : 'No suscrito';

        // ==========================================
        // 🛡️ VALIDACIONES CORPORATIVAS STRICTAS
        // ==========================================
        
        // 1. Validar Nombre: Solo letras (incluye acentos y ñ) y mínimo 3 caracteres
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
        
        if (nameVal.length < 3) {
            addLog('⚠️ VALIDACIÓN RECHAZADA: El nombre debe tener al menos 3 letras.', 'warning');
            return;
        }
        if (!nameRegex.test(nameVal)) {
            addLog('⚠️ VALIDACIÓN RECHAZADA: El nombre solo puede contener letras y espacios.', 'warning');
            return;
        }

        // 2. Validar Edad: Entero positivo coherente
        if (!ageVal || parseInt(ageVal) <= 0 || parseInt(ageVal) > 120) {
            addLog('⚠️ VALIDACIÓN RECHAZADA: Ingresa una edad válida entre 1 y 120 años.', 'warning');
            return;
        }

        // 3. Validar Email Avanzado: Soporta múltiples subdominios (.com, .com.ar, .edu.pe, .net, etc.)
        // Estructura: texto + @ + texto + . + extensión de mínimo 2 letras (y opcionalmente otra extensión)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$/;
        
        if (!emailRegex.test(emailVal)) {
            addLog('⚠️ VALIDACIÓN RECHAZADA: Estructura de correo electrónico inválida (ejemplo correcto: usuario@dominio.com o .com.ar).', 'warning');
            return;
        }

        // 4. Validar Select de País
        if (!countryVal) {
            addLog('⚠️ VALIDACIÓN RECHAZADA: Por favor, selecciona un país de residencia.', 'warning');
            return;
        }

        // ==========================================
        // 🎉 ÉXITO: TODO COMPROBADO, RENDERIZAMOS
        // ==========================================
        userCounter++;

        const placeholder = document.getElementById('empty-placeholder');
        if (placeholder) placeholder.remove();

        const userCard = document.createElement('div');
        userCard.className = 'card bg-body-secondary border text-body p-3 rounded-3 shadow-sm animate-fade';
        
        userCard.innerHTML = `
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                    <h6 class="fw-bold m-0">👤 ${nameVal} <span class="text-body-secondary small fw-normal">(${ageVal} años)</span></h6>
                    <small class="text-body-secondary d-block mt-1">📧 <b>Email:</b> ${emailVal}</small>
                    <small class="text-body-secondary d-block">📍 <b>Origen:</b> ${countryVal}</small>
                    <div class="mt-2 d-flex flex-wrap gap-1">
                        <span class="badge border bg-body text-body small">💼 ${modeVal}</span>
                        <span class="badge border bg-body text-body small">🔔 Alertas: ${newsletterVal}</span>
                    </div>
                </div>
                <span class="badge bg-secondary text-white rounded-pill px-2 py-1 small">ID #${userCounter}</span>
            </div>
        `;

        usersContainer.appendChild(userCard);
        addLog(`[Usuario #${userCounter} Guardado] Pasó todos los filtros. Registrado con éxito.`, 'success');

        // Resetear formulario y forzar valores por defecto estables
        registerForm.reset();
        document.getElementById('mode-remote').checked = true; 
    });

    // ==========================================
    // 🚀 CONTROL DEL BOTÓN "VOLVER ARRIBA"
    // ==========================================
    const backToTopBtn = document.getElementById('btn-back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});