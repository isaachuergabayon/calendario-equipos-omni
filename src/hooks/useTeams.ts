import { useEffect, useState } from 'react'
import { getTeams } from '../lib/firestore'
import type { Team } from '../types'

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    return getTeams().then(data => {
      setTeams(data.sort((a, b) => a.name.localeCompare(b.name, 'es')))
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  return { teams, loading, reload: load }
}
