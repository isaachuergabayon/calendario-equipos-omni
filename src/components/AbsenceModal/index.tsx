import { useState } from 'react'
import { createAbsence, updateAbsence, deleteAbsence } from '../../lib/firestore'
import { ABSENCE_TYPE_LABELS } from '../../types'
import type { Absence, AbsenceType } from '../../types'

interface Props {
  absence: Absence | null       // null = crear nueva
  defaultStart?: string
  defaultEnd?: string
  currentUserId: string
  currentTeamId: string
  isOwner: boolean              // solo el dueño puede editar/borrar
  onClose: () => void
  onSaved: () => void
}

export default function AbsenceModal({
  absence,
  defaultStart = '',
  defaultEnd = '',
  currentUserId,
  currentTeamId,
  isOwner,
  onClose,
  onSaved,
}: Props) {
  const [type, setType] = useState<AbsenceType>(absence?.type ?? 'vacation')
  const [startDate, setStartDate] = useState(absence?.startDate ?? defaultStart)
  const [endDate, setEndDate] = useState(absence?.endDate ?? defaultEnd)
  const [notes, setNotes] = useState(absence?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isNew = absence === null

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (endDate < startDate) {
      setError('La fecha de fin no puede ser anterior a la de inicio.')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (isNew) {
        await createAbsence({
          userId: currentUserId,
          teamId: currentTeamId,
          type,
          startDate,
          endDate,
          notes: notes || undefined,
        })
      } else {
        await updateAbsence(absence!.id, { type, startDate, endDate, notes: notes || undefined })
      }
      onSaved()
    } catch (err) {
      console.error('Error al guardar ausencia:', err)
      setError('Error al guardar. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!absence || !confirm('¿Eliminar esta ausencia?')) return
    setLoading(true)
    try {
      await deleteAbsence(absence.id)
      onSaved()
    } catch (err) {
      console.error('Error al eliminar ausencia:', err)
      setError('Error al eliminar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? 'Nueva ausencia' : 'Editar ausencia'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {!isOwner && !isNew ? (
          <div className="modal-readonly">
            <p><strong>Tipo:</strong> {ABSENCE_TYPE_LABELS[absence!.type]}</p>
            <p><strong>Desde:</strong> {absence!.startDate}</p>
            <p><strong>Hasta:</strong> {absence!.endDate}</p>
            {absence!.notes && <p><strong>Notas:</strong> {absence!.notes}</p>}
          </div>
        ) : (
          <form onSubmit={handleSave} className="modal-form">
            <label>
              Tipo
              <select value={type} onChange={e => setType(e.target.value as AbsenceType)}>
                {(Object.entries(ABSENCE_TYPE_LABELS) as [AbsenceType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>

            <label>
              Desde
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </label>

            <label>
              Hasta
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                required
              />
            </label>

            <label>
              Notas (opcional)
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Información adicional…"
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              {!isNew && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Eliminar
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
