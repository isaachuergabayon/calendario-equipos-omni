import { useEffect, useState } from 'react'
import { getAllUsers } from '../lib/firestore'
import type { AppUser } from '../types'

const ONLINE_THRESHOLD = 5 * 60_000   // 5 minutes
const REFRESH_INTERVAL = 30_000       // refresh users every 30s to update presence

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    return getAllUsers().then(data => {
      setUsers(data)
      setLoading(false)
    })
  }

  useEffect(() => {
    void load()
    const id = setInterval(() => { void load() }, REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [])

  function isOnline(user: AppUser): boolean {
    if (!user.lastSeen) return false
    return Date.now() - user.lastSeen < ONLINE_THRESHOLD
  }

  return { users, loading, reload: load, isOnline }
}
