import type { AvatarProps } from '@nuxt/ui'
import type { Patient } from '~~/shared/types/patient.types'

export type PatientStatus = 'active' | 'inactive' | 'discharged'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

// Keep User type for authentication purposes
export interface User {
  id: string
  name: string
  email: string
  avatar?: AvatarProps
}

// Patient type for clinical management
export { Patient }

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: AvatarProps
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
}

export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}
