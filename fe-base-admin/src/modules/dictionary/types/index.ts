import type { AdminListMeta } from '@modules/admin/types'

export type DictionaryStatus = 'pending' | 'approved' | 'rejected'

export interface DictionaryEntry {
  id: string
  kanji: string | null
  hiragana: string
  romaji: string
  meanings: string[]
  jlptLevel: number | null
  status: DictionaryStatus
  isPublic: boolean
  creatorId: string | null
  staffAuthorId: string | null
  verifiedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface DictionaryListResponse {
  data: DictionaryEntry[]
  meta: AdminListMeta
}

export interface CreateDictionaryEntryDto {
  kanji?: string
  hiragana: string
  romaji: string
  meanings: string[]
  jlptLevel?: number
  isPublic?: boolean
}

export interface UpdateDictionaryEntryDto {
  kanji?: string | null
  hiragana?: string
  romaji?: string
  meanings?: string[]
  jlptLevel?: number | null
  isPublic?: boolean
}

export interface RejectDictionaryDto {
  reason?: string
}
