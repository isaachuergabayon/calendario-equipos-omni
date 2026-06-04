import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { getOrCreateUser } from '../lib/firestore'
import type { AppUser } from '../types'

interface AuthContextValue {
  firebaseUser: User | null
  appUser: AppUser | null
  loading: boolean
  refreshAppUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  appUser: null,
  loading: true,
  refreshAppUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadAppUser(user: User) {
    const u = await getOrCreateUser(
      user.uid,
      user.email ?? '',
      user.displayName ?? user.email?.split('@')[0] ?? 'Usuario'
    )
    setAppUser(u)
  }

  async function refreshAppUser() {
    if (firebaseUser) await loadAppUser(firebaseUser)
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      setFirebaseUser(user)
      if (user) {
        await loadAppUser(user)
      } else {
        setAppUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, loading, refreshAppUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
