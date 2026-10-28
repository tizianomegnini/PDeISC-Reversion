import { useMemo, useState } from "react";
import Section from "./Section";
import "../styles/projects.css";

/**
 * Projects
 * --------
 * Grilla de proyectos con filtro interactivo por categoría.
 *  - useState guarda la categoría activa ("Todos" por defecto).
 *  - useMemo evita recalcular la lista filtrada en cada render salvo que
 *    cambien los proyectos o el filtro seleccionado.
 *  - El click en cada chip de filtro es el evento que dispara el cambio de estado.
 */
export default function Projects({ projects, loading }) {
  const [activeCategory, setActiveCategory] = useState("Todos");

  const categories = useMemo(() => {
    const unique = new Set(projects.map((p) => p.category).filter(Boolean));
    return ["Todos", ...unique];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (activeCategory === "Todos") return projects;
    return projects.filter((p) => p.category === activeCategory);
  }, [projects, activeCategory]);

  return (
    <Section id="proyectos" title="Proyectos" index="05" editKind="projects">
      {loading && <p className="projects__status">Cargando proyectos…</p>}

      <div className="projects__filters" role="tablist" aria-label="Filtrar proyectos por categoría">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={activeCategory === category}
            className={`projects__filter ${
              activeCategory === category ? "projects__filter--active" : ""
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {filteredProjects.length === 0 ? (
        <p className="projects__empty">No hay proyectos en esta categoría todavía.</p>
      ) : (
        <div className="projects__grid">
          {filteredProjects.map((project) => (
            <article className="project card" key={project.id}>
              <h3 className="project__title">{project.title}</h3>
              <p className="project__desc">{project.description}</p>
              <div className="project__tags">
                {(project.tags ?? []).map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className="project__links">
                {project.repoUrl && (
                  <a href={project.repoUrl} target="_blank" rel="noreferrer">
                    Código →
                  </a>
                )}
                {project.demoUrl && (
                  <a href={project.demoUrl} target="_blank" rel="noreferrer">
                    Demo en vivo →
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}
