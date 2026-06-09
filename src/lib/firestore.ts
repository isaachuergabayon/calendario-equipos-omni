import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
} from 'firebase/firestore'
import { db } from './firebase'
import type { AppUser, Team, Absence, AbsenceType } from '../types'

// ── Users ──────────────────────────────────────────────

export async function getOrCreateUser(uid: string, email: string, displayName: string): Promise<AppUser> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    return { uid, ...snap.data() } as AppUser
  }
  const newUser: Omit<AppUser, 'uid'> = {
    displayName,
    email,
    teamId: '',
    color: '#4f86c6',
  }
  await setDoc(ref, newUser)
  return { uid, ...newUser }
}

export async function updateUser(uid: string, data: Partial<Omit<AppUser, 'uid'>>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data)
}

export async function getAllUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser))
}

// ── Teams ──────────────────────────────────────────────

export async function getTeams(): Promise<Team[]> {
  const snap = await getDocs(collection(db, 'teams'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Team))
}

export async function createTeam(data: Omit<Team, 'id'>): Promise<Team> {
  const ref = await addDoc(collection(db, 'teams'), data)
  return { id: ref.id, ...data }
}

export async function updateTeam(id: string, data: Partial<Omit<Team, 'id'>>): Promise<void> {
  await updateDoc(doc(db, 'teams', id), data)
}

export async function deleteTeam(id: string): Promise<void> {
  await deleteDoc(doc(db, 'teams', id))
}

// ── Absences ───────────────────────────────────────────

export async function getAbsences(): Promise<Absence[]> {
  const snap = await getDocs(collection(db, 'absences'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Absence))
}

export async function createAbsence(data: {
  userId: string
  teamId: string
  type: AbsenceType
  startDate: string
  endDate: string
  notes?: string
}): Promise<Absence> {
  const payload: Record<string, unknown> = {
    userId: data.userId,
    teamId: data.teamId,
    type: data.type,
    startDate: data.startDate,
    endDate: data.endDate,
    createdAt: Date.now(),
  }
  if (data.notes) payload.notes = data.notes
  const ref = await addDoc(collection(db, 'absences'), payload)
  return { id: ref.id, ...payload } as Absence
}

export async function updateAbsence(id: string, data: Partial<Omit<Absence, 'id' | 'createdAt'>>): Promise<void> {
  const update: Record<string, unknown> = {}
  if (data.type !== undefined) update.type = data.type
  if (data.startDate !== undefined) update.startDate = data.startDate
  if (data.endDate !== undefined) update.endDate = data.endDate
  if (data.teamId !== undefined) update.teamId = data.teamId
  // notes: si es string vacío, borrar el campo; si tiene valor, guardarlo; si es undefined, no tocar
  if (data.notes !== undefined) update.notes = data.notes || deleteField()
  await updateDoc(doc(db, 'absences', id), update)
}

export async function deleteAbsence(id: string): Promise<void> {
  await deleteDoc(doc(db, 'absences', id))
}
