/**
 * Utilities for handling child age data in profiles.
 * Ages are derived from birthdates when available so they stay up to date.
 */

/**
 * Calculate age from a birthdate string (YYYY-MM-DD).
 */
export function deriveAgeFromBirthdate(birthdate?: string | null): number | null {
  if (!birthdate) return null
  const parsed = new Date(birthdate)
  if (Number.isNaN(parsed.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - parsed.getFullYear()
  const monthDiff = today.getMonth() - parsed.getMonth()
  const dayDiff = today.getDate() - parsed.getDate()
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }

  if (age < 0 || age > 120) return null
  return age
}

/**
 * Calculate age from a birth year (legacy support).
 */
export function deriveAgeFromBirthYear(birthYear?: number | string | null): number | null {
  if (birthYear === null || birthYear === undefined) return null
  const year = typeof birthYear === "string" ? parseInt(birthYear, 10) : birthYear
  if (!Number.isInteger(year)) return null

  const today = new Date()
  const age = today.getFullYear() - year
  if (age < 0 || age > 120) return null
  return age
}

/**
 * Determine the best known age for a child record.
 */
export function deriveAgeFromChild(child: any): number | null {
  if (!child) return null

  const birthdateAge = deriveAgeFromBirthdate(child.birthdate)
  if (birthdateAge !== null) return birthdateAge

  const birthYearAge = deriveAgeFromBirthYear(child.birth_year)
  if (birthYearAge !== null) return birthYearAge

  const age = Number(child?.age)
  if (!Number.isNaN(age) && age >= 0 && age <= 120) {
    return age
  }

  return null
}

/**
 * Helper used when formatting children lists for display.
 */
export function formatChildSummary(child: any): string | null {
  const age = deriveAgeFromChild(child)
  const gender = typeof child?.gender === "string" && child.gender.length > 0
    ? child.gender.charAt(0).toUpperCase() + child.gender.slice(1)
    : null

  if (age !== null && gender) return `${gender} ${age}`
  if (age !== null) return `Age ${age}`
  if (gender) return gender
  if (typeof child?.name === "string" && child.name.trim().length > 0) return child.name.trim()
  return null
}

