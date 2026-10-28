import { isAdmin } from "../auth.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método no permitido" });
  }
  if (!isAdmin(req)) return res.status(401).json({ error: "No autorizado" });
  return res.status(200).json({ ok: true });
}
