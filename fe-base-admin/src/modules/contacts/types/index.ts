import type { PaginatedResult } from '@shared/types'

export type ContactStatus = 'PENDING' | 'READ' | 'RESPONDED' | 'CLOSED'

export interface Contact {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string | null
  subject: string
  message: string
  status: ContactStatus
  note: string | null
  replyMessage: string | null
  respondedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateContactStatusDto {
  status: ContactStatus
  note?: string
}

export interface ReplyToContactDto {
  replyMessage: string
}

export type ContactListResponse = PaginatedResult<Contact>
