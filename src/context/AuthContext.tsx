import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { getOrCreateUser, updateUser } from '../lib/firestore'
import type { AppUser } from '../types'
import { AuthContext } from './auth-context'

const HEARTBEAT_INTERVAL = 60_000 // 60 seconds

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
    return u
  }

  async function refreshAppUser() {
    if (firebaseUser) await loadAppUser(firebaseUser)
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      setFirebaseUser(user)
      if (user) {
        const u = await loadAppUser(user)
        // initial presence ping
        updateUser(u.uid, { lastSeen: Date.now() })
      } else {
        setAppUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // Heartbeat: keep lastSeen fresh while the tab is open
  useEffect(() => {
    if (!firebaseUser) return
    const id = setInterval(() => {
      updateUser(firebaseUser.uid, { lastSeen: Date.now() })
    }, HEARTBEAT_INTERVAL)
    return () => clearInterval(id)
  }, [firebaseUser])

  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, loading, refreshAppUser }}>
      {children}
    </AuthContext.Provider>
  )
}
