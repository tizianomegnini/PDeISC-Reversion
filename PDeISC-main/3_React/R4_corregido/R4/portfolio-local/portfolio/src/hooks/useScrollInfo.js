import { useEffect, useState } from "react";

/**
 * useScrollInfo
 * -------------
 * Escucha el evento "scroll" de la ventana (addEventListener/removeEventListener,
 * con cleanup correcto en el useEffect) y devuelve:
 *  - `scrolled`: true una vez que el usuario bajó más de 40px (usado por el
 *     Navbar para mostrar el fondo con blur).
 *  - `activeId`: el id de la sección actualmente más visible, comparando la
 *     posición de cada <section id="..."> contra la altura del viewport
 *     (usado para resaltar el link correspondiente en el Navbar).
 *
 * @param {string[]} sectionIds - ids de las secciones a observar, en orden.
 */
export function useScrollInfo(sectionIds) {
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState(sectionIds[0] ?? null);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 40);

      const offset = window.innerHeight * 0.35;
      let current = sectionIds[0];

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - offset <= 0) {
          current = id;
        }
      }
      setActiveId(current);
    }

    handleScroll(); // estado inicial
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIds.join(",")]);

  return { scrolled, activeId };
}
