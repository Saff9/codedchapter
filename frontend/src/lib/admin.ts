export function isAdminEmail(email?: string | null): boolean {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return email === adminEmail;
}
