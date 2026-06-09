/** Convierte una fecha a clave string YYYY-MM-DD */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Días laborables entre startDate y endDate (ambos inclusive).
 *  Excluye fines de semana y las fechas del set de festivos. */
export function countWorkingDays(startDate: string, endDate: string, holidays: Set<string>): number {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const end   = new Date(ey, em - 1, ed)
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6 && !holidays.has(toDateKey(cur))) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}
