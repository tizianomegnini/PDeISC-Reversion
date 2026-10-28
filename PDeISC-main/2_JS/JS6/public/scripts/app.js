let palabra = "";
let palabraOculta = [];
let intentos = 6;
let juegoTerminado = false;
let cargando = false;
let gano = false; // 👈 NUEVO

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZÑ".split("");

const $palabra = document.getElementById("palabra-display");
const $intentos = document.getElementById("intentos");
const $mensaje = document.getElementById("mensaje");
const $nombreContainer = document.getElementById("nombre-container");
const $nombreInput = document.getElementById("nombre");
const $teclado = document.getElementById("teclado");
const $ranking = document.getElementById("ranking");

// ==========================================================
// 🔤 Utilidades
// ==========================================================
function normalizar(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
}

function setMensaje(texto) {
    $mensaje.textContent = texto;
}

// ==========================================================
// 🔤 TECLADO
// ==========================================================
function crearTeclado() {
    $teclado.innerHTML = "";

    ALFABETO.forEach(letra => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = letra;
        btn.className = "tecla";
        btn.dataset.letra = letra;
        btn.onclick = () => manejarLetra(letra, btn);
        $teclado.appendChild(btn);
    });
}

function botonDeLetra(letra) {
    return $teclado.querySelector(`button[data-letra="${letra}"]`);
}

// ==========================================================
// ⌨️ Teclado físico
// ==========================================================
document.addEventListener("keydown", (e) => {
    if (juegoTerminado) return;

    const letra = normalizar(e.key);
    if (letra.length !== 1 || !ALFABETO.includes(letra)) return;

    const btn = botonDeLetra(letra);
    if (btn && !btn.disabled) manejarLetra(letra, btn);
});

// ==========================================================
// 🌎 INICIAR JUEGO
// ==========================================================
async function iniciarJuego() {
    if (cargando) return;
    cargando = true;

    $palabra.textContent = "Cargando...";
    setMensaje("");
    $nombreContainer.classList.add("d-none");
    $nombreInput.value = "";
    gano = false; // 👈 RESET

    try {
        const res = await fetch('/api/paises');
        if (!res.ok) throw new Error("Respuesta no válida");

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Lista vacía");
        }

        palabra = normalizar(data[Math.floor(Math.random() * data.length)]);
        palabraOculta = palabra.split("").map(l => (l === " " ? " " : "_"));

        intentos = 6;
        juegoTerminado = false;

        crearTeclado();
        actualizarPantalla();
        cargarRanking();
    } catch (err) {
        console.error(err);
        $palabra.textContent = "⚠️ Error";
        setMensaje("No se pudo cargar el juego.");
    } finally {
        cargando = false;
    }
}

// ==========================================================
// 🖥️ UI
// ==========================================================
function actualizarPantalla() {
    $palabra.innerHTML = palabraOculta
        .map(l => l === " " ? "&nbsp;&nbsp;&nbsp;" : l)
        .join(" ");

    $intentos.textContent = intentos;
}

// ==========================================================
// 🎮 LETRA
// ==========================================================
function manejarLetra(letra, boton) {
    if (juegoTerminado || boton.disabled) return;

    boton.disabled = true;

    let acierto = false;

    for (let i = 0; i < palabra.length; i++) {
        if (palabra[i] === letra) {
            palabraOculta[i] = letra;
            acierto = true;
        }
    }

    boton.classList.add(acierto ? "correcta" : "incorrecta");

    if (!acierto) intentos--;

    actualizarPantalla();

    // 🏆 GANAR
    if (!palabraOculta.includes("_")) {
        setMensaje("🎉 GANASTE");
        gano = true; // 👈 CLAVE
        terminarJuego();
        return;
    }

    // 💀 PERDER
    if (intentos <= 0) {
        setMensaje("💀 PERDISTE: " + palabra);
        gano = false; // 👈 CLAVE
        terminarJuego();
    }
}

// ==========================================================
// 🛑 FIN DEL JUEGO
// ==========================================================
function terminarJuego() {
    juegoTerminado = true;

    document.querySelectorAll(".tecla").forEach(b => b.disabled = true);

    $nombreContainer.classList.remove("d-none");
    $nombreInput.focus();
}

// ==========================================================
// 💾 GUARDAR SCORE
// ==========================================================
async function guardarScore() {
    const nombre = $nombreInput.value.trim().slice(0, 20);

    if (!nombre) {
        setMensaje("⚠️ Escribí tu nombre");
        $nombreInput.focus();
        return;
    }

    // ❌ NO guardar si perdió
    if (!gano) {
        setMensaje("❌ No podés guardar si perdiste");
        return;
    }

    // 🎯 PUNTAJE (vidas restantes)
    const puntos = intentos * 10;

    try {
        const res = await fetch('/api/guardar-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, puntos, tiempo: 0 })
        });

        if (!res.ok) throw new Error();

        setMensaje(`✅ Guardado (${puntos} pts)`);
        $nombreContainer.classList.add("d-none");
        cargarRanking();

    } catch (err) {
        console.error(err);
        setMensaje("⚠️ Error al guardar");
    }
}

// Enter también guarda
$nombreInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") guardarScore();
});

// ==========================================================
// 🏆 RANKING
// ==========================================================
async function cargarRanking() {
    try {
        const res = await fetch('/api/top');
        if (!res.ok) throw new Error();

        const data = await res.json();

        $ranking.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {
            const li = document.createElement("li");
            li.className = "list-group-item text-center text-muted";
            li.textContent = "Todavía no hay puntajes";
            $ranking.appendChild(li);
            return;
        }

        data.slice(0, 5).forEach((p, i) => {
            const li = document.createElement("li");
            li.className = "list-group-item";
            li.innerHTML = `
  <span>${i + 1}. ${p.nombre}</span> 
  <strong>${p.puntaje} pts</strong>
  <button class="btn btn-sm btn-primary ms-2"
    onclick='descargarPDF(${JSON.stringify(p.nombre)}, ${p.puntaje})'>
    PDF
  </button>
`;
            $ranking.appendChild(li);
        });

    } catch (err) {
        console.error(err);
        $ranking.innerHTML = `<li class="list-group-item text-danger text-center">Error al cargar</li>`;
    }
}
function descargarPDF(nombre, puntaje) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const fecha = new Date().toLocaleDateString();

  // PDF
  doc.setFontSize(18);
  doc.text("🏆 Ahorcado PRO", 20, 20);
  doc.line(20, 25, 190, 25);
  doc.text(`Jugador: ${nombre}`, 20, 40);
  doc.text(`Puntaje: ${puntaje}`, 20, 50);
  doc.text(`Fecha: ${fecha}`, 20, 60);

  doc.save(`puntaje_${nombre}.pdf`);

  // 👇 REGISTRAR EN EL SERVIDOR
  fetch("/api/registrar-descarga", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ nombre, puntaje })
  }).catch(err => console.error("Error registrando descarga:", err));
}
iniciarJuego();