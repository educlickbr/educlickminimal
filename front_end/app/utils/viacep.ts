/**
 * Utilitário de integração com a API ViaCEP
 * https://viacep.com.br/
 */

export interface EnderecoViaCEP {
  logradouro: string   // Endereço (rua, av, etc.)
  bairro: string       // Bairro
  localidade: string   // Cidade
  uf: string           // Estado (UF - 2 letras)
  cep: string          // CEP formatado com hífen
  erro?: boolean       // true se o CEP não foi encontrado
}

/**
 * Mapeia os campos do ViaCEP para os `nome_interno` das nossas perguntas globais
 */
export const VIACEP_FIELD_MAP: Record<keyof Omit<EnderecoViaCEP, 'cep' | 'erro'>, string> = {
  logradouro: 'endereco',
  bairro:     'bairro',
  localidade: 'cidade',
  uf:         'estado',
}

/**
 * Nomes internos dos campos que o CEP preenche automaticamente
 */
export const CEP_DEPENDENT_FIELDS = ['endereco', 'bairro', 'cidade', 'estado']

/**
 * Consulta a API ViaCEP dado um CEP.
 * @param cep - CEP com ou sem formatação
 * @returns Dados do endereço ou null se inválido/não encontrado
 */
export async function buscarCEP(cep: string): Promise<EnderecoViaCEP | null> {
  const limpo = cep.replace(/\D/g, '')

  if (limpo.length !== 8) return null

  try {
    const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`)
    if (!res.ok) return null

    const data: EnderecoViaCEP = await res.json()

    if (data.erro) return null

    return data
  } catch {
    return null
  }
}

/**
 * Formata CEP no padrão 00000-000 enquanto o usuário digita
 */
export function mascaraCEP(valor: string): string {
  const limpo = valor.replace(/\D/g, '').slice(0, 8)
  if (limpo.length <= 5) return limpo
  return `${limpo.slice(0, 5)}-${limpo.slice(5)}`
}
