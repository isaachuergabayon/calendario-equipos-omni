import { useState } from 'react'
import type { Team, AppUser, Absence } from '../../types'

interface Props {
  teams: Team[]
  users: AppUser[]
  absences: Absence[]
  selectedTeams: string[]
  onToggleTeam: (teamId: string) => void
  onShowAll: () => void
  isOnline: (user: AppUser) => boolean
  sidebarOpen: boolean
  onCloseSidebar: () => void
}

function getFiscalYear() {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const startYear = month >= 2 ? year : year - 1
  return {
    start: `${startYear}-02-01`,
    end: `${startYear + 1}-01-31`,
    label: `Feb ${startYear} – Ene ${startYear + 1}`,
  }
}

function countDays(startDate: string, endDate: string): number {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1
}

export default function TeamFilter({
  teams, users, absences, selectedTeams,
  onToggleTeam, onShowAll, isOnline, sidebarOpen, onCloseSidebar,
}: Props) {
  const allSelected = selectedTeams.length === 0
  const [expanded, setExpanded] = useState<string[]>([])
  const fiscal = getFiscalYear()

  function toggleExpand(teamId: string) {
    setExpanded(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    )
  }

  const fiscalAbsences = absences.filter(a => a.startDate <= fiscal.end && a.endDate >= fiscal.start)

  function daysForUser(userId: string): number {
    return fiscalAbsences
      .filter(a => a.userId === userId)
      .reduce((sum, a) => {
        const start = a.startDate < fiscal.start ? fiscal.start : a.startDate
        const end = a.endDate > fiscal.end ? fiscal.end : a.endDate
        return sum + countDays(start, end)
      }, 0)
  }

  const onlineUsers = users.filter(isOnline)

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={onCloseSidebar} />}

      <aside className={`team-filter ${sidebarOpen ? 'open' : ''}`}>
        {/* Online now */}
        {onlineUsers.length > 0 && (
          <div className="online-section">
            <h3 className="online-title">
              <span className="online-pulse" />
              En línea ({onlineUsers.length})
            </h3>
            {onlineUsers.map(u => (
              <div key={u.uid} className="online-user">
                <span className="online-dot" />
                <span className="online-name">{u.displayName}</span>
              </div>
            ))}
          </div>
        )}

        <div className="filter-header">
          <h3>Equipos</h3>
          <span className="fiscal-label">{fiscal.label}</span>
        </div>

        <button
          className={`filter-btn ${allSelected ? 'active' : ''}`}
          onClick={onShowAll}
        >
          <span className="filter-name">Todos</span>
        </button>

        {teams.map(team => {
          const isActive = selectedTeams.includes(team.id)
          const isExpanded = expanded.includes(team.id)
          const members = users.filter(u => u.teamId === team.id)

          return (
            <div key={team.id} className="team-filter-group">
              <div className={`filter-row ${isActive ? 'active' : ''}`}>
                <button className="filter-row-main" onClick={() => onToggleTeam(team.id)}>
                  <span className="filter-dot" style={{ background: team.color }} />
                  <span className="filter-name">{team.name}</span>
                  <span className="filter-count">{members.length}</span>
                </button>
                <button
                  className={`filter-expand ${isExpanded ? 'open' : ''}`}
                  onClick={() => toggleExpand(team.id)}
                  title={isExpanded ? 'Ocultar resumen' : 'Ver resumen'}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {isExpanded && (
                <div className="team-stats">
                  {members.length === 0 ? (
                    <p className="stats-empty">Sin miembros</p>
                  ) : (
                    members.map(user => {
                      const days = daysForUser(user.uid)
                      const online = isOnline(user)
                      return (
                        <div key={user.uid} className="stats-row">
                          <span className="stats-name">
                            {online && <span className="stats-online-dot" title="En línea" />}
                            {user.displayName}
                          </span>
                          <span className={`stats-days ${days === 0 ? 'zero' : ''}`}>
                            {days} {days === 1 ? 'día' : 'días'}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </aside>
    </>
  )
}
