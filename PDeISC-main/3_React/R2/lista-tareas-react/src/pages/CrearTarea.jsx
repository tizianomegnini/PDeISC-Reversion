// Importamos useState para poder manejar los datos del formulario.
// También importamos Link para navegar entre páginas y useNavigate
// para cambiar de página mediante código.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'


// Componente encargado de mostrar el formulario para crear una nueva tarea.
// Recibe agregarTarea para guardar la tarea y modoOscuro para el modo visual.
function CrearTarea({ agregarTarea, modoOscuro }) {

  // useNavigate permite redirigir al usuario a otra ruta
  // después de realizar una acción.
  const navigate = useNavigate()


  // Estados utilizados para almacenar los datos ingresados en el formulario.
  // Cada uno tiene un valor inicial vacío o falso.
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [completa, setCompleta] = useState(false)


  // Función que se ejecuta cuando el usuario envía el formulario.
  const manejarEnvio = (e) => {

    // Evita que el formulario recargue la página automáticamente.
    e.preventDefault()


    // Verificamos que el título y la descripción no estén vacíos.
    // trim() elimina los espacios que pueda haber al principio o al final.
    if (
      titulo.trim() === '' ||
      descripcion.trim() === ''
    ) {
      return
    }


    // Creamos un objeto que contiene toda la información
    // correspondiente a la nueva tarea.
    const nuevaTarea = {

      // Date.now() genera un número único basado en la fecha y hora actual.
      // Se utiliza como identificador de la tarea.
      id: Date.now(),

      // Guardamos el título sin espacios innecesarios.
      titulo: titulo.trim(),

      // Guardamos la descripción sin espacios innecesarios.
      descripcion: descripcion.trim(),

      // Obtenemos la fecha actual con formato utilizado en Argentina.
      fecha: new Date().toLocaleDateString('es-AR'),

      // Guardamos si la tarea fue marcada como completa.
      completa: completa

    }


    // Enviamos la nueva tarea al componente principal
    // mediante la función recibida por props.
    agregarTarea(nuevaTarea)


    // Después de crear la tarea, volvemos a la página principal.
    navigate('/')
  }


  // Renderizado de la interfaz del componente.
  return (
    <div className="container-fluid px-3 px-md-5 py-4">

      {/* Encabezado de la página con el botón para volver */}
      <div className="d-flex justify-content-between align-items-center mb-4">

        {/* Link permite volver a la página principal sin recargar el sitio */}
        <Link
          to="/"
          className="btn btn-outline-secondary"
        >
          ← Volver
        </Link>

      </div>


      {/* Contenedor principal de la página de creación */}
      <div className="create-page">

        {/* Encabezado con el título y una breve explicación */}
        <div className="create-header">

          <div>

            <h1 className="fw-bold mb-2">
              ➕ Nueva tarea
            </h1>

            <p className="text-secondary mb-0">
              Completá los datos para crear una nueva tarea.
            </p>

          </div>

        </div>


        {/* Formulario para ingresar los datos de la nueva tarea.
            onSubmit ejecuta manejarEnvio cuando se envía. */}
        <form
          onSubmit={manejarEnvio}
          className="create-form"
        >

          <div className="row g-4">


            {/* Campo para ingresar el título de la tarea */}
            <div className="col-12 col-lg-6">

              <label
                htmlFor="titulo"
                className="form-label fw-semibold"
              >
                Título
              </label>

              <input
                type="text"
                id="titulo"
                className="form-control form-control-lg"
                placeholder="Ej: Estudiar para matemática"

                // El valor del input está conectado al estado titulo.
                value={titulo}

                // Cada vez que el usuario escribe, actualizamos el estado.
                onChange={(e) => setTitulo(e.target.value)}

                // Hace que el campo sea obligatorio.
                required
              />

            </div>


            {/* Campo que muestra la fecha actual.
                Está deshabilitado porque el usuario no necesita modificarla. */}
            <div className="col-12 col-lg-6">

              <label
                htmlFor="fecha"
                className="form-label fw-semibold"
              >
                Fecha de creación
              </label>

              <input
                type="text"
                id="fecha"
                className="form-control form-control-lg"

                // Mostramos automáticamente la fecha actual.
                value={new Date().toLocaleDateString('es-AR')}

                // El usuario no puede modificar la fecha.
                disabled
              />

            </div>


            {/* Campo para ingresar una descripción más extensa */}
            <div className="col-12">

              <label
                htmlFor="descripcion"
                className="form-label fw-semibold"
              >
                Descripción
              </label>

              <textarea
                id="descripcion"
                className="form-control description-input"
                rows="12"
                placeholder="Escribí una descripción detallada de la tarea."

                // Conectamos el textarea con el estado descripcion.
                value={descripcion}

                // Actualizamos el estado cada vez que cambia el contenido.
                onChange={(e) => setDescripcion(e.target.value)}

                // La descripción también es obligatoria.
                required
              />

            </div>


            {/* Opción para indicar si la tarea ya está completa */}
            <div className="col-12">

              <div className="form-check form-switch">

                <input
                  type="checkbox"
                  id="completa"
                  className="form-check-input"

                  // El checkbox queda marcado según el valor de completa.
                  checked={completa}

                  // Actualizamos completa cuando cambia el checkbox.
                  onChange={(e) =>
                    setCompleta(e.target.checked)
                  }
                />

                <label
                  htmlFor="completa"
                  className="form-check-label"
                >
                  Marcar tarea como completa
                </label>

              </div>

            </div>


            {/* Separador y botones de acción */}
            <div className="col-12">

              <hr />

              <div className="d-flex justify-content-end gap-2 flex-wrap">


                {/* Botón para cancelar y volver a la página principal */}
                <Link
                  to="/"
                  className="btn btn-outline-secondary btn-lg"
                >
                  Cancelar
                </Link>


                {/* Botón que envía el formulario y crea la tarea */}
                <button
                  type="submit"
                  className="btn btn-primary btn-lg px-5"
                >
                  Crear tarea
                </button>

              </div>

            </div>

          </div>

        </form>

      </div>

    </div>
  )
}

export default CrearTarea