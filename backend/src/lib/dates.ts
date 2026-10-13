/**
 * Даты контракта: ISO-8601 UTC с `Z` и секундами (docs/spec.md §3),
 * без миллисекунд — `2026-10-13T10:00:00Z`.
 */
export function toIsoUtc(value: Date | number): string {
  const date = typeof value === 'number' ? new Date(value) : value
  return `${date.toISOString().slice(0, 19)}Z`
}

export function epochMs(value: string | Date): number {
  return value instanceof Date ? value.getTime() : Date.parse(value)
}

export function isValidIsoUtc(value: string): boolean {
  return Number.isFinite(Date.parse(value))
}
