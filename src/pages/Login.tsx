import { useState } from 'react'
import { sendSignInLinkToEmail } from 'firebase/auth'
import { auth } from '../lib/firebase'

const BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5173/calendario-equipos-omni/auth-callback'
  : 'https://isaachuergabayon.github.io/calendario-equipos-omni/auth-callback'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: BASE_URL,
        handleCodeInApp: true,
      })
      window.localStorage.setItem('emailForSignIn', email)
      setSent(true)
    } catch {
      setError('Error al enviar el enlace. Revisa el email e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Calendario Omnichannel</h1>
          <div className="login-success">
            <span className="login-icon">✉️</span>
            <p>Hemos enviado un enlace de acceso a <strong>{email}</strong>.</p>
            <p className="login-hint">Revisa tu bandeja de entrada y haz click en el enlace para entrar.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Calendario Omnichannel</h1>
        <p className="login-subtitle">Introduce tu email para acceder</p>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar enlace de acceso'}
          </button>
        </form>
      </div>
    </div>
  )
}
