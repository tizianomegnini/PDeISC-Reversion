export function saludar(nombre) {
    return `Hola ${nombre}, bienvenido!`;
}

export function calcular(a, b) {
    return a + b;
}

export function menu() {
    return `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="/">Mi Sitio 🚀</a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="menu">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link" href="/">Inicio</a></li>
                    <li class="nav-item"><a class="nav-link" href="/clima">Clima</a></li>
                    <li class="nav-item"><a class="nav-link" href="/calculo">Cálculo</a></li>
                    <li class="nav-item"><a class="nav-link" href="/mayus">Mayúsculas</a></li>
                    <li class="nav-item"><a class="nav-link" href="/archivo">Archivo</a></li>
                    <li class="nav-item"><a class="nav-link" href="/url">URL</a></li>
                </ul>
            </div>
        </div>
    </nav>
    `;
}