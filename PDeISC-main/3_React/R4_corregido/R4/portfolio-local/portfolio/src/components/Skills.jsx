import Section from "./Section";
import "../styles/about.css";

/**
 * Skills
 * ------
 * Muestra las habilidades agrupadas por categoría, con una barra de
 * progreso por cada una. La barra se anima vía CSS (transition de "width")
 * apenas la sección entra en pantalla: el nivel se pasa como variable CSS
 * inline "--level", y la clase "is-visible" (agregada por el componente
 * Section a través de useReveal) es la que dispara la transición.
 */
export default function Skills({ skillGroups }) {
  return (
    <Section id="habilidades" title="Habilidades" index="02" editKind="skills">
      <div className="skills__groups">
        {skillGroups.map((group) => (
          <div key={group.id}>
            <h3 className="skills__group-title">{group.title}</h3>
            {group.skills.map((skill) => (
              <div className="skill" key={skill.name}>
                <div className="skill__row">
                  <strong>{skill.name}</strong>
                  <span>{skill.level}%</span>
                </div>
                <div className="skill__bar">
                  <div
                    className="skill__bar-fill"
                    style={{ "--level": `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}
