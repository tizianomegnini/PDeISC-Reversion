
import { pool, ensureSchema } from "./db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: "Método no permitido",
    });
  }

  try {
    await ensureSchema();
    const [rows] = await pool.query(
      "SELECT 1 AS connected"
    );

    return res.status(200).json({
      ok: true,
      database: "MySQL",
      connected: rows[0].connected === 1,
    });
  } catch (error) {
    console.error("Error de conexión MySQL:", error.message);

    return res.status(500).json({
      ok: false,
      error: "No se pudo conectar con la base de datos",
    });
  }
}
