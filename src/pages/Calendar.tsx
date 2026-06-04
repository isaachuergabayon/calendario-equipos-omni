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
        <h1>Calendario Omnichannel</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate('/teams')}>
            Equipos
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
