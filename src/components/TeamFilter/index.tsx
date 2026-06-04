import type { Team, AppUser } from '../../types'

interface Props {
  teams: Team[]
  users: AppUser[]
  selectedTeams: string[]
  onToggleTeam: (teamId: string) => void
  onShowAll: () => void
}

export default function TeamFilter({ teams, users, selectedTeams, onToggleTeam, onShowAll }: Props) {
  const allSelected = selectedTeams.length === 0

  return (
    <aside className="team-filter">
      <h3>Equipos</h3>
      <button
        className={`filter-btn ${allSelected ? 'active' : ''}`}
        onClick={onShowAll}
      >
        Todos
      </button>
      {teams.map(team => {
        const isActive = selectedTeams.includes(team.id)
        const memberCount = users.filter(u => u.teamId === team.id).length
        return (
          <button
            key={team.id}
            className={`filter-btn ${isActive ? 'active' : ''}`}
            onClick={() => onToggleTeam(team.id)}
            style={{ '--team-color': team.color } as React.CSSProperties}
          >
            <span className="filter-dot" style={{ background: team.color }} />
            <span className="filter-name">{team.name}</span>
            <span className="filter-count">{memberCount}</span>
          </button>
        )
      })}
    </aside>
  )
}
