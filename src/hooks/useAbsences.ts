import { useEffect, useState } from 'react'
import { getAbsences } from '../lib/firestore'
import type { Absence } from '../types'

export function useAbsences() {
  const [absences, setAbsences] = useState<Absence[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    return getAbsences().then(data => {
      setAbsences(data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  return { absences, loading, reload: load }
}
