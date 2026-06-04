import { useState } from 'react'
import { createAbsence, updateAbsence, deleteAbsence } from '../../lib/firestore'
import { ABSENCE_TYPE_LABELS } from '../../types'
import type { Absence, AbsenceType } from '../../types'

interface Props {
  absence: Absence | null
  defaultStart?: string
  defaultEnd?: string
  currentUserId: string
  currentTeamId: string
  isOwner: boolean
  ownerName?: string
  onClose: () => void
  onSaved: () => void
}

// Returns number of weekend days in [startDate, endDate] inclusive
function countWeekendDays(startDate: string, endDate: string): number {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day === 0 || day === 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

function totalDays(startDate: string, endDate: string): number {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1
}

export default function AbsenceModal({
  absence,
  defaultStart = '',
  defaultEnd = '',
  currentUserId,
  currentTeamId,
  isOwner,
  ownerName,
  onClose,
  onSaved,
}: Props) {
  const [type, setType] = useState<AbsenceType>(absence?.type ?? 'vacation')
  const [startDate, setStartDate] = useState(absence?.startDate ?? defaultStart)
  const [endDate, setEndDate] = useState(absence?.endDate ?? defaultEnd)
  const [notes, setNotes] = useState(absence?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [weekendConfirmed, setWeekendConfirmed] = useState(false)

  const isNew = absence === null

  // Compute weekend warning whenever dates or type change
  const weekendDays = startDate && endDate && endDate >= startDate
    ? countWeekendDays(startDate, endDate)
    : 0
  const total = startDate && endDate && endDate >= startDate
    ? totalDays(startDate, endDate)
    : 0
  const allWeekend = weekendDays > 0 && weekendDays === total
  const someWeekend = weekendDays > 0 && weekendDays < total

  // For vacaciones: block entirely if any weekend days
  const vacationWeekendBlock = type === 'vacation' && weekendDays > 0
  // For other types: warn and require confirmation
  const needsWeekendConfirm = type !== 'vacation' && someWeekend && !weekendConfirmed
  const showWeekendWarning = type !== 'vacation' && weekendDays > 0

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (endDate < startDate) {
      setError('La fecha de fin no puede ser anterior a la de inicio.')
      return
    }
    if (vacationWeekendBlock) {
      setError(
        allWeekend
          ? 'Las vacaciones no pueden ser en fin de semana.'
          : `El rango incluye ${weekendDays} día${weekendDays > 1 ? 's' : ''} de fin de semana. Las vacaciones solo pueden ser en días laborables.`
      )
      return
    }
    if (needsWeekendConfirm) return // checkbox not checked yet

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

  // Reset weekend confirmation when dates or type change
  function handleTypeChange(v: AbsenceType) {
    setType(v)
    setWeekendConfirmed(false)
    setError('')
  }
  function handleStartChange(v: string) {
    setStartDate(v)
    setWeekendConfirmed(false)
    setError('')
  }
  function handleEndChange(v: string) {
    setEndDate(v)
    setWeekendConfirmed(false)
    setError('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isNew
              ? 'Nueva ausencia'
              : isOwner
                ? 'Editar ausencia'
                : `Ausencia de ${ownerName ?? 'compañero'}`}
          </h2>
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
              <select value={type} onChange={e => handleTypeChange(e.target.value as AbsenceType)}>
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
                onChange={e => handleStartChange(e.target.value)}
                required
              />
            </label>

            <label>
              Hasta
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => handleEndChange(e.target.value)}
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

            {/* Vacation weekend block */}
            {vacationWeekendBlock && (
              <p className="form-error">
                {allWeekend
                  ? 'Las vacaciones no pueden ser en fin de semana.'
                  : `El rango incluye ${weekendDays} día${weekendDays > 1 ? 's' : ''} de fin de semana. Las vacaciones solo pueden registrarse en días laborables.`}
              </p>
            )}

            {/* Other types: warning + confirm checkbox */}
            {showWeekendWarning && !vacationWeekendBlock && (
              <div className="weekend-warning">
                <p className="weekend-warning-text">
                  ⚠️ El rango incluye {weekendDays} día{weekendDays > 1 ? 's' : ''} de fin de semana.
                </p>
                <label className="weekend-confirm">
                  <input
                    type="checkbox"
                    checked={weekendConfirmed}
                    onChange={e => setWeekendConfirmed(e.target.checked)}
                  />
                  Confirmo que quiero registrarlo igualmente
                </label>
              </div>
            )}

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
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || vacationWeekendBlock || needsWeekendConfirm}
              >
                {loading ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
