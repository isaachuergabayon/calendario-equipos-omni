import { useEffect, useState } from 'react'
import { getTeams } from '../lib/firestore'
import type { Team } from '../types'

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const data = await getTeams()
    setTeams(data.sort((a, b) => a.name.localeCompare(b.name, 'es')))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return { teams, loading, reload: load }
}
