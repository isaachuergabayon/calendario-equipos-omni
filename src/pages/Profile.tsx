import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateUser } from '../lib/firestore'
import { LOCATION_OPTIONS, type LocationKey } from '../lib/locations'

export default function ProfilePage() {
  const { appUser, refreshAppUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isFirstTime = searchParams.get('first') === 'true'

  const [displayName, setDisplayName] = useState(appUser?.displayName ?? '')
  const [city, setCity] = useState<LocationKey | ''>(
    (appUser?.city as LocationKey | undefined) ?? ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const name = displayName.trim()
    if (!name) {
      setError('El nombre no puede estar vacío.')
      return
    }
    if (!appUser) return
    setLoading(true)
    setError('')
    try {
      const update: Record<string, unknown> = { displayName: name }
      if (city) update.city = city
      await updateUser(appUser.uid, update)
      await refreshAppUser()
      navigate('/')
    } catch (err) {
      console.error('Error al guardar perfil:', err)
      setError('Error al guardar. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Calendario Omnichannel</h1>

        {isFirstTime ? (
          <>
            <p className="login-subtitle">¡Bienvenido! ¿Cómo quieres que te vean tus compañeros?</p>
            <p className="login-hint">Puedes cambiarlo en cualquier momento desde tu perfil.</p>
          </>
        ) : (
          <p className="login-subtitle">Editar perfil</p>
        )}

        <form onSubmit={handleSave} className="login-form">
          <label>
            Tu nombre
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Ej: Isaac Huergabayon"
              autoFocus
              required
            />
          </label>

          <label>
            Tu ciudad de trabajo
            <select value={city} onChange={e => setCity(e.target.value as LocationKey | '')}>
              <option value="">— Sin especificar —</option>
              {LOCATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Guardando…' : isFirstTime ? 'Empezar →' : 'Guardar cambios'}
          </button>

          {!isFirstTime && (
            <button
              type="button"
              onClick={() => navigate('/')}
            >
              Cancelar
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
