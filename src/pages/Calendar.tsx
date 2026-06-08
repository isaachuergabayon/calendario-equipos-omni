import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { useAuth } from '../context/useAuth'
import { useAbsences } from '../hooks/useAbsences'
import { useTeams } from '../hooks/useTeams'
import { useUsers } from '../hooks/useUsers'
import { useHolidays, buildHolidays } from '../hooks/useHolidays'
import { LOCATIONS, type LocationKey } from '../lib/locations'
import CalendarView from '../components/CalendarView'
import TeamFilter from '../components/TeamFilter'
import AbsenceModal from '../components/AbsenceModal'
import type { Absence } from '../types'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useNavigate } from 'react-router-dom'

export default function CalendarPage() {
  const { appUser } = useAuth()
  const { absences, loading, reload } = useAbsences()
  const { teams } = useTeams()
  const { users, isOnline } = useUsers()
  const navigate = useNavigate()

  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modal, setModal] = useState<{
    absence: Absence | null
    defaultStart?: string
    defaultEnd?: string
    isOwner: boolean
    ownerName?: string
  } | null>(null)

  // Cities of users currently visible in the calendar
  const activeCities = useMemo<LocationKey[]>(() => {
    const visibleUsers = selectedTeams.length > 0
      ? users.filter(u => selectedTeams.includes(u.teamId))
      : users
    const cities = new Set<LocationKey>(
      visibleUsers
        .map(u => u.city)
        .filter((c): c is LocationKey => !!c && c in LOCATIONS)
    )
    // Always include the current user's city so national holiday blocking works
    if (appUser?.city && appUser.city in LOCATIONS) {
      cities.add(appUser.city as LocationKey)
    }
    return [...cities]
  }, [users, selectedTeams, appUser])

  const { holidays } = useHolidays(activeCities)

  // Festivos del usuario actual (nacionales + regionales + locales de su ciudad)
  // Usados para calcular días laborables en vacaciones y bloquear si no hay ninguno
  const userHolidayDates = useMemo(() => {
    if (!appUser?.city || !(appUser.city in LOCATIONS)) {
      // Sin ciudad configurada: solo nacionales ES como fallback
      return new Set(
        holidays
          .filter(h => h.type === 'national' && h.countryCode === 'ES')
          .map(h => h.date)
      )
    }
    const userCity = appUser.city as LocationKey
    const currentYear = new Date().getFullYear()
    // buildHolidays usa rawCache ya poblado por useHolidays, no hace fetch adicional
    return new Set(
      buildHolidays([userCity], [currentYear, currentYear + 1]).map(h => h.date)
    )
  }, [holidays, appUser])

  function toggleTeam(teamId: string) {
    setSelectedTeams(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    )
  }

  function handleSelectSlot(start: Date, end: Date) {
    const adjustedEnd = new Date(end)
    adjustedEnd.setDate(adjustedEnd.getDate() - 1)
    setModal({
      absence: null,
      defaultStart: format(start, 'yyyy-MM-dd'),
      defaultEnd: format(adjustedEnd, 'yyyy-MM-dd'),
      isOwner: true,
    })
  }

  function handleSelectEvent(absenceId: string, userId: string) {
    const absence = absences.find(a => a.id === absenceId) ?? null
    const owner = users.find(u => u.uid === userId)
    setModal({ absence, isOwner: userId === appUser?.uid, ownerName: owner?.displayName })
  }

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  if (loading) return <div className="loading">Cargando calendario…</div>

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          {/* Hamburger — mobile only */}
          <button className="btn-hamburger" onClick={() => setSidebarOpen(v => !v)} aria-label="Menú equipos">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect y="3" width="18" height="2" rx="1" fill="white"/>
              <rect y="8" width="18" height="2" rx="1" fill="white"/>
              <rect y="13" width="18" height="2" rx="1" fill="white"/>
            </svg>
          </button>
          <h1>
            <svg width="28" height="28" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" style={{ verticalAlign: 'middle', marginRight: '0.45rem', marginBottom: '2px', display: 'inline-block', flexShrink: 0 }}>
              <path d="M58.1 19.6c-9.8-6-25-14.8-27.1-14.8c-2.1 0-16.7 8.9-26 14.8l-.5-.9C6.9 17.2 28 3.8 31 3.8s25.1 13.4 27.6 15l-.5.8" fill="#ba9372"/>
              <path d="M62 56.8c0 1.6-1.2 3-2.7 3H6.8c-1.5 0-2.7-1.3-2.7-3V21.1c0-1.6 1.2-3 2.7-3h52.5c1.5 0 2.7 1.3 2.7 3v35.7" fill="#93a2aa"/>
              <path d="M60 21.1c0-1.6-1.2-3-2.7-3H4.7c-1.5 0-2.7 1.3-2.7 3v9.5h58v-9.5z" fill="#ed4c5c"/>
              <path d="M2 30.6v26.2c0 1.6 1.2 3 2.7 3h52.5c1.5 0 2.7-1.3 2.7-3V30.6H2z" fill="#d9e3e8"/>
              <g fill="#93a2aa">
                <path d="M4.5 33h6v2.2h-6z"/><path d="M12.3 33h6v2.2h-6z"/><path d="M20.2 33h6v2.2h-6z"/>
                <path d="M28 33h6v2.2h-6z"/><path d="M35.8 33h6v2.2h-6z"/><path d="M43.7 33h6v2.2h-6z"/>
                <path d="M51.5 33h6v2.2h-6z"/><path d="M28 37.4h6v2.2h-6z"/><path d="M35.8 37.4h6v2.2h-6z"/>
                <path d="M43.7 37.4h6v2.2h-6z"/><path d="M51.5 37.4h6v2.2h-6z"/><path d="M4.5 41.8h6V44h-6z"/>
                <path d="M12.3 41.8h6V44h-6z"/><path d="M20.2 41.8h6V44h-6z"/><path d="M28 41.8h6V44h-6z"/>
                <path d="M35.8 41.8h6V44h-6z"/><path d="M43.7 41.8h6V44h-6z"/><path d="M51.5 41.8h6V44h-6z"/>
                <path d="M4.5 46.3h6v2.2h-6z"/><path d="M12.3 46.3h6v2.2h-6z"/><path d="M20.2 46.3h6v2.2h-6z"/>
                <path d="M28 46.3h6v2.2h-6z"/><path d="M35.8 46.3h6v2.2h-6z"/><path d="M43.7 46.3h6v2.2h-6z"/>
                <path d="M51.5 46.3h6v2.2h-6z"/><path d="M4.5 50.7h6v2.2h-6z"/><path d="M12.3 50.7h6v2.2h-6z"/>
                <path d="M20.2 50.7h6v2.2h-6z"/><path d="M28 50.7h6v2.2h-6z"/><path d="M35.8 50.7h6v2.2h-6z"/>
                <path d="M43.7 50.7h6v2.2h-6z"/><path d="M51.5 50.7h6v2.2h-6z"/><path d="M4.5 55.1h6v2.2h-6z"/>
                <path d="M12.3 55.1h6v2.2h-6z"/><path d="M20.2 55.1h6v2.2h-6z"/><path d="M28 55.1h6v2.2h-6z"/>
                <path d="M35.8 55.1h6v2.2h-6z"/><path d="M43.7 55.1h6v2.2h-6z"/>
              </g>
              <ellipse cx="31" cy="6.2" rx="1.8" ry="1.9" fill="#93a2aa"/>
              <g fill="#ffffff">
                <path d="M19.5 25.5v.2c0 .6.1 1 .2 1.3c.1.2.3.4.7.4c.4 0 .6-.1.7-.4c.1-.2.1-.4.1-.8v-5.5h1.6v5.4c0 .7-.1 1.2-.3 1.6c-.4.7-1 1-2 1s-1.6-.3-2-.8c-.3-.5-.5-1.3-.5-2.2v-.2h1.5"/>
                <path d="M24.5 20.7h1.6v4.8c0 .5.1.9.2 1.2c.2.4.6.7 1.3.7c.6 0 1.1-.2 1.3-.7c.1-.3.1-.7.1-1.2v-4.8h1.6v4.8c0 .8-.1 1.5-.4 1.9c-.5.8-1.4 1.3-2.7 1.3c-1.3 0-2.2-.4-2.7-1.3c-.3-.5-.4-1.1-.4-1.9c.1 0 .1-4.8.1-4.8"/>
                <path d="M32.2 20.7h1.6v6.4h3.8v1.4h-5.4v-7.8"/>
                <path d="M42.2 20.7H44l-2.6 4.9v2.9h-1.6v-2.9l-2.7-4.9H39l1.6 3.4l1.6-3.4"/>
              </g>
            </svg>
            <span className="header-title">Calendario Omnichannel</span>
          </h1>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate('/teams')}>Equipos</button>
          <button className="btn-secondary" onClick={() => navigate('/profile')}>Mi perfil</button>
          <button className="btn-ghost" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      <div className="app-body">
        <TeamFilter
          teams={teams}
          users={users}
          absences={absences}
          selectedTeams={selectedTeams}
          onToggleTeam={toggleTeam}
          onShowAll={() => setSelectedTeams([])}
          isOnline={isOnline}
          sidebarOpen={sidebarOpen}
          onCloseSidebar={() => setSidebarOpen(false)}
        />

        <main className="main-content">
          {!appUser?.city && (
            <div className="city-reminder">
              <span className="city-reminder-icon">⚠</span>
              <span>No tienes ciudad de trabajo configurada — no se mostrarán tus festivos locales.</span>
              <button className="city-reminder-link" onClick={() => navigate('/profile')}>
                Ir a Mi perfil →
              </button>
            </div>
          )}
          {(!appUser?.teamId || appUser.teamId === '') && (
            <div className="city-reminder">
              <span className="city-reminder-icon">⚠</span>
              <span>No estás asignado a ningún equipo — ve a <strong>Equipos</strong> para unirte a uno y que tus ausencias aparezcan en el calendario.</span>
              <button className="city-reminder-link" onClick={() => navigate('/teams')}>
                Ir a Equipos →
              </button>
            </div>
          )}
          <CalendarView
            absences={absences}
            users={users}
            teams={teams}
            selectedTeams={selectedTeams}
            holidays={holidays}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
          />
        </main>
      </div>

      {modal && appUser && (
        <AbsenceModal
          absence={modal.absence}
          defaultStart={modal.defaultStart}
          defaultEnd={modal.defaultEnd}
          currentUserId={appUser.uid}
          currentTeamId={appUser.teamId}
          isOwner={modal.isOwner}
          ownerName={modal.ownerName}
          nonWorkingHolidays={userHolidayDates}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reload() }}
        />
      )}
    </div>
  )
}
