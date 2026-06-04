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
  onSelectSlot: (start: Date, end: Date) => void
  onSelectEvent: (absenceId: string, userId: string) => void
}

const HOLIDAY_COLORS: Record<Holiday['type'], string> = {
  national: '#dc2626',
  regional: '#d97706',
  local:    '#2563eb',
}

export default function CalendarView({
  absences,
  users,
  teams,
  selectedTeams,
  holidays,
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

  const absenceEvents: CalendarEvent[] = filtered.map(absence => {
    const user = userMap[absence.userId]
    const team = teamMap[absence.teamId]
    const label = ABSENCE_TYPE_LABELS[absence.type]
    const name = user?.displayName ?? 'Desconocido'

    const [sy, sm, sd] = absence.startDate.split('-').map(Number)
    const [ey, em, ed] = absence.endDate.split('-').map(Number)
    const start = new Date(sy, sm - 1, sd)
    const end = new Date(ey, em - 1, ed + 1)

    return {
      id: absence.id,
      title: `${name} · ${label}`,
      start,
      end,
      color: team?.color ?? user?.color ?? '#888',
      absenceId: absence.id,
      userId: absence.userId,
    }
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
          if (type) return { className: `rbc-day-${type}` }
          return {}
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
