import "../styles/hero.css";
import SectionEditButton from "./SectionEditButton";

/**
 * Hero
 * ----
 * Primera sección visible. Contiene la única animación de entrada
 * "automática" del sitio (título escalonado, ver src/styles/hero.css),
 * a propósito, para que se sienta como un único momento cuidado y no
 * como movimiento repetido en cada sección.
 */
export default function Hero({ profile }) {
  return (
    <section id="inicio" className="hero">
      <div className="container hero__grid">
        <div>
          <p className="hero__eyebrow">
            <span className="hero__dot" aria-hidden="true" />
            Disponible para nuevos proyectos
          </p>

          <div style={{ marginBottom: "0.75rem" }}>
            <SectionEditButton kind="profile" label="Editar perfil" />
          </div>

          <h1 className="hero__title">
            <span>Hola, soy</span> <span>{profile.name}.</span>{" "}
            <span>{profile.role}.</span>
          </h1>

          <p className="hero__lede">{profile.summary}</p>

          <div className="hero__actions">
            <a href="#proyectos" className="btn btn--primary">
              Ver proyectos
            </a>
            <a href="#contacto" className="btn">
              Contactarme
            </a>
          </div>
        </div>

        <dl className="hero__meta">
          <div>
            <dt className="visually-hidden">Ubicación</dt>
            <dd>{profile.location}</dd>
          </div>
          <div>
            <dt className="visually-hidden">Email</dt>
            <dd>{profile.email}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
