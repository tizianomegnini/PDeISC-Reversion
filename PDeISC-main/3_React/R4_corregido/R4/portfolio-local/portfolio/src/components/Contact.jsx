import Section from "./Section";
import "../styles/contact.css";

/**
 * Contact
 * -------
 * Sin formulario a propósito: se reemplazó por enlaces directos
 * (mail, GitHub, LinkedIn) para no depender de un backend de envío
 * de correo que no está configurado.
 */
export default function Contact({ profile }) {
  return (
    <Section id="contacto" title="Contacto" index="06" editKind="profile">
      <div className="contact__links-only">
        <p className="contact__lede">
          ¿Tenés un proyecto en mente o una oportunidad para conversar? Estas son las mejores
          formas de contactarme.
        </p>
        <ul className="contact__list">
          <li>
            <a href={`mailto:${profile.email}`} className="contact__link">
              <span className="contact__link-label">Email</span>
              <span>{profile.email}</span>
            </a>
          </li>
          <li>
            <a href={profile.github} target="_blank" rel="noreferrer" className="contact__link">
              <span className="contact__link-label">GitHub</span>
              <span>{profile.github.replace("https://", "")}</span>
            </a>
          </li>
          <li>
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="contact__link">
              <span className="contact__link-label">LinkedIn</span>
              <span>{profile.linkedin.replace("https://", "")}</span>
            </a>
          </li>
        </ul>
      </div>
    </Section>
  );
}
