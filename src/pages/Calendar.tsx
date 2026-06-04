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
            <svg width="24" height="24" viewBox="0 0 24 24" style={{ verticalAlign: 'middle', marginRight: '0.45rem', marginBottom: '2px', display: 'inline-block' }} xmlns="http://www.w3.org/2000/svg">
              {/* Calendar body */}
              <rect x="2" y="5" width="20" height="17" rx="3" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.6"/>
              {/* Header band */}
              <rect x="2" y="5" width="20" height="5.5" rx="3" fill="rgba(255,255,255,0.35)"/>
              {/* Grid dots */}
              <rect x="7" y="14" width="2" height="2" rx="0.5" fill="white"/>
              <rect x="11" y="14" width="2" height="2" rx="0.5" fill="white"/>
              <rect x="15" y="14" width="2" height="2" rx="0.5" fill="white"/>
              <rect x="7" y="18" width="2" height="2" rx="0.5" fill="white"/>
              <rect x="11" y="18" width="2" height="2" rx="0.5" fill="white"/>
              {/* Pins */}
              <rect x="7.5" y="2" width="2" height="5" rx="1" fill="white"/>
              <rect x="14.5" y="2" width="2" height="5" rx="1" fill="white"/>
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
