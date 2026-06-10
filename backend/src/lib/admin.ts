import type { Auth } from "../middlewares/authMiddleware";

export function isAdmin(auth: Auth): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  return auth.email === adminEmail;
}
