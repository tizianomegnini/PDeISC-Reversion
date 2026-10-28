/**
 * --- CONFIGURACIÓN Y REFERENCIAS ---
 */
const form = document.getElementById("form");

/**
 * --- LIMPIEZA AUTOMÁTICA DE ERRORES AL ESCRIBIR ---
 * Asigna eventos para resetear validaciones al interactuar con los inputs.
 */
form.querySelectorAll("input, select").forEach(el => {
    el.addEventListener("input", () => {
        el.setCustomValidity("");
        el.classList.remove("is-invalid");
    });
});

/**
 * --- SUBMIT DEL FORMULARIO ---
 * Maneja la lógica de envío asíncrono.
 * NOTA: Aquí se utiliza el MÉTODO 3 (el más moderno y eficiente).
 */
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Limpiar errores previos
    form.querySelectorAll("input, select").forEach(i => i.setCustomValidity(""));

    // Validación nativa
    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }

    // --- LECTURA DE DATOS (MÉTODO 3: FormData + Object.fromEntries) ---
    const data = Object.fromEntries(new FormData(form));

    // 3. Verificación de duplicados
    const resCheck = await fetch("/usuarios");
    const usuarios = await resCheck.json();

    const duplicado = usuarios.find(u => 
        u.dni === data.dni || 
        u.cuil === data.cuil || 
        u.cbu === data.cbu
    );

    if (duplicado) {
        let campoErroneo = duplicado.dni === data.dni ? "dni" : 
                           (duplicado.cuil === data.cuil ? "cuil" : "cbu");
        
        const inputErroneo = document.getElementById(campoErroneo);
        
        inputErroneo.setCustomValidity("Este dato ya se encuentra registrado.");
        inputErroneo.classList.add("is-invalid");
        form.classList.add("was-validated");
        
        const feedback = inputErroneo.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = `Este ${campoErroneo.toUpperCase()} ya está en uso.`;
        }
        return;
    }

    // 4. Envío al servidor
    await fetch("/agregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    form.reset();
    form.classList.remove("was-validated");
    cargarUsuarios();
});

/**
 * --- DEMOSTRACIÓN DE LAS 3 FORMAS DE LECTURA ---
 * Úsalo para explicarle al profesor las alternativas.
 */
function demostrarLecturas() {
    // MÉTODO 1: Acceso Manual (Id por Id)
    const manual = {
        nombre: document.getElementById("nombre")?.value,
        dni: document.getElementById("dni")?.value
    };
    console.log("Forma 1 (Manual):", manual);

    // MÉTODO 2: Bucle sobre form.elements
    const coleccion = {};
    for (let campo of form.elements) {
        if (campo.name) coleccion[campo.name] = campo.value;
    }
    console.log("Forma 2 (form.elements):", coleccion);

    // MÉTODO 3: FormData 
    const moderno = Object.fromEntries(new FormData(form));
    console.log("Forma 3 (FormData):", moderno);
}

/**
 * --- RENDERIZADO COMPLETO ---
 */
async function cargarUsuarios() {
    const res = await fetch("/usuarios");
    const data = await res.json();
    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    if (data.length === 0) {
        lista.innerHTML = `<div class="col-12 text-center py-5 text-muted">No hay registros cargados.</div>`;
        return;
    }

    data.forEach(u => {
        const monto = Number(u.monto).toLocaleString("es-AR", { minimumFractionDigits: 2 });
        lista.innerHTML += `
            <div class="col-12 col-xl-6">
                <div class="account-card p-3 border rounded shadow-sm mb-3">
                    <h5 class="fw-bold text-success">${u.apellido}, ${u.nombre}</h5>
                    <hr class="my-2">
                    <div class="row g-2 small">
                        <div class="col-6"><b>DNI:</b> ${u.dni}</div>
                        <div class="col-6"><b>CUIL:</b> ${u.cuil}</div>
                        <div class="col-6"><b>Tel:</b> ${u.telefono}</div>
                        <div class="col-6"><b>Nac:</b> ${u.fechaNacimiento}</div>
                        <div class="col-12"><b>Email:</b> ${u.email}</div>
                        <div class="col-12"><b>CBU:</b> <span class="text-warning font-monospace">${u.cbu}</span></div>
                        <div class="col-6"><b>Tipo:</b> ${u.tipo}</div>
                        <div class="col-6"><b>Origen:</b> ${u.origenFondos}</div>
                    </div>
                    <div class="mt-3 text-end">
                        <small class="text-muted d-block">SALDO DISPONIBLE</small>
                        <span class="h4 text-success">$ ${monto}</span>
                    </div>
                </div>
            </div>`;
    });
}

/**
 * --- UTILIDADES ---
 */
document.getElementById('themeBtn').addEventListener('click', () => {
    const html = document.documentElement;
    html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

const scrollTopBtn = document.getElementById("scrollTopBtn");
const mainContentPanel = document.querySelector(".main-content");
const controlarScroll = () => scrollTopBtn.classList.toggle("show", (mainContentPanel.scrollTop || window.scrollY) > 300);
mainContentPanel.addEventListener("scroll", controlarScroll);
window.addEventListener("scroll", controlarScroll);
scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// Carga inicial
cargarUsuarios();