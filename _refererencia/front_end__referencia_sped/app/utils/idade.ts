export const parseIsoDate = (value: string): Date | null => {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date
}

export const calculateAgeFromDate = (birthDate: Date, now = new Date()): number | null => {
  if (Number.isNaN(birthDate.getTime())) return null

  let age = now.getFullYear() - birthDate.getFullYear()
  const monthDiff = now.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--
  }

  return age >= 0 ? age : null
}

export const calculateAgeFromIso = (value: string, now = new Date()): number | null => {
  const birthDate = parseIsoDate(value)
  if (!birthDate) return null

  return calculateAgeFromDate(birthDate, now)
}
