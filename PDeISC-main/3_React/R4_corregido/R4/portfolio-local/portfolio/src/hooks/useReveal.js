import { useEffect, useRef, useState } from "react";

/**
 * useReveal
 * ---------
 * Hook reutilizable que detecta cuándo un elemento entra en el viewport
 * usando IntersectionObserver, para disparar la animación de "revelado"
 * definida en la clase CSS `.reveal` / `.is-visible` (ver src/index.css).
 *
 * @param {Object} [options]
 * @param {number} [options.threshold=0.15] - Porcentaje visible necesario para activar.
 * @param {boolean} [options.once=true] - Si es true, deja de observar tras la primera aparición.
 * @returns {[React.RefObject, boolean]} ref para asignar al elemento, y si ya es visible.
 */
export function useReveal({ threshold = 0.15, once = true } = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Si el navegador no soporta IntersectionObserver, mostramos el contenido directamente.
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, once]);

  return [ref, isVisible];
}
