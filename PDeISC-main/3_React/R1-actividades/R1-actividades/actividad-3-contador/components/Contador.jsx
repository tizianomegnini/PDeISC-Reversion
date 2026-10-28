import { useState } from "react";

// Componente contador.
// useState permite guardar y modificar el valor del contador.
function Contador() {
  // El contador comienza en 0.
  const [contador, setContador] = useState(0);

  // Aumenta el contador en 1.
  const incrementar = () => {
    setContador(contador + 1);
  };

  // Disminuye el contador en 1.
  const decrementar = () => {
    setContador(contador - 1);
  };

  // Restablece el contador a 0.
  const reiniciar = () => {
    setContador(0);
  };

  return (
    <section className="actividad">
      <div className="actividad-header">
        <span className="numero">03</span>

        <div>
          <p className="etiqueta">Actividad 3</p>
          <h2>Contador</h2>
        </div>
      </div>

      <div className="contador">
        <p>Valor actual</p>

        <span className="contador-valor">
          {contador}
        </span>

        <div className="contador-botones">
          <button onClick={decrementar} className="boton secundario">
            −
          </button>

          <button onClick={reiniciar} className="boton reiniciar">
            Reiniciar
          </button>

          <button onClick={incrementar} className="boton principal">
            +
          </button>
        </div>
      </div>
    </section>
  );
}

export default Contador;