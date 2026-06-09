import { useEffect, useState } from 'react'
import { getAbsences } from '../lib/firestore'
import type { Absence } from '../types'

// Traer solo ausencias de los últimos 2 años para limitar lecturas de Firestore
const SINCE = `${new Date().getFullYear() - 2}-01-01`

export function useAbsences() {
  const [absences, setAbsences] = useState<Absence[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    return getAbsences(SINCE).then(data => {
      setAbsences(data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  return { absences, loading, reload: load }
}
