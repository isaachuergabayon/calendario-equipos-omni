import { useState } from 'react'
import { countWorkingDays, toDateKey } from '../../lib/dateUtils'
import { ABSENCE_TYPE_LABELS } from '../../types'
import type { Team, AppUser, Absence } from '../../types'

interface Props {
  teams: Team[]
  users: AppUser[]
  absences: Absence[]
  selectedTeams: string[]
  currentUserId: string
  selectedUserId: string | null
  onToggleTeam: (teamId: string) => void
  onToggleUser: (uid: string) => void
  onShowAll: () => void
  onExportIcal: () => void
  isOnline: (user: AppUser) => boolean
  sidebarOpen: boolean
  onCloseSidebar: () => void
  userHolidayMaps: Map<string, Set<string>>
}

function getFiscalYear(offset: number = 0) {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const currentStartYear = month >= 2 ? year : year - 1
  const startYear = currentStartYear + offset
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

function exportTeamCsv(
  teamName: string,
  teamId: string,
  members: AppUser[],
  absences: Absence[],
  fiscal: { start: string; end: string; label: string },
  userHolidayMaps: Map<string, Set<string>>,
) {
  const fiscalAbsences = absences.filter(
    a => a.teamId === teamId && a.startDate <= fiscal.end && a.endDate >= fiscal.start,
  )
  const rows: string[][] = [['Nombre', 'Tipo', 'Desde', 'Hasta', 'Días']]
  for (const user of members) {
    const userAbsences = fiscalAbsences
      .filter(a => a.userId === user.uid)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
    for (const a of userAbsences) {
      const start = a.startDate < fiscal.start ? fiscal.start : a.startDate
      const end = a.endDate > fiscal.end ? fiscal.end : a.endDate
      let days: number
      if (a.type === 'vacation') {
        const hols = userHolidayMaps.get(user.uid) ?? new Set<string>()
        days = countWorkingDays(start, end, hols)
      } else {
        days = countDays(start, end)
      }
      rows.push([user.displayName, ABSENCE_TYPE_LABELS[a.type], a.startDate, a.endDate, String(days)])
    }
  }
  const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${teamName.replace(/\s+/g, '_')}_${fiscal.label.replace(/\s/g, '')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function TeamFilter({
  teams, users, absences, selectedTeams, currentUserId,
  selectedUserId, onToggleTeam, onToggleUser, onShowAll, onExportIcal,
  isOnline, sidebarOpen, onCloseSidebar,
  userHolidayMaps,
}: Props) {
  const allSelected = selectedTeams.length === 0
  const [expanded, setExpanded] = useState<string[]>([])
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [fiscalOffset, setFiscalOffset] = useState(() => {
    const stored = sessionStorage.getItem('fiscalOffset')
    return stored ? Number(stored) : 0
  })
  const fiscal = getFiscalYear(fiscalOffset)

  function changeFiscalOffset(next: number) {
    setFiscalOffset(next)
    sessionStorage.setItem('fiscalOffset', String(next))
  }

  function toggleExpand(teamId: string) {
    setExpanded(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    )
  }

  function toggleExpandUser(uid: string) {
    setExpandedUser(prev => prev === uid ? null : uid)
  }

  const visibleAbsences = selectedTeams.length > 0
    ? absences.filter(a => selectedTeams.includes(a.teamId))
    : absences

  const fiscalAbsences = visibleAbsences.filter(
    a => a.startDate <= fiscal.end && a.endDate >= fiscal.start,
  )

  function daysForUser(userId: string): number {
    return fiscalAbsences
      .filter(a => a.userId === userId)
      .reduce((sum, a) => {
        const start = a.startDate < fiscal.start ? fiscal.start : a.startDate
        const end = a.endDate > fiscal.end ? fiscal.end : a.endDate
        if (a.type === 'vacation') {
          const userHols = userHolidayMaps.get(userId) ?? new Set<string>()
          return sum + countWorkingDays(start, end, userHols)
        }
        return sum + countDays(start, end)
      }, 0)
  }

  const today = toDateKey(new Date())
  const userMap = Object.fromEntries(users.map(u => [u.uid, u]))
  const todayAbsences = absences.filter(a => {
    const matchesTeam = selectedTeams.length === 0 || selectedTeams.includes(a.teamId)
    return matchesTeam && a.startDate <= today && a.endDate >= today
  })

  const onlineUsers = users.filter(isOnline)

  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={onCloseSidebar} />}

      <aside className={`team-filter ${sidebarOpen ? 'open' : ''}`}>
        {/* En línea */}
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

        {/* Hoy fuera */}
        {todayAbsences.length > 0 && (
          <div className="today-section">
            <h3 className="today-title">Hoy fuera ({todayAbsences.length})</h3>
            {todayAbsences.map(a => (
              <div key={a.id} className="today-user">
                <span className="today-name">{userMap[a.userId]?.displayName ?? '—'}</span>
                <span className="today-type">{ABSENCE_TYPE_LABELS[a.type]}</span>
              </div>
            ))}
          </div>
        )}

        {/* Cabecera con navegación de año fiscal */}
        <div className="filter-header">
          <h3>Equipos</h3>
          <div className="fiscal-nav">
            <button
              className="fiscal-nav-btn"
              onClick={() => changeFiscalOffset(fiscalOffset - 1)}
              title="Año fiscal anterior"
            >‹</button>
            <span className="fiscal-label">{fiscal.label}</span>
            <button
              className="fiscal-nav-btn"
              onClick={() => changeFiscalOffset(fiscalOffset + 1)}
              disabled={fiscalOffset >= 0}
              title="Año fiscal siguiente"
            >›</button>
          </div>
        </div>

        <div className="filter-global-row">
          <button
            className={`filter-btn ${allSelected ? 'active' : ''}`}
            onClick={onShowAll}
          >
            <span className="filter-name">Todos</span>
          </button>
          <button
            className="filter-ical-btn"
            onClick={onExportIcal}
            title="Descargar calendar (.ics)"
          >
            ↓ .ics
          </button>
        </div>

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
                    <>
                      {members.map(user => {
                        const days = daysForUser(user.uid)
                        const online = isOnline(user)
                        const isUserExpanded = expandedUser === user.uid
                        const isSelf = user.uid === currentUserId
                        const userFiscalAbsences = fiscalAbsences
                          .filter(a => a.userId === user.uid)
                          .sort((a, b) => a.startDate.localeCompare(b.startDate))

                        return (
                          <div key={user.uid} className={`stats-entry${isSelf ? ' stats-entry--self' : ''}${selectedUserId === user.uid ? ' stats-entry--selected' : ''}`}>
                            <div className="stats-row">
                              <button
                                className="stats-name stats-name--btn"
                                onClick={() => onToggleUser(user.uid)}
                                title={selectedUserId === user.uid ? 'Quitar filtro de persona' : 'Filtrar por esta persona'}
                              >
                                {online && <span className="stats-online-dot" title="En línea" />}
                                {user.displayName}
                                {isSelf && <span className="stats-self-badge">tú</span>}
                              </button>
                              <div className="stats-row-right">
                                <span className={`stats-days ${days === 0 ? 'zero' : ''}`}>
                                  {days} {days === 1 ? 'día' : 'días'}
                                </span>
                                {userFiscalAbsences.length > 0 && (
                                  <button
                                    className={`stats-expand ${isUserExpanded ? 'open' : ''}`}
                                    onClick={() => toggleExpandUser(user.uid)}
                                    title={isUserExpanded ? 'Ocultar ausencias' : 'Ver ausencias'}
                                  >
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                            {isUserExpanded && (
                              <div className="stats-absence-list">
                                {userFiscalAbsences.map(a => (
                                  <div key={a.id} className="stats-absence-item">
                                    <span className="stats-absence-type">{ABSENCE_TYPE_LABELS[a.type]}</span>
                                    <span className="stats-absence-dates">
                                      {a.startDate.slice(5).replace('-', '/')}
                                      {a.startDate !== a.endDate && ` – ${a.endDate.slice(5).replace('-', '/')}`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                        <button
                          className="stats-csv-btn"
                          onClick={() => exportTeamCsv(team.name, team.id, members, absences, fiscal, userHolidayMaps)}
                          title="Exportar a CSV"
                        >
                        ↓ CSV
                      </button>
                    </>
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
