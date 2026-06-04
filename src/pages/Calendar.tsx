import { useState } from 'react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { useAbsences } from '../hooks/useAbsences'
import { useTeams } from '../hooks/useTeams'
import { useUsers } from '../hooks/useUsers'
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
  const { users } = useUsers()
  const navigate = useNavigate()

  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [modal, setModal] = useState<{
    absence: Absence | null
    defaultStart?: string
    defaultEnd?: string
    isOwner: boolean
  } | null>(null)

  function toggleTeam(teamId: string) {
    setSelectedTeams(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    )
  }

  function handleSelectSlot(start: Date, end: Date) {
    // end from react-big-calendar slot is exclusive, subtract 1 day
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
    setModal({ absence, isOwner: userId === appUser?.uid })
  }

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  if (loading) return <div className="loading">Cargando calendario…</div>

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: 'middle', marginRight: '0.4rem', marginBottom: '2px' }}>
              {/* Calendar body */}
              <rect x="3" y="4" width="18" height="17" rx="3" stroke="white" strokeWidth="1.8" fill="none"/>
              {/* Top bar */}
              <rect x="3" y="4" width="18" height="5" rx="3" fill="white" fillOpacity="0.2"/>
              {/* Pin left */}
              <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              {/* Pin right */}
              <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              {/* Person head */}
              <circle cx="12" cy="13" r="2.2" fill="white" fillOpacity="0.9"/>
              {/* Person body */}
              <path d="M7.5 19.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
            </svg>
            Calendario Omnichannel
          </h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate('/teams')}>
            Equipos
          </button>
          <button className="btn-secondary" onClick={() => navigate('/profile')}>
            Mi perfil
          </button>
          <button className="btn-ghost" onClick={handleLogout}>
            Cerrar sesión
          </button>
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
          />

        <main className="main-content">
          <CalendarView
            absences={absences}
            users={users}
            teams={teams}
            selectedTeams={selectedTeams}
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
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reload() }}
        />
      )}
    </div>
  )
}
