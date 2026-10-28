import { Link } from 'react-router-dom'
import Tarea from '../components/Tarea'

function Inicio({
  tareas,
  solicitarEliminar,
  cambiarEstado,
  cambiarEstadoTodas,
  descargarTareas,
  modoOscuro,
  setModoOscuro
}) {

  const todasCompletas = tareas.length > 0 &&
    tareas.every((tarea) => tarea.completa)

  return (
    <div className="container-fluid px-3 px-md-5 py-4">

      <header className="main-header mb-5">
        <div>
          <h1 className="fw-bold mb-1">
            📋 Lista de tareas
          </h1>

          <p className="text-secondary mb-0">
            Organizá tus tareas de forma sencilla.
          </p>
        </div>

        <div className="header-buttons">
          <button
            onClick={() => setModoOscuro(!modoOscuro)}
            className="btn btn-outline-secondary"
          >
            {modoOscuro ? '☀️ Modo claro' : '🌙 Modo oscuro'}
          </button>

          <button
            onClick={descargarTareas}
            className="btn btn-success"
          >
            ⬇️ Descargar
          </button>

          <button
            onClick={cambiarEstadoTodas}
            className="btn btn-outline-success"
            disabled={tareas.length === 0}
          >
            {todasCompletas
              ? '↩️ Descompletar todas'
              : '✓ Completar todas'}
          </button>

          <Link
            to="/crear"
            className="btn btn-primary"
          >
            + Nueva tarea
          </Link>
        </div>
      </header>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 fw-bold mb-0">
          Mis tareas
        </h2>

        <span className="badge text-bg-secondary fs-6">
          {tareas.length}{' '}
          {tareas.length === 1 ? 'tarea' : 'tareas'}
        </span>
      </div>

      {tareas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            📝
          </div>

          <h3>No hay tareas</h3>

          <p className="text-secondary">
            Todavía no agregaste ninguna tarea.
          </p>

          <Link
            to="/crear"
            className="btn btn-primary"
          >
            Crear mi primera tarea
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {tareas.map((tarea) => (
            <div
              className="col-12 col-sm-6 col-lg-4 col-xl-3"
              key={tarea.id}
            >
              <Tarea
                tarea={tarea}
                solicitarEliminar={solicitarEliminar}
                cambiarEstado={cambiarEstado}
              />
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default Inicio
