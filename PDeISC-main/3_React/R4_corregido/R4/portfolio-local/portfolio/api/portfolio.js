
import { pool, ensureSchema } from "./db.js";
import { isAdmin } from "./auth.js";

const DOCUMENT_ID = "main";

export default async function handler(req, res) {
  try {
    await ensureSchema();

    if (req.method === "GET") {
      const [rows] = await pool.execute(
        "SELECT content FROM portfolio_content WHERE id = ?",
        [DOCUMENT_ID]
      );

      return res.status(200).json(
        rows.length ? rows[0].content : null
      );
    }

    if (req.method === "POST" || req.method === "PUT") {
      if (!isAdmin(req)) {
        return res.status(401).json({
          error: "No autorizado",
        });
      }

      const content = req.body?.content;

      if (
        !content ||
        typeof content !== "object" ||
        Array.isArray(content) ||
        !content.profile ||
        typeof content.profile !== "object" ||
        Array.isArray(content.profile) ||
        !Array.isArray(content.skills) ||
        !Array.isArray(content.achievements) ||
        !Array.isArray(content.experience) ||
        !Array.isArray(content.projects)
      ) {
        return res.status(400).json({
          error: "El documento del portfolio no tiene el formato esperado",
        });
      }

      await pool.execute(
        `INSERT INTO portfolio_content (id, content)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE content = VALUES(content)`,
        [DOCUMENT_ID, JSON.stringify(content)]
      );

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, PUT");
    return res.status(405).json({
      error: "Método no permitido",
    });
  } catch (error) {
    console.error("Error en portfolio API:", error.message);

    return res.status(500).json({
      error: "Error al procesar la operación del portfolio",
    });
  }
}
