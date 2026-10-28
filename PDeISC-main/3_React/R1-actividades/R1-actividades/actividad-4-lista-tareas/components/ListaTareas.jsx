import { useState } from "react";

// Componente para administrar una lista de tareas.
function ListaTareas() {
  const [tareas, setTareas] = useState([
    { id: 1, texto: "Aprender React", completada: false },
    { id: 2, texto: "Practicar componentes", completada: true }
  ]);

  const [nuevaTarea, setNuevaTarea] = useState("");
  const [tareaEditando, setTareaEditando] = useState(null);
  const [textoEditado, setTextoEditado] = useState("");
  const [tareaAEliminar, setTareaAEliminar] = useState(null);

  // Agrega una nueva tarea al arreglo.
  const agregarTarea = (evento) => {
    evento.preventDefault();

    if (nuevaTarea.trim() === "") return;

    const tarea = {
      id: Date.now(),
      texto: nuevaTarea.trim(),
      completada: false
    };

    setTareas((tareasActuales) => [...tareasActuales, tarea]);
    setNuevaTarea("");
  };

  // Cambia el estado de una tarea entre completada y pendiente.
  const cambiarEstado = (id) => {
    setTareas((tareasActuales) =>
      tareasActuales.map((tarea) =>
        tarea.id === id
          ? { ...tarea, completada: !tarea.completada }
          : tarea
      )
    );
  };

  // Selecciona todas las tareas o las deselecciona.
  const seleccionarTodas = () => {
    const todasCompletadas = tareas.length > 0 && tareas.every((tarea) => tarea.completada);

    setTareas((tareasActuales) =>
      tareasActuales.map((tarea) => ({
        ...tarea,
        completada: !todasCompletadas
      }))
    );
  };

  // Abre el modo de edición de una tarea.
  const iniciarEdicion = (tarea) => {
    setTareaEditando(tarea.id);
    setTextoEditado(tarea.texto);
  };

  // Guarda los cambios realizados en una tarea.
  const guardarEdicion = (evento) => {
    evento.preventDefault();

    if (textoEditado.trim() === "") return;

    setTareas((tareasActuales) =>
      tareasActuales.map((tarea) =>
        tarea.id === tareaEditando
          ? { ...tarea, texto: textoEditado.trim() }
          : tarea
      )
    );

    setTareaEditando(null);
    setTextoEditado("");
  };

  // Cancela la edición sin modificar la tarea.
  const cancelarEdicion = () => {
    setTareaEditando(null);
    setTextoEditado("");
  };

  // Abre la confirmación personalizada para eliminar una tarea.
  const solicitarEliminacion = (tarea) => {
    if (!tarea.completada) return;
    setTareaAEliminar(tarea);
  };

  // Elimina definitivamente la tarea confirmada.
  const confirmarEliminacion = () => {
    if (!tareaAEliminar) return;

    setTareas((tareasActuales) =>
      tareasActuales.filter((tarea) => tarea.id !== tareaAEliminar.id)
    );

    setTareaAEliminar(null);
  };

  const cancelarEliminacion = () => {
    setTareaAEliminar(null);
  };

  const todasCompletadas = tareas.length > 0 && tareas.every((tarea) => tarea.completada);

  return (
    <section className="actividad">
      <div className="actividad-header">
        <span className="numero">04</span>

        <div>
          <p className="etiqueta">Actividad 4</p>
          <h2>Lista de tareas</h2>
        </div>
      </div>

{tareas.length > 0 && (
        <div className="acciones-tareas">
          <button type="button" className="boton secundario" onClick={seleccionarTodas}>
            {todasCompletadas ? "Deseleccionar todas" : "Seleccionar todas"}
          </button>
        </div>
      )}

      <form className="formulario-tarea" onSubmit={agregarTarea}>
        <input
          type="text"
          placeholder="Escribí una nueva tarea..."
          value={nuevaTarea}
          onChange={(evento) => setNuevaTarea(evento.target.value)}
        />

        <button type="submit" className="boton principal">
          Agregar
        </button>
      </form>


      <div className="tareas">
        {tareas.length === 0 ? (
          <p className="sin-tareas">No hay tareas cargadas.</p>
        ) : (
          tareas.map((tarea) => (
            <div className={`tarea ${tarea.completada ? "completada" : ""}`} key={tarea.id}>
              <button
                className={`check ${tarea.completada ? "seleccionado" : ""}`}
                onClick={() => cambiarEstado(tarea.id)}
                type="button"
                aria-label={tarea.completada ? "Marcar como pendiente" : "Marcar como completada"}
              >
                {tarea.completada ? "✓" : ""}
              </button>

              {tareaEditando === tarea.id ? (
                <form className="edicion-tarea" onSubmit={guardarEdicion}>
                  <input
                    type="text"
                    value={textoEditado}
                    onChange={(evento) => setTextoEditado(evento.target.value)}
                    autoFocus
                    aria-label="Editar tarea"
                  />
                  <button type="submit" className="boton pequeno guardar">
                    Guardar
                  </button>
                  <button type="button" className="boton pequeno secundario" onClick={cancelarEdicion}>
                    Cancelar
                  </button>
                </form>
              ) : (
                <>
                  <span>{tarea.texto}</span>

                  <button
                    className="editar"
                    onClick={() => iniciarEdicion(tarea)}
                    type="button"
                    aria-label="Editar tarea"
                  >
                    Editar
                  </button>

                  <button
                    className="eliminar"
                    onClick={() => solicitarEliminacion(tarea)}
                    type="button"
                    disabled={!tarea.completada}
                    aria-label={tarea.completada ? "Eliminar tarea" : "La tarea debe estar completada para eliminarla"}
                    title={tarea.completada ? "Eliminar tarea" : "Completá la tarea para poder eliminarla"}
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {tareaAEliminar && (
        <div className="modal-fondo" role="presentation" onMouseDown={cancelarEliminacion}>
          <div className="modal-confirmacion" role="dialog" aria-modal="true" aria-labelledby="titulo-confirmacion" onMouseDown={(evento) => evento.stopPropagation()}>
            <h3 id="titulo-confirmacion">¿Eliminar esta tarea?</h3>
            <p>Se va a eliminar definitivamente: <strong>{tareaAEliminar.texto}</strong></p>

            <div className="modal-acciones">
              <button type="button" className="boton secundario" onClick={cancelarEliminacion}>
                Cancelar
              </button>
              <button type="button" className="boton peligro" onClick={confirmarEliminacion}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ListaTareas;
