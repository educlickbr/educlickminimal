// composables/useCargaHoraria.ts
// Conversão entre formato HH:MM (display) e minutos (banco de dados)

export function useCargaHoraria() {
  /** Converte "2:30" ou "02:30" → 150 (minutos) */
  function toMinutos(hhmm: string | null | undefined): number | null {
    if (!hhmm || typeof hhmm !== 'string') return null
    const match = hhmm.match(/^(\d{1,3}):(\d{2})$/)
    if (!match) return null
    const horas = parseInt(match[1]!, 10)
    const minutos = parseInt(match[2]!, 10)
    if (minutos >= 60) return null
    return horas * 60 + minutos
  }

  /** Converte 150 (minutos) → "2:30" */
  function toHHMM(minutos: number | null | undefined): string {
    if (minutos == null || minutos < 0) return ''
    const h = Math.floor(minutos / 60)
    const m = minutos % 60
    return `${h}:${String(m).padStart(2, '0')}`
  }

  /** Valida se a string HH:MM é válida */
  function isValid(hhmm: string | null | undefined): boolean {
    if (!hhmm) return true // campo opcional
    return /^\d{1,3}:\d{2}$/.test(hhmm) && parseInt(hhmm.split(':')[1]!) < 60
  }

  /** Máscara automática enquanto o usuário digita */
  function mascara(valor: string): string {
    const numeros = valor.replace(/\D/g, '')
    if (numeros.length <= 2) return numeros
    const h = numeros.slice(0, numeros.length - 2)
    const m = numeros.slice(-2)
    return `${h}:${m}`
  }

  return { toMinutos, toHHMM, isValid, mascara }
}
