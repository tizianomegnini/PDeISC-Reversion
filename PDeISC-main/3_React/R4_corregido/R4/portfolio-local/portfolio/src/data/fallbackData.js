/**
 * Datos de ejemplo del portfolio.
 *
 * IMPORTANTE: reemplazá estos valores por tus datos reales antes de publicar
 * el sitio. Este archivo se usa como respaldo automático si la base local
 * no devuelve datos (ver src/hooks/usePortfolioData.js). El contenido
 * principal vive en src/data/seed.json.
 */

export const profile = {
  name: "Tiziano Riquelme",
  role: "Desarrolladora Frontend",
  location: "Mar del Plata, Argentina",
  summary:
    "Construyo interfaces web prolijas y accesibles. Me interesa el punto donde el diseño y el código se encuentran.",
  bio: [
    "Estudio Ingeniería en Sistemas y trabajo como desarrolladora frontend, enfocada en React y en interfaces cuidadas. Me gusta traducir un problema real en una interfaz simple de usar.",
    "Fuera del código, dedico tiempo a contribuir en proyectos open source y a escribir notas sobre lo que voy aprendiendo.",
  ],
  email: "ada.fernandez@example.com",
  github: "https://github.com/tu-usuario",
  linkedin: "https://linkedin.com/in/tu-usuario",
  facts: [
    { label: "Años programando", value: "3+" },
    { label: "Proyectos entregados", value: "12" },
    { label: "Stack principal", value: "React" },
    { label: "Disponibilidad", value: "Full-time" },
  ],
};

export const skillGroups = [
  {
    id: "frontend",
    title: "Frontend",
    skills: [
      { name: "React", level: 90 },
      { name: "JavaScript (ES6+)", level: 88 },
      { name: "CSS / diseño responsive", level: 85 },
    ],
  },
  {
    id: "backend",
    title: "Backend & datos",
    skills: [
      { name: "Node.js", level: 70 },
      { name: "SQL / Supabase", level: 65 },
      { name: "APIs REST", level: 75 },
    ],
  },
  {
    id: "herramientas",
    title: "Herramientas",
    skills: [
      { name: "Git / GitHub", level: 85 },
      { name: "Figma", level: 60 },
      { name: "Testing (Vitest)", level: 55 },
    ],
  },
];

export const achievements = [
  {
    id: "a1",
    value: "1er puesto",
    label: "Hackathon Universitaria 2025",
    detail: "Proyecto de accesibilidad web, entre 40 equipos.",
  },
  {
    id: "a2",
    value: "+15",
    label: "Contribuciones open source",
    detail: "Pull requests aceptados en proyectos de la comunidad.",
  },
  {
    id: "a3",
    value: "Certificación",
    label: "React avanzado",
    detail: "Curso completo con proyecto final evaluado.",
  },
  {
    id: "a4",
    value: "4.9/5",
    label: "Valoración freelance",
    detail: "Promedio en 20 proyectos entregados.",
  },
];

export const experience = [
  {
    id: "e1",
    role: "Desarrolladora Frontend",
    org: "Estudio Digital SRL",
    period: "2024 — Presente",
    description:
      "Desarrollo de interfaces en React para productos de e-commerce, coordinando con diseño y backend.",
    tags: ["React", "TypeScript", "Vite"],
  },
  {
    id: "e2",
    role: "Pasantía en desarrollo web",
    org: "Cooperativa TechLab",
    period: "2023 — 2024",
    description: "Construcción de landing pages y mantenimiento de un CMS interno.",
    tags: ["JavaScript", "WordPress", "CSS"],
  },
  {
    id: "e3",
    role: "Freelance",
    org: "Proyectos independientes",
    period: "2022 — 2023",
    description: "Sitios a medida para emprendimientos locales, del diseño al despliegue.",
    tags: ["HTML/CSS", "Figma", "Hosting"],
  },
];

export const projects = [
  {
    id: "p1",
    title: "Gestor de tareas colaborativo",
    description: "Tablero estilo Kanban en tiempo real, con autenticación y roles de equipo.",
    tags: ["React", "Supabase", "Realtime"],
    category: "Web app",
    repoUrl: "https://github.com/tu-usuario/proyecto-1",
    demoUrl: "https://ejemplo-demo.vercel.app",
  },
  {
    id: "p2",
    title: "Visualizador de datos climáticos",
    description: "Dashboard con gráficos interactivos a partir de una API pública.",
    tags: ["React", "Charts", "API REST"],
    category: "Dashboard",
    repoUrl: "https://github.com/tu-usuario/proyecto-2",
    demoUrl: "",
  },
  {
    id: "p3",
    title: "Tienda de artesanías",
    description: "E-commerce chico con carrito, checkout simulado y panel de administración.",
    tags: ["React", "Node.js", "SQL"],
    category: "Web app",
    repoUrl: "https://github.com/tu-usuario/proyecto-3",
    demoUrl: "https://ejemplo-tienda.vercel.app",
  },
  {
    id: "p4",
    title: "Identidad visual — estudio Lúmina",
    description: "Sitio de una página para un estudio de diseño, con foco en tipografía.",
    tags: ["React", "Diseño"],
    category: "Landing",
    repoUrl: "https://github.com/tu-usuario/proyecto-4",
    demoUrl: "",
  },
];
