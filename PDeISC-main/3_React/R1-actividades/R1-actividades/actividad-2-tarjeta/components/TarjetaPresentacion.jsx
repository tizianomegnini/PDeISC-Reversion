// Componente que recibe información mediante props.
// Las props permiten reutilizar el mismo componente
// con diferentes nombres, profesiones e imágenes.
function TarjetaPresentacion({
  nombre,
  apellido,
  profesion,
  imagen
}) {
  return (
    <section className="actividad">
      <div className="actividad-header">
        <span className="numero">02</span>

        <div>
          <p className="etiqueta">Actividad 2</p>
          <h2>Tarjeta de presentación</h2>
        </div>
      </div>

      <div className="tarjeta">
        <img
          src={imagen}
          alt={`Foto de ${nombre} ${apellido}`}
          className="tarjeta-imagen"
        />

        <div className="tarjeta-info">
          <span className="tarjeta-etiqueta">PRESENTACIÓN</span>

          <h3>
            {nombre} {apellido}
          </h3>

          <p>{profesion}</p>
        </div>
      </div>
    </section>
  );
}

export default TarjetaPresentacion;