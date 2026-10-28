const API = "http://localhost:3000/alumnos";
let idAEliminar = null;
const modal = new bootstrap.Modal(document.getElementById('deleteModal'));

// Alternar tema
document.getElementById('btnTheme').addEventListener('click', () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-bs-theme');
    html.setAttribute('data-bs-theme', current === 'dark' ? 'light' : 'dark');
});

// Función global para mostrar alertas
function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} show`;
    toast.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Cargar datos
async function cargar() {
    try {
        const res = await fetch(API, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'get' }) });
        const data = await res.json();
        const tabla = document.getElementById('tabla');
        tabla.innerHTML = data.map(a => `
            <tr>
                <td class="ps-3">${a.id}</td>
                <td>${a.nombre}</td>
                <td>${a.apellido}</td>
                <td>${a.edad}</td>
                <td class="text-end pe-3">
                    <button class="btn btn-outline-danger btn-sm btn-action" data-id="${a.id}">Eliminar</button>
                </td>
            </tr>`).join('');
    } catch (e) { showToast('Error al conectar con la API', 'danger'); }
}

// Evento para eliminar (Delegación de eventos)
document.getElementById('tabla').addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-action')) {
        const id = e.target.getAttribute('data-id');
        idAEliminar = id;
        modal.show();
    }
});

// Guardar nuevo con validaciones reforzadas
document.getElementById('formAlumno').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const edad = parseInt(document.getElementById('edad').value);

    // Regex: Permite letras con tildes, ñ y el apóstrofe (ej: O'Connor)
    const patronNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ'\s]+$/;

    // 1. Validación de formato de texto
    if (!patronNombre.test(nombre) || !patronNombre.test(apellido)) {
        return showToast('El nombre y apellido no deben contener números ni símbolos especiales (solo letras y \')', 'danger');
    }

    // 2. Validación de longitud
    if (nombre.length < 2 || apellido.length < 2) {
        return showToast('El nombre y apellido deben tener al menos 2 caracteres', 'warning');
    }

    // 3. Validación de rango de edad
    if (isNaN(edad) || edad < 1 || edad > 120) {
        return showToast('La edad debe ser un número entre 1 y 120', 'warning');
    }
    
    try {
        await fetch(API, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ action: 'add', nombre, apellido, edad }) 
        });
        
        document.getElementById('formAlumno').reset();
        showToast('Alumno registrado correctamente');
        cargar();
    } catch (error) {
        showToast('Error al guardar en el servidor', 'danger');
    }
});

// Confirmar eliminación
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    await fetch(API, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ action: 'delete', id: idAEliminar }) 
    });
    modal.hide();
    showToast('Alumno eliminado');
    cargar();
});

cargar();