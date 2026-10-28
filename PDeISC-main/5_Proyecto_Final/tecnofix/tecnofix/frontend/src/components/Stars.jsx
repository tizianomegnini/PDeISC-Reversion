import { useState } from 'react';

/** Muestra estrellas. Con onChange permite elegir de 1 a 5. */
export default function Stars({ value = 0, onChange, size = '1.4rem' }) {
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
