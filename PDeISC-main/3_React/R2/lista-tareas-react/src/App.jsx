import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'

import Inicio from './pages/Inicio'
import DetalleTarea from './pages/DetalleTarea'
import CrearTarea from './pages/CrearTarea'
import EditarTarea from './pages/EditarTarea'

import tareasIniciales from './data/Tareas'

import './App.css'

function App() {

  const [tareas, setTareas] = useState(() => {
    const tareasGuardadas = localStorage.getItem('tareas')

    return tareasGuardadas
      ? JSON.parse(tareasGuardadas)
      : tareasIniciales
  })

  const [modoOscuro, setModoOscuro] = useState(() => {
    return localStorage.getItem('modoOscuro') === 'true'
  })

  const [tareaAEliminar, setTareaAEliminar] = useState(null)

  useEffect(() => {
    localStorage.setItem('tareas', JSON.stringify(tareas))
  }, [tareas])

  useEffect(() => {
    localStorage.setItem('modoOscuro', modoOscuro)

    document.body.className = modoOscuro
      ? 'modo-oscuro'
      : 'modo-claro'
  }, [modoOscuro])

  const agregarTarea = (nuevaTarea) => {
    setTareas((tareasActuales) => [
      ...tareasActuales,
      nuevaTarea
    ])
  }

  const cambiarEstado = (id) => {
    setTareas((tareasActuales) =>
      tareasActuales.map((tarea) =>
        tarea.id === id
          ? { ...tarea, completa: !tarea.completa }
          : tarea
      )
    )
  }

  const cambiarEstadoTodas = () => {
    setTareas((tareasActuales) => {
      const todasCompletas = tareasActuales.length > 0 &&
        tareasActuales.every((tarea) => tarea.completa)

      return tareasActuales.map((tarea) => ({
        ...tarea,
        completa: !todasCompletas
      }))
    })
  }

  const editarTarea = (tareaEditada) => {
    setTareas((tareasActuales) =>
      tareasActuales.map((tarea) =>
        tarea.id === tareaEditada.id
          ? tareaEditada
          : tarea
      )
    )
  }

  const solicitarEliminar = (id) => {
    const tarea = tareas.find(
      (tarea) => tarea.id === id
    )

    // Una tarea pendiente no se puede eliminar.
    if (!tarea || !tarea.completa) {
      return
    }

    setTareaAEliminar(tarea)
  }

  const confirmarEliminacion = () => {
    if (!tareaAEliminar || !tareaAEliminar.completa) {
      return
    }

    setTareas((tareasActuales) =>
      tareasActuales.filter(
        (tarea) => tarea.id !== tareaAEliminar.id
      )
    )

    setTareaAEliminar(null)
  }

  const cancelarEliminacion = () => {
    setTareaAEliminar(null)
  }

  const descargarTareas = () => {
    const contenido = JSON.stringify(tareas, null, 2)

    const archivo = new Blob(
      [contenido],
      { type: 'application/json' }
    )

    const url = URL.createObjectURL(archivo)
    const enlace = document.createElement('a')

    enlace.href = url
    enlace.download = 'tareas.txt'
    enlace.click()

    URL.revokeObjectURL(url)
  }

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={
            <Inicio
              tareas={tareas}
              solicitarEliminar={solicitarEliminar}
              cambiarEstado={cambiarEstado}
              cambiarEstadoTodas={cambiarEstadoTodas}
              descargarTareas={descargarTareas}
              modoOscuro={modoOscuro}
              setModoOscuro={setModoOscuro}
            />
          }
        />

        <Route
          path="/tarea/:id"
          element={
            <DetalleTarea
              tareas={tareas}
              solicitarEliminar={solicitarEliminar}
              cambiarEstado={cambiarEstado}
              modoOscuro={modoOscuro}
            />
          }
        />

        <Route
          path="/crear"
          element={
            <CrearTarea
              agregarTarea={agregarTarea}
              modoOscuro={modoOscuro}
            />
          }
        />

        <Route
          path="/editar/:id"
          element={
            <EditarTarea
              tareas={tareas}
              editarTarea={editarTarea}
              modoOscuro={modoOscuro}
            />
          }
        />

      </Routes>

      {tareaAEliminar && (
        <div
          className="modal-backdrop-custom"
          onClick={cancelarEliminacion}
        >
          <div
            className="delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-modal-icon">
              🗑️
            </div>

            <h3 className="fw-bold">
              ¿Eliminar tarea?
            </h3>

            <p className="text-secondary">
              Vas a eliminar la tarea:
            </p>

            <div className="delete-task-name">
              {tareaAEliminar.titulo}
            </div>

            <p className="text-secondary small">
              Esta acción no se puede deshacer.
            </p>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                className="btn btn-outline-secondary"
                onClick={cancelarEliminacion}
              >
                Cancelar
              </button>

              <button
                className="btn btn-danger"
                onClick={confirmarEliminacion}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </BrowserRouter>
  )
}

export default App
