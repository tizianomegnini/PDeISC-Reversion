import Section from "./Section";
import "../styles/experience.css";

/**
 * Achievements
 * ------------
 * Grilla de logros destacados (premios, certificaciones, métricas).
 */
export default function Achievements({ achievements }) {
  return (
    <Section id="logros" title="Logros" index="04" editKind="achievements">
      <div className="achievements__grid">
        {achievements.map((item) => (
          <article className="achievement card" key={item.id}>
            <p className="achievement__value">{item.value}</p>
            <p className="achievement__label">{item.label}</p>
            <p className="achievement__detail">{item.detail}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
