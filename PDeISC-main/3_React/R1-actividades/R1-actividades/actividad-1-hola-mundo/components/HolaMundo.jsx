// Componente encargado de mostrar el mensaje de "Hola, mundo!".
function HolaMundo() {
  return (
    <section className="actividad">
      <div className="actividad-header">
        <span className="numero">01</span>

        <div>
          <p className="etiqueta">Actividad 1</p>
          <h2>Hola mundo</h2>
        </div>
      </div>

      <div className="hola-mundo">
        <h3>¡Hola, mundo!</h3>
        <p>
          Este mensaje es mostrado mediante un componente de React.
        </p>
      </div>
    </section>
  );
}

export default HolaMundo;