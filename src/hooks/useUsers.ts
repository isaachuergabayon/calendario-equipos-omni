import { useEffect, useState } from 'react'
import { getAllUsers } from '../lib/firestore'
import type { AppUser } from '../types'

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const data = await getAllUsers()
    setUsers(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return { users, loading, reload: load }
}
