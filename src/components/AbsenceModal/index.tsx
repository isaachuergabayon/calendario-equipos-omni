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
  /** Fechas no laborables del usuario (nacionales + regionales + locales). YYYY-MM-DD */
  nonWorkingHolidays: Set<string>
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

function countHolidayDays(startDate: string, endDate: string, holidays: Set<string>): number {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
    if (holidays.has(key)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

// Días laborables: excluye fines de semana y festivos
function countWorkingDays(startDate: string, endDate: string, holidays: Set<string>): number {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
    if (day !== 0 && day !== 6 && !holidays.has(key)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export default function AbsenceModal({
  absence,
  defaultStart = '',
  defaultEnd = '',
  currentUserId,
  currentTeamId,
  isOwner,
  ownerName,
  nonWorkingHolidays,
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

  // Métricas del rango seleccionado
  const rangeValid = !!(startDate && endDate && endDate >= startDate)
  const weekendDays  = rangeValid ? countWeekendDays(startDate, endDate) : 0
  const total        = rangeValid ? totalDays(startDate, endDate) : 0
  const someWeekend  = weekendDays > 0 && weekendDays < total

  // Vacaciones: calcular días laborables (excluye fines de semana y todos los festivos)
  const workingDays = type === 'vacation' && rangeValid
    ? countWorkingDays(startDate, endDate, nonWorkingHolidays)
    : null
  const hasNonWorkingDays = workingDays !== null && workingDays < total

  // Para vacaciones: bloquear solo si no hay ningún día laborable en el rango
  const vacationNoWorkingDaysBlock = type === 'vacation' && rangeValid && workingDays === 0

  // Para otros tipos: aviso suave + confirmación si hay fines de semana
  const needsWeekendConfirm = type !== 'vacation' && someWeekend && !weekendConfirmed
  const showWeekendWarning  = type !== 'vacation' && weekendDays > 0

  // Número de festivos no-laborables en el rango (para mostrar en el desglose)
  const holidayDays = rangeValid && type === 'vacation'
    ? countHolidayDays(startDate, endDate, nonWorkingHolidays)
    : 0

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (endDate < startDate) {
      setError('La fecha de fin no puede ser anterior a la de inicio.')
      return
    }
    if (vacationNoWorkingDaysBlock) {
      setError('Este período no incluye ningún día laborable.')
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

            {/* Vacaciones: info de días laborables cuando hay no-laborables en el rango */}
            {type === 'vacation' && rangeValid && hasNonWorkingDays && workingDays! > 0 && (
              <p className="form-info">
                {workingDays} día{workingDays !== 1 ? 's' : ''} laborable{workingDays !== 1 ? 's' : ''} de {total} en total
                {weekendDays > 0 && holidayDays > 0
                  ? ` (${weekendDays} fin${weekendDays !== 1 ? 'es' : ''} de semana y ${holidayDays} festivo${holidayDays !== 1 ? 's' : ''} excluidos)`
                  : weekendDays > 0
                  ? ` (${weekendDays} día${weekendDays !== 1 ? 's' : ''} de fin de semana excluido${weekendDays !== 1 ? 's' : ''})`
                  : ` (${holidayDays} festivo${holidayDays !== 1 ? 's' : ''} excluido${holidayDays !== 1 ? 's' : ''})`
                }
              </p>
            )}

            {/* Vacaciones: bloqueo cuando no hay ningún día laborable */}
            {vacationNoWorkingDaysBlock && (
              <p className="form-error">
                Este período no incluye ningún día laborable.
              </p>
            )}

            {/* Otros tipos: aviso suave + confirmación si hay fines de semana */}
            {showWeekendWarning && (
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
                disabled={loading || vacationNoWorkingDaysBlock || needsWeekendConfirm}
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
