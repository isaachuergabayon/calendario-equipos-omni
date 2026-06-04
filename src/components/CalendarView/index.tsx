import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import type { Absence, AppUser, Team } from '../../types'
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
}

interface Props {
  absences: Absence[]
  users: AppUser[]
  teams: Team[]
  selectedTeams: string[]
  onSelectSlot: (start: Date, end: Date) => void
  onSelectEvent: (absenceId: string, userId: string) => void
}

export default function CalendarView({
  absences,
  users,
  teams,
  selectedTeams,
  onSelectSlot,
  onSelectEvent,
}: Props) {
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))
  const userMap = Object.fromEntries(users.map(u => [u.uid, u]))

  const filtered = selectedTeams.length > 0
    ? absences.filter(a => selectedTeams.includes(a.teamId))
    : absences

  const events: CalendarEvent[] = filtered.map(absence => {
    const user = userMap[absence.userId]
    const team = teamMap[absence.teamId]
    const label = ABSENCE_TYPE_LABELS[absence.type]
    const name = user?.displayName ?? 'Desconocido'

    // end date in big-calendar is exclusive for all-day events
    const endDate = new Date(absence.endDate)
    endDate.setDate(endDate.getDate() + 1)

    return {
      id: absence.id,
      title: `${name} · ${label}`,
      start: new Date(absence.startDate),
      end: endDate,
      color: team?.color ?? user?.color ?? '#888',
      absenceId: absence.id,
      userId: absence.userId,
    }
  })

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
        onSelectEvent={ev => onSelectEvent(ev.absenceId, ev.userId)}
        eventPropGetter={ev => ({
          style: {
            backgroundColor: ev.color,
            borderColor: ev.color,
            color: '#fff',
            borderRadius: '4px',
            fontSize: '0.78rem',
          },
        })}
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
