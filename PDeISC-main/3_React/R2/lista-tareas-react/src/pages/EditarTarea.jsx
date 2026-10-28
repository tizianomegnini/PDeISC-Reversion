import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

function EditarTarea({ tareas, editarTarea }) {

  const { id } = useParams()
  const navigate = useNavigate()

  const tarea = tareas.find(
    (tarea) => tarea.id === Number(id)
  )

  const [titulo, setTitulo] = useState(tarea?.titulo || '')
  const [descripcion, setDescripcion] = useState(tarea?.descripcion || '')
  const [completa, setCompleta] = useState(tarea?.completa || false)

  if (!tarea) {
    return (
      <div className="container-fluid px-3 px-md-5 py-5">
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Tarea no encontrada</h3>
          <p className="text-secondary">
            La tarea que querés editar no existe.
          </p>
          <Link to="/" className="btn btn-primary">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  const manejarEnvio = (e) => {
    e.preventDefault()

    if (!titulo.trim() || !descripcion.trim()) {
      return
    }

    editarTarea({
      ...tarea,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      completa
    })

    navigate(`/tarea/${tarea.id}`)
  }

  return (
    <div className="container-fluid px-3 px-md-5 py-4">

      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to={`/tarea/${tarea.id}`} className="btn btn-outline-secondary">
          ← Volver
        </Link>
      </div>

      <div className="create-page">

        <div className="create-header">
          <div>
            <h1 className="fw-bold mb-2">
              ✏️ Editar tarea
            </h1>

            <p className="text-secondary mb-0">
              Modificá los datos de la tarea.
            </p>
          </div>
        </div>

        <form onSubmit={manejarEnvio} className="create-form">

          <div className="row g-4">

            <div className="col-12 col-lg-6">
              <label htmlFor="titulo" className="form-label fw-semibold">
                Título
              </label>

              <input
                type="text"
                id="titulo"
                className="form-control form-control-lg"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            </div>

            <div className="col-12 col-lg-6">
              <label htmlFor="fecha" className="form-label fw-semibold">
                Fecha de creación
              </label>

              <input
                type="text"
                id="fecha"
                className="form-control form-control-lg"
                value={tarea.fecha}
                disabled
              />
            </div>

            <div className="col-12">
              <label htmlFor="descripcion" className="form-label fw-semibold">
                Descripción
              </label>

              <textarea
                id="descripcion"
                className="form-control description-input"
                rows="12"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
              />
            </div>

            <div className="col-12">
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  id="completa"
                  className="form-check-input"
                  checked={completa}
                  onChange={(e) => setCompleta(e.target.checked)}
                />

                <label htmlFor="completa" className="form-check-label">
                  Marcar tarea como completa
                </label>
              </div>
            </div>

            <div className="col-12">
              <hr />

              <div className="d-flex justify-content-end gap-2 flex-wrap">
                <Link
                  to={`/tarea/${tarea.id}`}
                  className="btn btn-outline-secondary btn-lg"
                >
                  Cancelar
                </Link>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg px-5"
                >
                  Guardar cambios
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}

export default EditarTarea
