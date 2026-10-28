let imagenActual = null;
let estadoTexto = true;

// 🎨 Paleta de colores planos modernos
const colores = ["#ff4d4d", "#3399ff", "#2ed573", "#ffa502", "#9b59b6", "#ff6b81"];

function imagenRandom() {
    return `https://picsum.photos/500/400?random=${Math.floor(Math.random() * 1000)}`;
}

// Cambiar entre temas de Bootstrap 5.3
function toggleTema() {
    const html = document.documentElement;
    const botonTema = document.getElementById("toggleTema");
    
    if (html.getAttribute("data-bs-theme") === "dark") {
        html.setAttribute("data-bs-theme", "light");
        botonTema.innerText = "🌙 Modo Oscuro";
        botonTema.classList.replace("btn-outline-secondary", "btn-outline-dark");
    } else {
        html.setAttribute("data-bs-theme", "dark");
        botonTema.innerText = "☀️ Modo Claro";
        botonTema.classList.replace("btn-outline-dark", "btn-outline-secondary");
    }
}

function agregarH1() {
    document.getElementById("titulo").innerText = "Hola DOM";
    
    const btnTexto = document.getElementById("btnAgregarH1");
    btnTexto.disabled = true;
    btnTexto.innerText = "📝 Texto Agregado";
}

function cambiarTexto() {
    const titulo = document.getElementById("titulo");
    estadoTexto = !estadoTexto;
    titulo.innerText = estadoTexto ? "Hola DOM" : "Chau DOM";
}

function cambiarColor() {
    const titulo = document.getElementById("titulo");
    const color = colores[Math.floor(Math.random() * colores.length)];
    titulo.style.color = color;
}

function agregarImagen() {
    const contenedor = document.getElementById("contenedorImagen");

    if (!imagenActual) {
        imagenActual = document.createElement("img");
        imagenActual.src = imagenRandom();
        imagenActual.classList.add("img-fluid");
        contenedor.appendChild(imagenActual);
        
        const btnImagen = document.getElementById("btnAgregarImagen");
        btnImagen.disabled = true;
        btnImagen.innerText = "🖼️ Imagen Agregada";
    }
}

function cambiarImagen() {
    if (imagenActual) {
        imagenActual.src = imagenRandom();
    }
}

function cambiarTamano() {
    if (imagenActual) {
        // Genera una escala entre 0.5 (mitad) y 1.2 (un poco más grande)
        const escala = (Math.random() * (1.2 - 0.5) + 0.5).toFixed(2);
        imagenActual.style.transform = `scale(${escala})`;
    }
}