/**
 * DIARIO HOY ARGENTINA - PORTAL DE NOTICIAS Y CONTACTO
 * Script principal: Gestión de plantilla (Dark/Light), UX Móvil, Validación Estricta y Scroll FX.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- MODE CONTROL ---
    // Cambiar a 'false' para activar los envíos reales a los servidores de EmailJS
    const SIMULAR_ENVIO = true; 

    // --- 1. CONFIGURACIÓN DEL TEMA CLARO/OSCURO ---
    const html = document.documentElement;
    const btnToggle = document.getElementById('btnThemeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');

    const temaGuardado = localStorage.getItem('theme');
    const prefiereOscuroSistema = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const temaInicial = temaGuardado || (prefiereOscuroSistema ? 'dark' : 'light');

    html.setAttribute('data-bs-theme', temaInicial);
    actualizarBotonTema(temaInicial);

    // Evita parpadeos visuales al cargar la página quitando la clase de bloqueo
    setTimeout(() => document.body.classList.remove('preload'), 80);

    function actualizarBotonTema(tema) {
        if (tema === 'dark') {
            themeIcon.className = 'bi bi-sun-fill';
            themeText.textContent = 'Modo Claro';
        } else {
            themeIcon.className = 'bi bi-moon-stars-fill';
            themeText.textContent = 'Modo Oscuro';
        }
    }

    btnToggle.addEventListener('click', () => {
        const nuevoTema = html.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-bs-theme', nuevoTema);
        localStorage.setItem('theme', nuevoTema);
        actualizarBotonTema(nuevoTema);
    });

    // --- 2. CIERRE AUTOMÁTICO DEL MENÚ MÓVIL ---
    const navbarCollapse = document.getElementById('menu');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbarCollapse.classList.contains('show')) {
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse) || new bootstrap.Collapse(navbarCollapse);
                bsCollapse.hide();
            }
        });
    });

    // --- 3. SELECCIÓN DE CAMPOS Y ELEMENTOS DEL FORMULARIO ---
    const nombreInput = document.getElementById('nombreInput');
    const emailInput = document.getElementById('emailInput');
    const mensajeInput = document.getElementById('mensajeInput');
    
    const form = document.getElementById('formulario');
    const btnEnviar = document.getElementById('btnEnviar');
    const spinner = document.getElementById('formSpinner');
    const msjExito = document.getElementById('confirmacion');
    const msjError = document.getElementById('errorEnvio');

    // --- 4. FILTROS EN TIEMPO REAL (HARDENING) ---
    nombreInput.addEventListener('keypress', (e) => {
        const regexLetrasYEspacios = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$/;
        if (!regexLetrasYEspacios.test(e.key)) {
            e.preventDefault(); 
        }
    });

    // --- 5. VALIDACIÓN LÓGICA Y PROCESAMIENTO ---
    const esEmailValido = (email) => {
        const regexDominiosPermitidos = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|net|org|edu|gob|ar|com\.ar|org\.ar|edu\.ar|gob\.ar)$/i;
        return regexDominiosPermitidos.test(email);
    };

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();

        msjExito.classList.add('d-none');
        msjError.classList.add('d-none');
        nombreInput.classList.remove('is-invalid');
        emailInput.classList.remove('is-invalid');
        mensajeInput.classList.remove('is-invalid');

        const nombreLimpio = nombreInput.value.trim();
        const emailLimpio = emailInput.value.trim();
        const mensajeLimpio = mensajeInput.value.trim();

        let esFormularioValido = true;

        if (nombreLimpio.length < 3) {
            nombreInput.classList.add('is-invalid');
            esFormularioValido = false;
        }

        if (!esEmailValido(emailLimpio)) {
            emailInput.classList.add('is-invalid');
            esFormularioValido = false;
        }

        if (mensajeLimpio.length < 10) {
            mensajeInput.classList.add('is-invalid');
            esFormularioValido = false;
        }

        if (!form.checkValidity() || !esFormularioValido) {
            form.classList.add('was-validated');
            return;
        }

        btnEnviar.disabled = true;
        spinner.classList.remove('d-none');

        const templateParams = {
            user_name: nombreLimpio,
            user_email: emailLimpio,
            message: mensajeLimpio
        };

        if (SIMULAR_ENVIO) {
            setTimeout(() => {
                finalizarFormulario(true);
            }, 2000);
        } else {
            emailjs.send('TU_SERVICE_ID', 'TU_TEMPLATE_ID', templateParams)
                .then(() => {
                    finalizarFormulario(true);
                }, (error) => {
                    console.error('Error crítico en el proveedor EmailJS:', error);
                    finalizarFormulario(false);
                });
        }
    });

    function finalizarFormulario(resultadoExitoso) {
        btnEnviar.disabled = false;
        spinner.classList.add('d-none');
        
        if (resultadoExitoso) {
            msjExito.classList.remove('d-none');
            form.reset();
            form.classList.remove('was-validated');
        } else {
            msjError.classList.remove('d-none');
        }
    }

    // --- 6. CONTROL DEL BOTÓN "VOLVER ARRIBA" ---
    const btnVolverArriba = document.getElementById('btnVolverArriba');

    /**
     * Evalúa la posición del scroll de la ventana.
     * Si el usuario baja más de 300px, el botón aparece suavemente gracias al CSS.
     */
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btnVolverArriba.classList.add('mostrar');
        } else {
            btnVolverArriba.classList.remove('mostrar');
        }
    });

    /**
     * Retorna la ventana al punto inicial (0,0) con una animación suave de scroll.
     */
    btnVolverArriba.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});