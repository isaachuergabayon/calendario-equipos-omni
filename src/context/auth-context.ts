import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { AppUser } from '../types'

export interface AuthContextValue {
  firebaseUser: User | null
  appUser: AppUser | null
  loading: boolean
  refreshAppUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  appUser: null,
  loading: true,
  refreshAppUser: async () => {},
})
