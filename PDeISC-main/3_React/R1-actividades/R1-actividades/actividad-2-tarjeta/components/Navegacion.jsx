// Navegación entre las 5 actividades.
// Cada actividad corre en su propio servidor local (puerto distinto),
// por eso los enlaces apuntan a http://localhost:PUERTO.
const actividades = [
  { numero: 1, titulo: "Hola mundo", puerto: 5171 },
  { numero: 2, titulo: "Tarjeta de presentación", puerto: 5172 },
  { numero: 3, titulo: "Contador", puerto: 5173 },
  { numero: 4, titulo: "Lista de tareas", puerto: 5174 },
  { numero: 5, titulo: "Formulario simple", puerto: 5175 },
];

function Navegacion({ actual }) {
  return (
    <nav className="nav-actividades" aria-label="Actividades">
      {actividades.map((actividad) => (
        <a
          key={actividad.numero}
          href={`http://localhost:${actividad.puerto}`}
          className={actividad.numero === actual ? "activa" : ""}
          aria-current={actividad.numero === actual ? "page" : undefined}
        >
          <span className="nav-num">{actividad.numero}</span>
          <span className="nav-texto">{actividad.titulo}</span>
        </a>
      ))}
    </nav>
  );
}

export default Navegacion;
