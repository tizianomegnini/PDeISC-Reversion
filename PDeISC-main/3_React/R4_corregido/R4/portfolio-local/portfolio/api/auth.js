import jwt from "jsonwebtoken";

export function isAdmin(req) {
  const secret = process.env.JWT_SECRET;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const authorization = req.headers.authorization || "";
  if (!secret || !adminEmail || !authorization.startsWith("Bearer ")) return false;

  try {
    const payload = jwt.verify(authorization.slice(7), secret, { issuer: "portfolio-api" });
    return payload.role === "admin" && payload.sub === adminEmail;
  } catch {
    return false;
  }
}
