import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    async function finishSignIn() {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        navigate('/login')
        return
      }

      let email = window.localStorage.getItem('emailForSignIn')
      if (!email) {
        email = window.prompt('Por favor, introduce tu email para confirmar el acceso:')
      }
      if (!email) {
        setError('Email necesario para completar el acceso.')
        return
      }

      try {
        await signInWithEmailLink(auth, email, window.location.href)
        window.localStorage.removeItem('emailForSignIn')
        navigate('/')
      } catch (err: any) {
        setError('El enlace ha caducado o ya fue usado. Solicita uno nuevo.')
      }
    }

    finishSignIn()
  }, [])

  if (error) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Calendario Omnichannel</h1>
          <p className="login-error">{error}</p>
          <button onClick={() => navigate('/login')}>Volver al inicio</button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <p>Verificando acceso…</p>
      </div>
    </div>
  )
}
