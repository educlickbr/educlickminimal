import { formatInTimeZone, fromZonedTime } from "date-fns-tz"
import { ptBR } from "date-fns/locale"

const TIMEZONE = "America/Sao_Paulo"

/**
 * Formata uma data (string ISO ou Date) para o timezone America/Sao_Paulo.
 * @example formatDate("2026-07-03T21:00:00.000Z") → "03/07/2026"
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = "dd/MM/yyyy",
): string {
  if (!date) return ""
  try {
    let d: Date
    if (typeof date === "string") {
      // "2026-01-16" (10 chars, apenas data) → força meio-dia pra evitar shift de timezone
      if (date.trim().length === 10) {
        d = new Date(date.trim() + "T12:00:00")
      } else {
        d = new Date(date.trim().replace(" ", "T"))
      }
    } else {
      d = date
    }
    if (isNaN(d.getTime())) return ""
    return formatInTimeZone(d, TIMEZONE, formatStr, { locale: ptBR })
  } catch {
    return ""
  }
}

/**
 * @example formatDateTime("2026-07-03T21:00:00.000Z") → "03/07/2026 18:00"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, "dd/MM/yyyy HH:mm")
}

/**
 * Converte ISO UTC → formato datetime-local (YYYY-MM-DDTHH:mm) em America/Sao_Paulo.
 * Útil para preencher `<input type="datetime-local">` na edição.
 * @example toInputDateTimeLocal("2026-07-03T21:00:00.000Z") → "2026-07-03T18:00"
 */
export function toInputDateTimeLocal(date: string | Date | null | undefined): string {
  if (!date) return ""
  try {
    let d: Date
    if (typeof date === "string") {
      if (date.trim().length === 10) {
        d = new Date(date.trim() + "T12:00:00")
      } else {
        d = new Date(date.trim().replace(" ", "T"))
      }
    } else {
      d = date
    }
    if (isNaN(d.getTime())) return ""
    return formatInTimeZone(d, TIMEZONE, "yyyy-MM-dd'T'HH:mm")
  } catch {
    return ""
  }
}

/**
 * Converte valor do input datetime-local (America/Sao_Paulo) → ISO UTC.
 * Útil para enviar ao banco como TIMESTAMPTZ.
 * @example fromInputToIso("2026-07-03T18:00") → "2026-07-03T21:00:00.000Z"
 */
export function fromInputToIso(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  try {
    const utcDate = fromZonedTime(dateStr, TIMEZONE)
    return utcDate.toISOString()
  } catch {
    return null
  }
}
