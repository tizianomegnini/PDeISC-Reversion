console.log("JS funcionando");

// ===== FUNCIONES =====
function suma(a, b) { return a + b; }
function resta(a, b) { return a - b; }
function multiplicacion(a, b) { return a * b; }
function division(a, b) { return a / b; }

// ===== DATOS =====
const resultados = [
    { tipo: "Ejercicio 1", operacion: "Mensaje", resultado: "Hola mundo desde Node.js" },
    { tipo: "Ejercicio 1", operacion: "Mensaje", resultado: "Fin" },

    { tipo: "Ejercicio 2", operacion: "4 + 5", resultado: 4 + 5 },
    { tipo: "Ejercicio 2", operacion: "3 - 6", resultado: 3 - 6 },
    { tipo: "Ejercicio 2", operacion: "2 * 7", resultado: 2 * 7 },
    { tipo: "Ejercicio 2", operacion: "20 / 4", resultado: 20 / 4 },

    { tipo: "Ejercicio 3", operacion: "4 + 5", resultado: suma(4, 5) },
    { tipo: "Ejercicio 3", operacion: "3 - 6", resultado: resta(3, 6) },
    { tipo: "Ejercicio 3", operacion: "2 * 7", resultado: multiplicacion(2, 7) },
    { tipo: "Ejercicio 3", operacion: "20 / 4", resultado: division(20, 4) },

    { tipo: "Ejercicio 4", operacion: "5 + 3", resultado: suma(5, 3) },
    { tipo: "Ejercicio 4", operacion: "8 - 6", resultado: resta(8, 6) },
    { tipo: "Ejercicio 4", operacion: "3 * 11", resultado: multiplicacion(3, 11) },
    { tipo: "Ejercicio 4", operacion: "30 / 5", resultado: division(30, 5) }
];

// ===== RENDER =====
const tbody = document.getElementById("tabla-body");

resultados.forEach(item => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
        <td>${item.tipo}</td>
        <td>${item.operacion}</td>
        <td>${item.resultado}</td>
    `;

    tbody.appendChild(fila);
});

// ===== DARK MODE =====
const btn = document.getElementById("toggleTema");
const html = document.documentElement;

btn.addEventListener("click", () => {
    const temaActual = html.getAttribute("data-bs-theme");

    if (temaActual === "light") {
        html.setAttribute("data-bs-theme", "dark");
        btn.textContent = "☀️ Modo Claro";
        btn.classList.remove("btn-dark");
        btn.classList.add("btn-light");
    } else {
        html.setAttribute("data-bs-theme", "light");
        btn.textContent = "🌙 Modo Oscuro";
        btn.classList.remove("btn-light");
        btn.classList.add("btn-dark");
    }
    // ===== BOTÓN VOLVER ARRIBA =====
const btnTop = document.getElementById("btnTop");

window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
        btnTop.style.display = "block";
    } else {
        btnTop.style.display = "none";
    }
});

btnTop.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});
});