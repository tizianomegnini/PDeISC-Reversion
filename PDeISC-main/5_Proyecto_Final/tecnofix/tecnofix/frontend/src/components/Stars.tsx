import { useState } from 'react';

/**
 * Renderiza una escala visual de calificación interactiva o estática.
 *
 * @param value Puntaje actual, usado para mostrar el estado activo y para lectura solo.
 * @param onChange Si viene definido, habilita la selección por click.
 * @param size Tamaño del icono para encajar en tablas o formularios.
 */
export default function Stars({ value = 0, onChange, size = '1.4rem' }: { value?: number; onChange?: (value: number) => void; size?: string }) {
  const [hover, setHover] = useState(0);
  const activo = hover || value;
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        onChange ? (
          <button key={n} type="button" className={n <= activo ? 'on' : ''} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)} aria-label={`${n} estrella${n > 1 ? 's' : ''}`}>★</button>
        ) : <span key={n} className={n <= value ? 'on' : ''}>★</span>
      ))}
    </span>
  );
}
