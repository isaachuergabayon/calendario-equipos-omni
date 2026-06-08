import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import type { Absence, AppUser, Team, Holiday } from '../../types'
import { ABSENCE_TYPE_LABELS } from '../../types'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { es },
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  color: string
  absenceId: string
  userId: string
  isHoliday?: boolean
  holidayType?: Holiday['type']
}

interface Props {
  absences: Absence[]
  users: AppUser[]
  teams: Team[]
  selectedTeams: string[]
  holidays: Holiday[]
  userHolidayMaps: Map<string, Set<string>>
  onSelectSlot: (start: Date, end: Date) => void
  onSelectEvent: (absenceId: string, userId: string) => void
}

const HOLIDAY_COLORS: Record<Holiday['type'], string> = {
  national: '#dc2626',
  regional: '#d97706',
  local:    '#2563eb',
}

// Divide un rango de fechas en segmentos de días laborables consecutivos,
// saltando fines de semana y cualquier fecha del set de festivos.
function getWorkingDaySegments(
  startDate: string,
  endDate: string,
  holidaySet: Set<string>,
): Array<{ start: Date; end: Date }> {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const rangeStart = new Date(sy, sm - 1, sd)
  const rangeEnd   = new Date(ey, em - 1, ed)

  const segments: Array<{ start: Date; end: Date }> = []
  let segStart: Date | null = null
  const cur = new Date(rangeStart)

  while (cur <= rangeEnd) {
    const dow = cur.getDay()
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
    const isWorking = dow !== 0 && dow !== 6 && !holidaySet.has(key)

    if (isWorking) {
      if (!segStart) segStart = new Date(cur)
    } else {
      if (segStart) {
        // end es exclusivo en react-big-calendar → día actual (primer no-laborable)
        segments.push({ start: segStart, end: new Date(cur) })
        segStart = null
      }
    }
    cur.setDate(cur.getDate() + 1)
  }

  // Cerrar el último segmento abierto
  if (segStart) {
    const excEnd = new Date(rangeEnd)
    excEnd.setDate(excEnd.getDate() + 1)
    segments.push({ start: segStart, end: excEnd })
  }

  return segments
}

export default function CalendarView({
  absences,
  users,
  teams,
  selectedTeams,
  holidays,
  userHolidayMaps,
  onSelectSlot,
  onSelectEvent,
}: Props) {
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))
  const userMap = Object.fromEntries(users.map(u => [u.uid, u]))

  // Build a set of holiday dates per type for dayPropGetter
  const holidayMap = new Map<string, Holiday['type']>()
  for (const h of holidays) {
    // national wins over regional wins over local if same date
    const existing = holidayMap.get(h.date)
    if (!existing || h.type === 'national' || (h.type === 'regional' && existing === 'local')) {
      holidayMap.set(h.date, h.type)
    }
  }

  const filtered = selectedTeams.length > 0
    ? absences.filter(a => selectedTeams.includes(a.teamId))
    : absences

  const absenceEvents: CalendarEvent[] = filtered.flatMap(absence => {
    const user  = userMap[absence.userId]
    const team  = teamMap[absence.teamId]
    const label = ABSENCE_TYPE_LABELS[absence.type]
    const name  = user?.displayName ?? 'Desconocido'
    const color = team?.color ?? user?.color ?? '#888'

    if (absence.type === 'vacation') {
      // Dividir en segmentos laborables: no pintar sábados, domingos ni festivos
      // Usamos los festivos exactos del usuario (su ciudad), no el set global
      const userHols = userHolidayMaps.get(absence.userId) ?? new Set<string>()
      const segments = getWorkingDaySegments(absence.startDate, absence.endDate, userHols)
      return segments.map(({ start, end }) => ({
        id: `${absence.id}-${start.getTime()}`,
        title: `${name} · ${label}`,
        start,
        end,
        color,
        absenceId: absence.id,
        userId: absence.userId,
      }))
    }

    const [sy, sm, sd] = absence.startDate.split('-').map(Number)
    const [ey, em, ed] = absence.endDate.split('-').map(Number)
    return [{
      id: absence.id,
      title: `${name} · ${label}`,
      start: new Date(sy, sm - 1, sd),
      end:   new Date(ey, em - 1, ed + 1),
      color,
      absenceId: absence.id,
      userId: absence.userId,
    }]
  })

  const holidayEvents: CalendarEvent[] = holidays.map(h => {
    const [y, m, d] = h.date.split('-').map(Number)
    const day = new Date(y, m - 1, d)
    return {
      id: `holiday-${h.date}-${h.type}`,
      title: h.name,
      start: day,
      end: new Date(y, m - 1, d + 1), // exclusive end for all-day
      color: HOLIDAY_COLORS[h.type],
      absenceId: '',
      userId: '',
      isHoliday: true,
      holidayType: h.type,
    }
  })

  const events = [...holidayEvents, ...absenceEvents]

  return (
    <div className="calendar-wrapper">
      <Calendar
        localizer={localizer}
        events={events}
        defaultView="month"
        views={['month', 'week']}
        culture="es"
        selectable
        onSelectSlot={({ start, end }) => onSelectSlot(start, end)}
        onSelectEvent={ev => {
          if (ev.isHoliday) return
          onSelectEvent(ev.absenceId, ev.userId)
        }}
        dayPropGetter={date => {
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          const type = holidayMap.get(key)
          const isWeekend = date.getDay() === 0 || date.getDay() === 6
          const classes = [
            type && `rbc-day-${type}`,
            isWeekend && 'rbc-day-weekend',
          ].filter(Boolean) as string[]
          return classes.length ? { className: classes.join(' ') } : {}
        }}
        eventPropGetter={ev => {
          if (ev.isHoliday) {
            return {
              style: {
                backgroundColor: ev.color,
                borderColor: ev.color,
                color: '#fff',
                borderRadius: '4px',
                fontSize: '0.72rem',
                cursor: 'default',
                opacity: 0.85,
              },
            }
          }
          return {
            style: {
              backgroundColor: ev.color,
              borderColor: ev.color,
              color: '#fff',
              borderRadius: '4px',
              fontSize: '0.78rem',
            },
          }
        }}
        messages={{
          today: 'Hoy',
          previous: '‹',
          next: '›',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
          noEventsInRange: 'Sin ausencias en este periodo.',
        }}
      />
    </div>
  )
}
