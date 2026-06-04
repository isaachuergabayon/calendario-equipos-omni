import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeams } from '../hooks/useTeams'
import { useUsers } from '../hooks/useUsers'
import { useAuth } from '../context/AuthContext'
import { createTeam, updateTeam, deleteTeam, updateUser } from '../lib/firestore'
import { TEAM_COLORS } from '../types'
import type { Team } from '../types'

export default function Teams() {
  const navigate = useNavigate()
  const { teams, reload: reloadTeams } = useTeams()
  const { users, reload: reloadUsers } = useUsers()
  const { appUser, refreshAppUser } = useAuth()

  const [editing, setEditing] = useState<Team | null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(TEAM_COLORS[0])
  const [loading, setLoading] = useState(false)

  function openCreate() {
    setEditing(null)
    setName('')
    setColor(TEAM_COLORS[0])
    setCreating(true)
  }

  function openEdit(team: Team) {
    setEditing(team)
    setName(team.name)
    setColor(team.color)
    setCreating(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    if (editing) {
      await updateTeam(editing.id, { name, color })
    } else {
      await createTeam({ name, color })
    }
    await reloadTeams()
    setCreating(false)
    setLoading(false)
  }

  async function handleDelete(team: Team) {
    if (!confirm(`¿Eliminar el equipo "${team.name}"? Los miembros quedarán sin equipo.`)) return
    setLoading(true)
    await deleteTeam(team.id)
    await reloadTeams()
    setLoading(false)
  }

  async function handleAssignTeam(teamId: string) {
    if (!appUser) return
    setLoading(true)
    await updateUser(appUser.uid, { teamId })
    await refreshAppUser()
    await reloadUsers()
    setLoading(false)
  }

  return (
    <div className="teams-page">
      <header className="app-header">
        <h1>Gestión de equipos</h1>
        <button className="btn-ghost" onClick={() => navigate('/')}>← Volver al calendario</button>
      </header>

      <div className="teams-content">
        {/* Mi equipo */}
        <section className="teams-section">
          <h2>Mi equipo</h2>
          <p className="teams-hint">Selecciona el equipo al que perteneces:</p>
          <div className="team-list">
            {teams.map(team => (
              <button
                key={team.id}
                className={`team-card ${appUser?.teamId === team.id ? 'selected' : ''}`}
                onClick={() => handleAssignTeam(team.id)}
                disabled={loading}
              >
                <span className="team-dot" style={{ background: team.color }} />
                <span className="team-card-name">{team.name}</span>
                <span className="team-card-count">
                  {users.filter(u => u.teamId === team.id).length} personas
                </span>
                {appUser?.teamId === team.id && <span className="team-badge">✓ Tu equipo</span>}
              </button>
            ))}
          </div>
        </section>

        {/* Administrar equipos */}
        <section className="teams-section">
          <div className="section-header">
            <h2>Equipos</h2>
            <button className="btn-primary" onClick={openCreate}>+ Nuevo equipo</button>
          </div>

          {creating && (
            <form className="team-form" onSubmit={handleSave}>
              <input
                type="text"
                placeholder="Nombre del equipo"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
              <div className="color-picker">
                {TEAM_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <div className="form-actions">
                <button type="button" className="btn-ghost" onClick={() => setCreating(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Guardando…' : editing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          )}

          <table className="teams-table">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Miembros</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team.id}>
                  <td>
                    <span className="team-dot" style={{ background: team.color }} />
                    {team.name}
                  </td>
                  <td>{users.filter(u => u.teamId === team.id).length}</td>
                  <td className="team-actions">
                    <button className="btn-ghost btn-sm" onClick={() => openEdit(team)}>Editar</button>
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(team)} disabled={loading}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr><td colSpan={3} className="empty">No hay equipos creados aún.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
