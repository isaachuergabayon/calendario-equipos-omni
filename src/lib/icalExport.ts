import type { Absence, AppUser, Team } from '../types'
import { ABSENCE_TYPE_LABELS } from '../types'

function escapeIcal(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/** Returns the day after endDate as an 8-digit string (iCal DTEND is exclusive for DATE values). */
function exclusiveEndDate(endDate: string): string {
  const [y, m, d] = endDate.split('-').map(Number)
  const next = new Date(y, m - 1, d + 1)
  return `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, '0')}${String(next.getDate()).padStart(2, '0')}`
}

export function generateIcal(
  absences: Absence[],
  users: AppUser[],
  teams: Team[],
): string {
  const userMap = Object.fromEntries(users.map(u => [u.uid, u]))
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))

  const dtstamp = new Date()
    .toISOString()
    .replace(/[-:.]/g, '')
    .slice(0, 15) + 'Z'

  const events = absences.map(a => {
    const user      = userMap[a.userId]
    const team      = teamMap[a.teamId]
    const name      = user?.displayName ?? 'Desconocido'
    const teamName  = team?.name ?? ''
    const typeLabel = ABSENCE_TYPE_LABELS[a.type]
    const summary   = teamName
      ? `${name} · ${typeLabel} (${teamName})`
      : `${name} · ${typeLabel}`

    const dtstart = a.startDate.replace(/-/g, '')
    const dtend   = exclusiveEndDate(a.endDate)

    const lines = [
      'BEGIN:VEVENT',
      `UID:${a.id}@calendario-omni`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      `SUMMARY:${escapeIcal(summary)}`,
    ]
    if (a.notes) lines.push(`DESCRIPTION:${escapeIcal(a.notes)}`)
    lines.push('END:VEVENT')
    return lines.join('\r\n')
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calendario Omnichannel//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Ausencias Equipo',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n'
}

export function downloadIcal(content: string, filename = 'ausencias.ics') {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
