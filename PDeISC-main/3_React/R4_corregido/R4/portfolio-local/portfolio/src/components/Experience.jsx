import Section from "./Section";
import "../styles/experience.css";

/**
 * Experience
 * ----------
 * Línea de tiempo con la experiencia laboral, ordenada de la más reciente
 * a la más antigua (el orden lo resuelve usePortfolioData / la base local).
 */
export default function Experience({ experience }) {
  return (
    <Section id="experiencia" title="Experiencia" index="03" editKind="experience">
      <ol className="timeline">
        {experience.map((item, i) => (
          <li className="timeline__item" key={item.id}>
            <span className="timeline__index" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="timeline__head">
              <h3 className="timeline__role">{item.role}</h3>
              <span className="timeline__org">{item.org}</span>
              <span className="timeline__period">{item.period}</span>
            </div>
            <p className="timeline__desc">{item.description}</p>
            <div className="timeline__tags">
              {(item.tags ?? []).map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
