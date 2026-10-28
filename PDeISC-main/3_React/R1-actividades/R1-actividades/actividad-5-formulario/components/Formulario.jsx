import { useState } from "react";

// Componente que contiene un formulario simple.
function Formulario() {
  // Estado utilizado para guardar el nombre ingresado.
  const [nombre, setNombre] = useState("");

  // Estado utilizado para controlar si se envió el formulario.
  const [enviado, setEnviado] = useState(false);

  // Estado utilizado para mostrar errores de validación.
  const [error, setError] = useState("");

  // Maneja el envío del formulario.
  const manejarEnvio = (evento) => {
    evento.preventDefault();

    const nombreLimpio = nombre.trim();

    // Verifica que el campo no esté vacío.
    if (nombreLimpio === "") {
      setError("Ingresá tu nombre.");
      setEnviado(false);
      return;
    }

    // Permite solamente letras, espacios y caracteres propios del español.
    const nombreValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:\s+[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/;

    if (!nombreValido.test(nombreLimpio)) {
      setError("El nombre solo puede contener letras y espacios.");
      setEnviado(false);
      return;
    }

    // Si todo es correcto, elimina el error y muestra el mensaje.
    setError("");
    setNombre(nombreLimpio);
    setEnviado(true);
  };

  return (
    <section className="actividad">
      <div className="actividad-header">
        <span className="numero">05</span>

        <div>
          <p className="etiqueta">Actividad 5</p>
          <h2>Formulario simple</h2>
        </div>
      </div>

      <form
        className="formulario"
        onSubmit={manejarEnvio}
        noValidate
      >
        <label htmlFor="nombre">
          Nombre
        </label>

        <input
          id="nombre"
          name="nombre"
          type="text"
          placeholder="Ingresá tu nombre"
          value={nombre}
          maxLength={50}
          autoComplete="name"
          onChange={(evento) => {
            const valor = evento.target.value;

            // Solo permite letras y espacios mientras se escribe.
            if (/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]*$/.test(valor)) {
              setNombre(valor);
              setError("");
              setEnviado(false);
            }
          }}
          aria-invalid={error !== ""}
          aria-describedby={error ? "error-nombre" : undefined}
        />

        {error && (
          <p
            id="error-nombre"
            className="error"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          className="boton principal"
        >
          Enviar
        </button>
      </form>

      {enviado && (
        <div className="mensaje-bienvenida">
          <span>✓</span>

          <p>
            ¡Bienvenido/a, <strong>{nombre}</strong>!
          </p>
        </div>
      )}
    </section>
  );
}

export default Formulario;
