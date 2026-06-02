/**
 * Utilitário de validação e formatação de CPF
 */

/**
 * Remove caracteres não numéricos do CPF
 */
export function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Formata o CPF dinamicamente no padrão 000.000.000-00
 */
export function formatarCPF(cpf: string): string {
  const limpo = limparCPF(cpf)
  if (!limpo) return ''
  
  if (limpo.length <= 3) return limpo
  if (limpo.length <= 6) return `${limpo.slice(0, 3)}.${limpo.slice(3)}`
  if (limpo.length <= 9) return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6)}`
  
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9, 11)}`
}

/**
 * Valida CPF verificando os dígitos verificadores.
 * Retorna true se o CPF for válido.
 */
export function validarCPF(cpf: string): boolean {
  const limpo = limparCPF(cpf)

  if (limpo.length !== 11) return false

  // Descarta CPFs com todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(limpo)) return false

  // Validação do 1º dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo[i] ?? '0') * (10 - i)
  }
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(limpo[9] ?? '0')) return false

  // Validação do 2º dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo[i] ?? '0') * (11 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(limpo[10] ?? '0')) return false

  return true
}

/**
 * Aplica máscara de CPF enquanto o usuário digita
 * Use em @input para formatar progressivamente
 */
export function mascaraCPF(valor: string): string {
  const limpo = limparCPF(valor).slice(0, 11)
  if (limpo.length <= 3) return limpo
  if (limpo.length <= 6) return `${limpo.slice(0, 3)}.${limpo.slice(3)}`
  if (limpo.length <= 9) return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6)}`
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9)}`
}
