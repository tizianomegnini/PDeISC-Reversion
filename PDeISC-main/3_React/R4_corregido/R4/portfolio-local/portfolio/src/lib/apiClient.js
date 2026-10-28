import seed from "../data/seed.json";

const API_BASE = "/api";
const SESSION_KEY = "portfolio-api-token";

export const isApiConfigured = true;

const clone = (value) => JSON.parse(JSON.stringify(value));

function readToken() {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function request(path, { method = "GET", body, token } = {}) {
  return fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }).catch(() => {
    throw new Error("No se pudo contactar la API. En local, iniciá el proyecto con `npx vercel dev`; en el sitio publicado, revisá que Vercel haya desplegado la carpeta del portfolio.");
  }).then(async (response) => {
    const text = await response.text();
    let result = null;
    let isJson = false;
    try {
      result = text ? JSON.parse(text) : null;
      isJson = Boolean(text);
    } catch {
      // Puede ser HTML si la plataforma no encontró la función API.
    }
    if (!response.ok) {
      if (result?.error) throw new Error(result.error);
      if (response.status === 404) {
        throw new Error(`No se encontró ${API_BASE}${path}. En local usá npx vercel dev; en Vercel revisá que la carpeta raíz sea portfolio y volvé a desplegar.`);
      }
      throw new Error(`La API respondió ${response.status} sin un mensaje válido. Revisá los registros de Functions en Vercel.`);
    }
    if (text && !isJson) {
      throw new Error("La API devolvió una respuesta que no es JSON. Revisá el deployment de Vercel.");
    }
    return result;
  });
}

const mergedSeed = (data) => ({ ...clone(seed), ...(data || {}) });

const RESOURCES = {
  skills: { columns: ["group_name", "name", "level", "sort_order"], json: [], order: "sort" },
  experience: { columns: ["role", "org", "period", "description", "tags"], json: ["tags"], order: "idDesc" },
  achievements: { columns: ["value", "label", "detail"], json: [], order: "idDesc" },
  projects: { columns: ["title", "description", "category", "tags", "repo_url", "demo_url"], json: ["tags"], order: "idDesc" },
};
const PROFILE_COLUMNS = ["name", "role", "location", "summary", "bio", "email", "github", "linkedin", "facts"];

function sorted(name, rows) {
  const copy = [...rows];
  return RESOURCES[name].order === "sort"
    ? copy.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id)
    : copy.sort((a, b) => b.id - a.id);
}

function pickColumns(resource, body = {}) {
  const row = {};
  resource.columns.forEach((col) => {
    const value = body[col];
    row[col] = resource.json.includes(col) ? (Array.isArray(value) ? value : []) : value ?? null;
  });
  return row;
}

export function getToken() {
  return readToken();
}

export function setToken(token) {
  try {
    localStorage.setItem(SESSION_KEY, token);
  } catch {
    throw new Error("No se pudo guardar la sesión en este navegador.");
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // La sesión local ya no puede volver a usarse si el navegador bloquea el almacenamiento.
  }
}

async function getDocument(token) {
  return (await request("/portfolio", { token })) ?? null;
}

async function saveDocument(content, token) {
  await request("/portfolio", { method: "PUT", body: { content }, token });
}

export async function apiGet(path) {
  const name = path.replace(/^\//, "");
  if (name !== "profile" && !RESOURCES[name]) throw new Error(`Recurso desconocido: ${path}`);
  const data = mergedSeed(await getDocument());
  if (name === "profile") return clone(data.profile ?? null);
  return clone(sorted(name, data[name] ?? []));
}

export async function apiAuthed(path, method, body) {
  const token = getToken();
  if (!token) throw new Error("La sesión venció. Volvé a ingresar.");
  if (path === "/admin/me" && method === "GET") return request("/admin/me", { token });

  const [name, id] = path.replace(/^\//, "").split("/");
  const document = mergedSeed(await getDocument(token));
  if (name === "profile") {
    if (method !== "PUT") throw new Error(`Método no soportado: ${method}`);
    const profile = {};
    PROFILE_COLUMNS.forEach((col) => {
      const value = body?.[col];
      profile[col] = col === "bio" || col === "facts" ? (Array.isArray(value) ? value : []) : value ?? "";
    });
    document.profile = { id: 1, ...profile };
  } else {
    const resource = RESOURCES[name];
    if (!resource) throw new Error(`Recurso desconocido: ${path}`);
    const rows = document[name] ?? [];
    if (method === "POST") {
      const newId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
      document[name] = [...rows, { id: newId, ...pickColumns(resource, body) }];
      await saveDocument(document, token);
      return { id: newId };
    }
    const numericId = Number(id);
    if (method === "PUT") document[name] = rows.map((row) => row.id === numericId ? { id: row.id, ...pickColumns(resource, body) } : row);
    else if (method === "DELETE") document[name] = rows.filter((row) => row.id !== numericId);
    else throw new Error(`Método no soportado: ${method}`);
  }
  await saveDocument(document, token);
  return { ok: true };
}

export async function apiLogin(password) {
  if (!password) throw new Error("Falta la contraseña.");
  const session = await request("/login", {
    method: "POST",
    body: { password },
  });
  if (!session?.access_token) throw new Error("La API no devolvió una sesión válida. Revisá la función /api/login en Vercel.");
  setToken(session.access_token);
  return session.access_token;
}

export async function exportData() {
  return mergedSeed(await getDocument());
}

export async function importData(data) {
  if (!data || typeof data !== "object" || typeof data.profile !== "object") {
    throw new Error("El archivo no tiene el formato esperado.");
  }
  const next = { profile: data.profile };
  for (const name of Object.keys(RESOURCES)) {
    if (!Array.isArray(data[name])) throw new Error(`Falta la lista "${name}" en el archivo.`);
    next[name] = data[name];
  }
  const token = getToken();
  if (!token) throw new Error("La sesión venció. Volvé a ingresar.");
  await saveDocument(next, token);
}

export async function resetData() {
  const token = getToken();
  if (!token) throw new Error("La sesión venció. Volvé a ingresar.");
  await saveDocument(clone(seed), token);
}
