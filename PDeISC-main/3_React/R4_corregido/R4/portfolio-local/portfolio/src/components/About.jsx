import Section from "./Section";
import "../styles/about.css";

/**
 * About
 * -----
 * Presenta la biografía corta y algunos datos clave ("facts") del perfil.
 */
export default function About({ profile }) {
  return (
    <Section id="sobre-mi" title="Sobre mí" index="01" editKind="profile">
      <div className="about__grid">
        <div className="about__text">
          {profile.bio.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <dl className="about__facts">
          {profile.facts.map((fact) => (
            <div className="about__fact" key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
