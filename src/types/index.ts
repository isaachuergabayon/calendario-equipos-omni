export type AbsenceType = 'vacation' | 'sick' | 'personal' | 'remote' | 'other'

export interface AppUser {
  uid: string
  displayName: string
  email: string
  teamId: string
  color: string
  lastSeen?: number  // Unix ms timestamp — updated by heartbeat
}

export interface Team {
  id: string
  name: string
  color: string
}

export interface Absence {
  id: string
  userId: string
  teamId: string
  type: AbsenceType
  startDate: string // ISO date: 'YYYY-MM-DD'
  endDate: string   // ISO date: 'YYYY-MM-DD'
  notes?: string
  createdAt: number
}

export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  vacation: 'Vacaciones',
  sick: 'Baja médica',
  personal: 'Asunto personal',
  remote: 'Teletrabajo',
  other: 'Otro',
}

export const TEAM_COLORS = [
  '#4f86c6',
  '#e07b54',
  '#6ab187',
  '#c66b9a',
  '#f0c419',
  '#7b5ea7',
  '#4ba3c3',
  '#e05c5c',
]
