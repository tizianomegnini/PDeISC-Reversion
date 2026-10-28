document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 🌗 MODO OSCURO / CLARO CONTROLADO
    // ==========================================
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
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
            themeText.textContent = 'Modo Claro';
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Modo Oscuro';
        }
    }

    // ==========================================
    // 🗂️ BASE DE DATOS E INYECCIÓN DE LOS 14 INCISOS
    // ==========================================
    const methodsData = {

    // 🔹 push(): Agrega uno o más elementos al FINAL del array
    push: {
        title: "push()", // Inserta elementos al final
        syntax: "array.push(element1, ..., elementN)",
        tasks: [
            { desc: "Crea un array vacío y agrega tres frutas usando push().", init: [], run: (arr) => { arr.push("🍎 Manzana", "🍌 Banana", "🍓 Frutilla"); return `Se agregaron 3 frutas.`; } },
            { desc: "Agrega los nombres de tus 3 amigos a un array existente llamado amigos.", init: ["Juan", "Pedro", "María"], run: (arr) => { arr.push("Carlos", "Ana", "Lucas"); return `Amigos actualizados con éxito.`; } },
            { desc: "Dado un array de números, agrega un nuevo número solo si es mayor que el último número.", init: [10, 20, 30], run: (arr) => { 
                const num = Math.floor(Math.random() * 50); 
                const last = arr[arr.length - 1];
                if (num > last) { arr.push(num); return `Éxito: El número generado (${num}) es mayor que el último (${last}). Agregado.`; }
                return `Cancelado: El número generado (${num}) NO es mayor que el último (${last}).`;
            }}
        ]
    },

    // 🔹 pop(): Elimina el ÚLTIMO elemento del array y lo devuelve
    pop: {
        title: "pop()", // Remueve el último elemento
        syntax: "array.pop()",
        tasks: [
            { desc: "Elimina el último elemento de un array de animales.", init: ["🦁 León", "🐯 Tigre", "🐻 Oso"], run: (arr) => { const el = arr.pop(); return `Eliminado: ${el || 'Ninguno, array vacío'}`; } },
            { desc: "Quita el último producto de una lista de compras y muestra cuál fue eliminado.", init: ["🥑 Palta", "🥛 Leche", "☕ Café"], run: (arr) => { const el = arr.pop(); return `Producto removido de la lista: ${el || 'Vacía'}`; } },
            { desc: "Usa un bucle while para vaciar un array con pop().", init: [1, 2, 3, 4, 5], run: (arr) => { let cont = 0; while(arr.length > 0) { arr.pop(); cont++; } return `Bucle terminado. Se vació el array por completo (removidos: ${cont} elementos).`; } }
        ]
    },

    // 🔹 unshift(): Agrega uno o más elementos al INICIO del array
    unshift: {
        title: "unshift()", // Inserta al principio
        syntax: "array.unshift(element1, ..., elementN)",
        tasks: [
            { desc: "Agrega tres colores al principio de un array vacío.", init: [], run: (arr) => { arr.unshift("🔴 Rojo", "🔵 Azul", "🟢 Verde"); return `Colores insertados al inicio.`; } },
            { desc: "Dado un array de tareas, agrega una nueva tarea urgente al principio.", init: ["Lavar platos", "Hacer ejercicio"], run: (arr) => { arr.unshift("🚨 Tarea Urgente: Rendir Lab"); return `Prioridad reconfigurada.`; } },
            { desc: "Inserta el nombre de un usuario al principio de un array de usuarios conectados.", init: ["user_alpha", "user_beta"], run: (arr) => { arr.unshift("👑 Admin_Gamer"); return `Usuario prioritario posicionado.`; } }
        ]
    },

    // 🔹 shift(): Elimina el PRIMER elemento del array y lo devuelve
    shift: {
        title: "shift()", 
        syntax: "array.shift()",
        tasks: [
            { desc: "Quita el primer número de un array de enteros.", init: [100, 200, 300], run: (arr) => { const el = arr.shift(); return el !== undefined ? `Elemento retirado de la posición 0: ${el}` : "El array está vacío."; } },
            { desc: "Elimina el primer mensaje de un array de mensajes de chat.", init: ["Hola!", "Todo bien?", "Chau"], run: (arr) => { const el = arr.shift(); return el !== undefined ? `Mensaje procesado y purgado: "${el}"` : "No hay mensajes para procesar."; } },
            { desc: "Usa shift() para simular una cola de atención al cliente.", init: ["Cliente #1", "Cliente #2", "Cliente #3"], run: (arr) => { const el = arr.shift(); return el ? `🔔 Llamando a ventanilla a: ${el}` : "Cola vacía. Todos atendidos."; } }
        ]
    },

    // 🔸 splice(): Permite agregar, eliminar o reemplazar elementos
    splice: {
        title: "splice()", 
        syntax: "array.splice(start, deleteCount, item1, ...)",
        tasks: [
            { desc: "Elimina dos elementos desde la posición 1 de un array de letras.", init: ["A", "B", "C", "D", "E"], run: (arr) => { const del = arr.splice(1, 2); return `Elementos eliminados: [${del.join(', ')}]`; } },
            { desc: "Inserta un nuevo nombre en la segunda posición (índice 1) sin eliminar nada.", init: ["Ana", "Pedro", "Luis"], run: (arr) => { arr.splice(1, 0, " Carlos"); return `Insertado en el índice 1 sin pérdidas.`; } },
            { desc: "Reemplaza dos elementos por otros nuevos desde una posición determinada.", init: ["Enero", "Febrero", "Marzo", "Abril"], run: (arr) => { arr.splice(2, 2, " JUNIO", " JULIO"); return `Se modificaron los índices 2 y 3.`; } }
        ]
    },

    // 🔸 slice(): Copia una parte del array SIN modificar el original
    slice: {
        title: "slice()", 
        syntax: "array.slice(start, end)",
        tasks: [
            { desc: "Copia los primeros 3 elementos de un array de números.", init: [10, 20, 30, 40, 50], run: (arr, setRes) => { const c = arr.slice(0, 3); setRes(c); return `Copia realizada sin alterar el original.`; } },
            { desc: "Crea una copia parcial de un array de películas desde la posición 2 hasta la 4 (excluyente).", init: ["Batman", "Spiderman", "Avatar", "Inception", "Titanic"], run: (arr, setRes) => { const c = arr.slice(2, 4); setRes(c); return `Sub-array generado con éxito.`; } },
            { desc: "Crea un array nuevo con los últimos 3 elementos sin modificarlos.", init: ["A", "B", "C", "D", "E", "F"], run: (arr, setRes) => { const c = arr.slice(-3); setRes(c); return `Últimos 3 elementos extraídos de forma segura.`; } }
        ]
    },

    // 🔍 indexOf(): Busca la posición de un elemento
    indexOf: {
        title: "indexOf()", 
        syntax: "array.indexOf(searchElement, fromIndex)",
        tasks: [
            { desc: "Encuentra la posición de la palabra 'perro' en un array.", init: ["gato", "loro", "perro", "gato"], run: (arr) => { const idx = arr.indexOf("perro"); return `La palabra 'perro' se encuentra en el índice: ${idx}`; } },
            { desc: "Verifica si el número 50 está en un array y en qué posición.", init: [10, 25, 50, 75, 50], run: (arr) => { const idx = arr.indexOf(50); return idx !== -1 ? `Encontrado en el índice primario: ${idx}` : `No se encontró el número 50.`; } },
            { desc: "Dado un array de ciudades, muestra el índice de 'Madrid' o un mensaje si no está.", init: ["Buenos Aires", "París", "Tokio"], run: (arr) => { const idx = arr.indexOf("Madrid"); return idx !== -1 ? `Madrid está en el índice: ${idx}` : `❌ Destino ausente: Madrid no se encuentra registrado.`; } }
        ]
    },

    // 🔍 includes(): Verifica si existe un elemento en el array
    includes: {
        title: "includes()", 
        syntax: "array.includes(searchElement, fromIndex)",
        tasks: [
            { desc: "Comprueba si un array contiene la palabra 'admin'.", init: ["user", "moderator", "admin", "guest"], run: (arr) => { return `¿Tiene 'admin'?: <b>${arr.includes("admin")}</b>`; } },
            { desc: "Dado un array de colores, indica si existe 'verde'.", init: ["azul", "rojo", "amarillo"], run: (arr) => { return `¿Existe 'verde' en la paleta?: <b>${arr.includes("verde")}</b>`; } },
            { desc: "Verifica si un número está presente antes de sumarlo al array.", init: [5, 10, 15], run: (arr) => { const rand = Math.random() > 0.5 ? 10 : 25; if(!arr.includes(rand)) { arr.push(rand); return `El número ${rand} no existía. Fue añadido con éxito.`; } return `Operación bloqueada: El número ${rand} ya se encuentra en el array.`; } }
        ]
    },

    // 🔁 forEach(): Recorre el array ejecutando una función
    forEach: {
        title: "forEach()", 
        syntax: "array.forEach(callback(currentValue, index, arr))",
        tasks: [
            { desc: "Muestra todos los nombres de un array con un saludo.", init: ["Ana", "Liam", "Sophia"], run: (arr) => { let res = []; arr.forEach(n => res.push(`¡Hola, ${n}! 👋`)); return res.join(" | "); } },
            { desc: "Imprime el doble de cada número de un array con forEach().", init: [2, 4, 6], run: (arr) => { let res = []; arr.forEach(n => res.push(`${n}x2 = ${n*2}`)); return `Resultados calculados en flujo: [ ${res.join(", ")} ]`; } },
            { desc: "Dado un array de objetos {nombre, edad}, muestra cada nombre con su edad.", init: [{nombre:"Luis", edad:20}, {nombre:"Mia", edad:26}], run: (arr) => { let res = []; arr.forEach(o => res.push(`${o.nombre} tiene ${o.edad} años`)); return res.join(" • "); } }
        ]
    },

    //  map(): Crea un nuevo array transformando los elementos
    map: {
        title: "map()", 
        syntax: "const newArray = array.map(callback(value))",
        tasks: [
            { desc: "Crea un nuevo array con cada número multiplicado por 3.", init: [1, 2, 3, 4], run: (arr, setRes) => { const m = arr.map(n => n * 3); setRes(m); return `Mapeo completado de forma asincrónica local.`; } },
            { desc: "Convierte un array de nombres en mayúsculas.", init: ["juan", "marta", "esteban"], run: (arr, setRes) => { const m = arr.map(n => n.toUpperCase()); setRes(m); return `Estructura string mutada a mayúsculas.`; } },
            { desc: "A un array de precios, agrégale el 21% de IVA y crea un nuevo array.", init: [100, 200, 500], run: (arr, setRes) => { const m = arr.map(p => +(p * 1.21).toFixed(2)); setRes(m); return `Nuevos valores calculados con tasa fiscal del 21%.`; } }
        ]
    },

    //  filter(): Filtra elementos según una condición
    filter: {
        title: "filter()", 
        syntax: "const filteredArray = array.filter(callback(value))",
        tasks: [
            { desc: "Filtra los números mayores a 10 de un array.", init: [4, 11, 8, 25, 3], run: (arr, setRes) => { const f = arr.filter(n => n > 10); setRes(f); return `Filtro completado.`; } },
            { desc: "Dado un array de palabras, filtra las que tengan más de 5 letras.", init: ["sol", "computadora", "casa", "javascript"], run: (arr, setRes) => { const f = arr.filter(p => p.length > 5); setRes(f); return `Se retuvieron los strings extensos.`; } },
            { desc: "Filtra los usuarios activos de un array de objetos {nombre, activo}.", init: [{nombre:"UserA", activo:true}, {nombre:"UserB", activo:false}, {nombre:"UserC", activo:true}], run: (arr, setRes) => { const f = arr.filter(u => u.activo); setRes(f.map(u => u.nombre)); return `Se aislaron las entidades con estado true.`; } }
        ]
    },

    //  reduce(): Reduce el array a un único valor acumulado
    reduce: {
        title: "reduce()", 
        syntax: "array.reduce(callback(accumulator, currentValue), initialValue)",
        tasks: [
            { desc: "Suma todos los elementos de un array.", init: [10, 20, 30, 40], run: (arr) => { const total = arr.reduce((acc, curr) => acc + curr, 0); return `Resultado de la acumulación lineal: <b>${total}</b>`; } },
            { desc: "Multiplica todos los elementos de un array de enteros.", init: [1, 2, 3, 4, 5], run: (arr) => { const total = arr.reduce((acc, curr) => acc * curr, 1); return `Resultado factorial/productoria: <b>${total}</b>`; } },
            { desc: "Dado un array de objetos {precio}, obtiene el total de precios.", init: [{precio: 15.5}, {precio: 24.5}, {precio: 10}], run: (arr) => { const total = arr.reduce((acc, curr) => acc + curr.precio, 0); return `Sumatoria de propiedades de objetos: <b>$${total}</b>`; } }
        ]
    },

    // 📊 sort(): Ordena los elementos del array
    sort: {
        title: "sort()", 
        syntax: "array.sort([compareFunction])",
        tasks: [
            { desc: "Ordena un array de números de menor a mayor.", init: [40, 1, 5, 200, 18], run: (arr) => { arr.sort((a, b) => a - b); return `Ordenamiento numérico ascendente estricto aplicado.`; } },
            { desc: "Ordena un array de palabras alfabéticamente.", init: ["Zanahoria", "Manzana", "Almendra", "Durazno"], run: (arr) => { arr.sort(); return `Ordenamiento lexicográfico por defecto completado.`; } },
            { desc: "Dado un array de objetos {nombre, edad}, ordénalos por edad.", init: [{nombre:"Pedro", edad:45}, {nombre:"Ana", edad:19}, {nombre:"Julio", edad:32}], run: (arr) => { arr.sort((a,b) => a.edad - b.edad); return `Estructuras ordenadas por clave numérica interna (edad).`; } }
        ]
    },

    // 🔃 reverse(): Invierte el orden del array
    reverse: {
        title: "reverse()", 
        syntax: "array.reverse()",
        tasks: [
            { desc: "Invierte un array de letras.", init: ["X", "Y", "Z"], run: (arr) => { arr.reverse(); return `Espejo de ordenación aplicado al array original.`; } },
            { desc: "Invierte el orden de un array de números.", init: [1, 2, 3, 4, 5], run: (arr) => { arr.reverse(); return `Secuencia numérica invertida.`; } },
            { desc: "Dado un string, conviértelo en array y revierte el texto.", init: ["¡Hola Mundo!"], run: (arr) => { 
                let str = arr[0];
                let reversedStr = str.split("").reverse().join("");
                arr[0] = reversedStr;
                return `Cadena segmentada, invertida y reunificada con éxito.`;
            } }
        ]
    }

};

    // ==========================================
    // 🕹️ ENGINES DE CONTROL Y RENDER DINÁMICO
    // ==========================================
    const menuContainer = document.getElementById('methods-menu');
    const workspace = document.getElementById('exercise-workspace');
    const titleView = document.getElementById('active-method-title');
    const syntaxView = document.getElementById('active-method-syntax');

    // Inicializar menú lateral de los 14 incisos
    Object.keys(methodsData).forEach((key, index) => {
        const btn = document.createElement('button');
        btn.className = `list-group-item list-group-item-action py-2.5 fw-medium border-0 d-flex justify-content-between align-items-center ${index === 0 ? 'active' : ''}`;
        btn.innerHTML = `<span>${index + 1}. .${key}()</span> <span class="badge border bg-body text-body font-monospace style-mini-badge">JS</span>`;
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#methods-menu button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadMethodWorkspace(key);
        });
        menuContainer.appendChild(btn);
    });

    // Cargar dinámicamente las tareas asociadas al método activo
    function loadMethodWorkspace(key) {
        const data = methodsData[key];
        titleView.textContent = data.title;
        syntaxView.textContent = data.syntax;
        workspace.innerHTML = ''; // Limpiar área anterior

        data.tasks.forEach((task, index) => {
            // Generar una copia profunda del estado inicial de pruebas para no alterar la matriz base
            let workingArray = JSON.parse(JSON.stringify(task.init));

            const taskCard = document.createElement('div');
            taskCard.className = 'card border p-3 bg-body-secondary bg-opacity-75 shadow-sm animate-fade';
            
            taskCard.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1">
                    <span class="badge bg-secondary text-white fw-bold">Consigna 0${index + 1}</span>
                </div>
                <p class="small text-body-emphasis fw-medium mb-3">${task.desc}</p>
                
                <div class="row g-2 align-items-center mb-3">
                    <div class="col-12 col-lg-8">
                        <div class="p-2 bg-body rounded border border-secondary-subtle font-monospace text-truncate small">
                            <span class="text-muted">Estado Actual:</span> [ <span id="array-display-${key}-${index}"></span> ]
                        </div>
                    </div>
                    <div class="col-12 col-lg-4">
                        <button class="btn btn-sm btn-outline-secondary w-100 fw-bold shadow-sm" id="btn-run-${key}-${index}">
                            ⚡ Ejecutar Acción
                        </button>
                    </div>
                </div>

                <div class="p-2 bg-dark text-success rounded border border-dark-subtle font-monospace small d-none" id="secondary-display-box-${key}-${index}">
                    <span class="text-secondary">> Retorno generado (Nuevo Array):</span> [ <span id="secondary-display-${key}-${index}" class="text-light"></span> ]
                </div>

                <div class="mt-2 text-info small font-monospace" id="console-log-${key}-${index}">
                    > Esperando disparo...
                </div>
            `;

            workspace.appendChild(taskCard);

            const displaySpan = document.getElementById(`array-display-${key}-${index}`);
            const secondaryBox = document.getElementById(`secondary-display-box-${key}-${index}`);
            const secondarySpan = document.getElementById(`secondary-display-${key}-${index}`);
            const logView = document.getElementById(`console-log-${key}-${index}`);
            const runBtn = document.getElementById(`btn-run-${key}-${index}`);

            // Renderizar estado de inicialización plano
            const updateDisplay = () => {
                displaySpan.innerHTML = workingArray.map(item => 
                    typeof item === 'object' ? JSON.stringify(item) : `<span class="text-success-emphasis fw-bold">"${item}"</span>`
                ).join(", ");
            };
            updateDisplay();

            // Evento gatillo de ejecución
            runBtn.addEventListener('click', () => {
                let generatedValue = null;
                
                // Función interceptora para capturar el retorno de arrays nuevos de slice, map y filter
                const setSecondaryResult = (newArr) => {
                    generatedValue = newArr;
                };

                const actionLog = task.run(workingArray, setSecondaryResult);
                updateDisplay();

                logView.innerHTML = `💥 <b>[Mutación]</b> ${actionLog}`;

                if (generatedValue !== null) {
                    secondaryBox.classList.remove('d-none');
                    secondarySpan.innerHTML = generatedValue.map(item => `"${item}"`).join(", ");
                }
            });
        });
    }

    // Carga inicial por defecto (push)
    loadMethodWorkspace('push');

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