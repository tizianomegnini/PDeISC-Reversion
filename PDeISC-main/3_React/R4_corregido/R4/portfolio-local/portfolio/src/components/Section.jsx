import { useReveal } from "../hooks/useReveal";
import SectionEditButton from "./SectionEditButton";

/**
 * Section
 * -------
 * Envoltorio reutilizado por cada bloque del portfolio (About, Skills,
 * Achievements, Experience, Projects). Aplica el hook useReveal para
 * animar la entrada cuando la sección se vuelve visible, dibuja un
 * encabezado consistente con título + índice opcional, y si se pasa
 * `editKind` muestra el botón "✎ Editar" de esa sección.
 *
 * @param {string} id - id usado por el Navbar para hacer scroll.
 * @param {string} title - título visible de la sección.
 * @param {string} [index] - etiqueta corta ("01", "02"...) opcional.
 * @param {"profile"|"skills"|"experience"|"achievements"|"projects"} [editKind]
 */
export default function Section({ id, title, index, editKind, children }) {
  const [ref, isVisible] = useReveal({ threshold: 0.12 });

  return (
    <section id={id} className="section">
      <div
        ref={ref}
        className={`container reveal ${isVisible ? "is-visible" : ""}`}
      >
        <div className="section__head">
          <h2 className="section__title">{title}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
            {index && <span className="section__index">{index}</span>}
            {editKind && <SectionEditButton kind={editKind} />}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
