import { useEffect, useState } from "react";
import { apiGet, isApiConfigured } from "../lib/apiClient";
import { useEditMode } from "../context/EditModeContext";
import {
  profile as fallbackProfile,
  skillGroups as fallbackSkillGroups,
  achievements as fallbackAchievements,
  experience as fallbackExperience,
  projects as fallbackProjects,
} from "../data/fallbackData";

/**
 * usePortfolioData
 * -----------------
 * Centraliza la carga de TODA la informaciÃ³n del portfolio (perfil,
 * habilidades, logros, experiencia y proyectos) desde la API del proyecto
 * (lib/apiClient.js), usando datos de respaldo si la conexiÃ³n falla.
 * Si algo falla o una lista estÃ¡ vacÃ­a, usa el dato de respaldo
 * correspondiente de src/data/fallbackData.js.
 *
 * TambiÃ©n escucha `changeSignal` de EditModeContext: cada vez que se
 * guarda algo desde uno de los editores (ver components/editors), este
 * hook vuelve a pedir los datos, asÃ­ los cambios se ven al instante sin
 * recargar la pÃ¡gina.
 *
 * @returns {{ data: object, loading: boolean }}
 */
export function usePortfolioData() {
  const { changeSignal } = useEditMode();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    profile: fallbackProfile,
    skillGroups: fallbackSkillGroups,
    achievements: fallbackAchievements,
    experience: fallbackExperience,
    projects: fallbackProjects,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isApiConfigured) {
        setLoading(false);
        return;
      }

      const [profile, skills, achievements, experience, projects] = await Promise.all([
        apiGet("/profile").catch(() => null),
        apiGet("/skills").catch(() => null),
        apiGet("/achievements").catch(() => null),
        apiGet("/experience").catch(() => null),
        apiGet("/projects").catch(() => null),
      ]);

      if (cancelled) return;

      setData({
        profile: profile ?? fallbackProfile,
        skillGroups: skillsToGroups(skills) ?? fallbackSkillGroups,
        achievements: nonEmpty(achievements) ?? fallbackAchievements,
        experience: nonEmpty(experience) ?? fallbackExperience,
        projects: nonEmpty(projects)?.map(projectToUi) ?? fallbackProjects,
      });
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [changeSignal]);

  return { data, loading };
}

function nonEmpty(rows) {
  return rows && rows.length > 0 ? rows : null;
}

function projectToUi(row) {
  return { ...row, repoUrl: row.repo_url, demoUrl: row.demo_url };
}

/** Agrupa la tabla plana "skills" (group_name, name, level) en el formato que usan los componentes. */
function skillsToGroups(rows) {
  if (!rows || rows.length === 0) return null;
  const map = new Map();
  rows.forEach((row) => {
    if (!map.has(row.group_name)) map.set(row.group_name, { id: row.group_name, title: row.group_name, skills: [] });
    map.get(row.group_name).skills.push({ name: row.name, level: row.level });
  });
  return Array.from(map.values());
}

