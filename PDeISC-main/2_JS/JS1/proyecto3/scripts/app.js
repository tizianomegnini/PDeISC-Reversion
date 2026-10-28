/**
 * ==============================================================================
 * SISTEMA DE GESTIÓN DE EMPLEADOS - CONFIGURACIÓN Y PERSISTENCIA
 * ==============================================================================
 */

// La clave única utilizada para identificar nuestros datos en el localStorage
const DB_KEY = "db_empresa_x_final";

// Recuperar los datos del localStorage. Si no existen, inicializa un array vacío.
let empleados = JSON.parse(localStorage.getItem(DB_KEY)) || [];

// Referencias a los elementos principales del DOM para interactuar con la interfaz
const form = document.getElementById("formEmpresa");
const lista = document.getElementById("listaEmpleados");
const totalDisplay = document.getElementById("total");

/* ==============================================================================
   UTILIDADES (Funciones de apoyo)
============================================================================== */

/** Elimina espacios en blanco al inicio y final de una cadena de texto */
const cleanText = (txt) => txt.trim();

/** Valida un email usando una Expresión Regular básica */
const validateEmail = (mail) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail);

/** Calcula la edad exacta comparando la fecha de nacimiento con la fecha actual */
const calcularEdad = (fechaNac) => {
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();

  // Ajuste si el cumpleaños aún no ocurre en el año actual
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

/* ==============================================================================
   SISTEMA DE ERRORES INLINE (Validación visual)
============================================================================== */

/** Muestra un mensaje de error debajo del campo indicado */
const showError = (fieldId, msg) => {
  clearError(fieldId); // Limpiar error previo
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.add("is-invalid"); // Clase de Bootstrap para borde rojo
  const div = document.createElement("div");
  div.className = "invalid-feedback d-block";
  div.id = `error-${fieldId}`;
  div.textContent = msg;

  field.parentElement.appendChild(div); // Insertar mensaje en el DOM
};

/** Elimina el estado de error visual de un campo específico */
const clearError = (fieldId) => {
  const field = document.getElementById(fieldId);
  if (field) field.classList.remove("is-invalid");

  const prev = document.getElementById(`error-${fieldId}`);
  if (prev) prev.remove();
};

/** Limpia todos los mensajes de error del formulario antes de una nueva validación */
const clearAllErrors = () => {
  form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
  form.querySelectorAll(".invalid-feedback").forEach(el => el.remove());
};

/* ==============================================================================
   FILTROS DE ENTRADA (Validación en tiempo real)
============================================================================== */

/** Restringe qué teclas puede presionar el usuario en un input según una RegEx */
const setFilter = (id, regex) => {
  document.getElementById(id)?.addEventListener("keypress", (e) => {
    if (!regex.test(e.key)) e.preventDefault();
  });
};

// Aplicación de filtros para evitar caracteres inválidos en campos numéricos o nombres
setFilter("nombre",       /^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$/);
setFilter("apellido",     /^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$/);
setFilter("nacionalidad", /^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$/);
setFilter("dni",          /^[0-9]+$/);
setFilter("cuit",         /^[0-9]+$/);
setFilter("tel",          /^[0-9+ ]+$/);
setFilter("edad",         /^[0-9]+$/);
setFilter("cantHijos",    /^[0-9]+$/);

/* ==============================================================================
   VALIDACIÓN CRUZADA (Edad vs. Fecha Nacimiento)
============================================================================== */

/** Sincroniza el campo edad con la fecha de nacimiento ingresada */
const validarEdadNacimiento = () => {
  const edadInput = document.getElementById("edad");
  const nacInput  = document.querySelector("[name='nacimiento']");

  if (!edadInput.value || !nacInput.value) return;

  const edadIngresada = parseInt(edadInput.value);
  const edadReal      = calcularEdad(nacInput.value);

  if (edadIngresada !== edadReal) {
    showError("edad", `La edad no coincide con la fecha de nacimiento (debería ser ${edadReal}).`);
  } else {
    clearError("edad");
  }
};

// Listeners para ejecutar la validación al cambiar cualquiera de los dos campos
document.getElementById("edad")?.addEventListener("change", validarEdadNacimiento);
document.querySelector("[name='nacimiento']")?.addEventListener("change", validarEdadNacimiento);

/* ==============================================================================
   LÓGICA DE INTERFAZ (Campo hijos)
============================================================================== */

/** Muestra u oculta el campo de cantidad de hijos dinámicamente */
form.addEventListener("change", (e) => {
  if (e.target.name === "hijos") {
    const mostrar = e.target.value === "Si";
    document.getElementById("inputCantHijos").style.display = mostrar ? "block" : "none";

    // Si elige "No", reseteamos la cantidad a 0 para mantener consistencia
    if (!mostrar) {
      document.getElementById("cantHijos").value = "0";
      clearError("cantHijos");
    }
  }
});

/* ==============================================================================
   PROCESAMIENTO DEL FORMULARIO (Submit)
============================================================================== */

form.addEventListener("submit", (e) => {
  e.preventDefault(); // Evita que la página se recargue
  clearAllErrors();

  // Recolectar datos del form en un objeto
  const data = Object.fromEntries(new FormData(form).entries());

  // Limpieza inicial de strings
  data.nombre       = cleanText(data.nombre);
  data.apellido     = cleanText(data.apellido);
  data.mail         = cleanText(data.mail).toLowerCase();
  data.dni          = cleanText(data.dni);
  data.cuit         = cleanText(data.cuit);
  data.nacionalidad = cleanText(data.nacionalidad);

  const edad      = parseInt(data.edad);
  const cantHijos = parseInt(data.cantidadHijos) || 0;
  let hayError    = false;

  // --- BLOQUE DE VALIDACIONES ---
  if (!data.nombre) { showError("nombre", "El nombre es obligatorio."); hayError = true; }
  if (!data.apellido) { showError("apellido", "El apellido es obligatorio."); hayError = true; }
  
  if (!data.edad || isNaN(edad) || edad < 18 || edad > 80) {
    showError("edad", "La edad debe estar entre 18 y 80 años.");
    hayError = true;
  } else if (data.nacimiento) {
    const edadReal = calcularEdad(data.nacimiento);
    if (edad !== edadReal) {
      showError("edad", `La edad no coincide con la fecha de nacimiento (debería ser ${edadReal}).`);
      hayError = true;
    }
  }
  // Validaciones
  //nacimiento
  if (!data.nacimiento) 
    { showError("nacimiento", "La fecha de nacimiento es obligatoria."); 
      ayError = true; }
  //dni
  if (!data.dni || data.dni.length !== 8) 
    { showError("dni", "El DNI debe tener exactamente 8 dígitos."); 
      hayError = true; }
  //cuit
  if (!data.cuit || data.cuit.length !== 11) 
    { showError("cuit", "El CUIT debe tener exactamente 11 dígitos."); 
      hayError = true; }
  //mail
  if (!data.mail || !validateEmail(data.mail)) 
    { showError("mail", "Ingresá un email válido."); 
      hayError = true; }
  //telefono
  if (!data.telefono) 
    { showError("tel", "El teléfono es obligatorio."); 
      hayError = true; }
  //nacionalidad
  if (!data.nacionalidad)  
    { showError("nacionalidad", "La nacionalidad es obligatoria."); 
      hayError = true; }
  //hijos
  if (data.hijos === "Si") {
  // Verificamos si el número es inválido (no es número, es menor a 1 o mayor a 70)
  if (isNaN(cantHijos) || cantHijos < 1 || cantHijos > 70) {
    showError("cantHijos", "La cantidad debe ser entre 1 y 70.");
    hayError = true;
  }
}

  // Validación de duplicados (evita repetir registros existentes)
  if (data.dni && empleados.some(emp => emp.dni === data.dni)) { showError("dni", "Ya existe un empleado con ese DNI."); hayError = true; }
  if (data.mail && empleados.some(emp => emp.mail === data.mail)) { showError("mail", "Ese email ya está registrado."); hayError = true; }
  if (data.cuit && empleados.some(emp => emp.cuit === data.cuit)) { showError("cuit", "Ese CUIT ya existe."); hayError = true; }

  if (hayError) return; // Si hay errores, detenemos el proceso

  // --- PERSISTENCIA Y LIMPIEZA ---
  data.cantidadHijos = data.hijos === "Si" ? cantHijos : 0;
  empleados.push(data); // Agregamos al array global
  localStorage.setItem(DB_KEY, JSON.stringify(empleados)); // Guardamos en localStorage

  // Reseteo de UI
  form.reset();
  clearAllErrors();
  document.getElementById("inputCantHijos").style.display = "none";
  render(); // Actualizamos la vista
});

/* ==============================================================================
   RENDERIZADO (Visualización de datos)
============================================================================== */

/** Limpia la lista actual y redibuja todas las tarjetas (cards) de empleados */
function render() {
  lista.innerHTML = "";
  totalDisplay.innerText = empleados.length;

  empleados.forEach(emp => {
    lista.innerHTML += `
    <div class="col-12 col-md-6">
      <div class="card employee-card p-3 shadow-sm border-secondary h-100">
        <div class="d-flex justify-content-between border-bottom border-secondary pb-2 mb-2">
          <h6 class="fw-bold m-0 text-white small">
            ${emp.nombre.toUpperCase()} ${emp.apellido.toUpperCase()}
          </h6>
          <i class="bi bi-person-badge text-primary"></i>
        </div>

        <div class="row g-2">
          <div class="col-6">
            <label class="data-label d-block">Documento / CUIT</label>
            <span>${emp.dni}</span>
            <span class="text-info d-block" style="font-size:0.75rem">${emp.cuit}</span>
          </div>

          <div class="col-6">
            <label class="data-label d-block">Edad / Nac.</label>
            <span>${emp.edad} (${emp.nacimiento})</span>
          </div>

          <div class="col-6">
            <label class="data-label d-block">Civil / Sexo</label>
            <span class="text-capitalize">${emp.estadocivil} / ${emp.sexo}</span>
          </div>

          <div class="col-6">
            <label class="data-label d-block">Nacionalidad</label>
            <span>${emp.nacionalidad}</span>
          </div>

          <div class="col-12">
            <label class="data-label d-block">Contacto</label>
            <span class="d-block"><i class="bi bi-telephone"></i> ${emp.telefono}</span>
            <span class="d-block"><i class="bi bi-envelope"></i> ${emp.mail}</span>
          </div>

          <div class="col-12 mt-1">
            <span class="badge ${emp.hijos === 'Si' ? 'bg-primary' : 'bg-dark border border-secondary text-secondary'} w-100">
              HIJOS: ${emp.hijos === 'Si' ? emp.cantidadHijos : 'NINGUNO'}
            </span>
          </div>
        </div>
      </div>
    </div>
    `;
  });
}
// Reemplaza tu bloque actual de evento click por este:
document.getElementById('themeBtn').addEventListener('click', () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-bs-theme');
    html.setAttribute('data-bs-theme', currentTheme === 'dark' ? 'light' : 'dark');
});
// Renderizado inicial al cargar la página
render();