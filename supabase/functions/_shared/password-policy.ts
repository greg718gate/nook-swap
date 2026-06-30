/** VelvetBazzar password rules (Supabase Auth stores bcrypt hash). */
export function validatePassword(password: string): string | null {
  if (typeof password !== "string" || password.length < 10) {
    return "Password must be at least 10 characters";
  }
  if (password.length > 128) {
    return "Password is too long";
  }
  if (!/[a-zA-Z]/.test(password)) {
    return "Password must include at least one letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number";
  }
  return null;
}
