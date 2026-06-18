/**
 * useAuth
 * Validações compartilhadas entre páginas de autenticação.
 */
export function useAuth() {
  function validatePassword(password: string, confirmPassword: string): string {
    if (password.length < 6) return "Senha deve ter pelo menos 6 caracteres"
    if (password !== confirmPassword) return "Senhas não conferem"
    return ""
  }
  return { validatePassword }
}
