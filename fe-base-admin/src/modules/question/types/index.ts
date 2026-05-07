import type { AdminListMeta } from '@modules/admin/types'

export type QuestionType = 'quiz' | 'fill_in_blank' | 'matching'
export type QuestionStatus = 'pending' | 'approved' | 'rejected'
export type QuestionReferenceType = 'article' | 'dictionary' | 'none'

export interface QuestionData {
  type: QuestionType
  prompt: string
  choices?: string[]
  answer: unknown
  explanation?: string
  jlptLevel?: number
}

export interface Question {
  id: string
  questionData: QuestionData
  referenceType: QuestionReferenceType | null
  referenceId: string | null
  status: QuestionStatus
  isPublic: boolean
  creatorId: string | null
  staffAuthorId: string | null
  verifiedBy: string | null
  createdAt: string
}

export interface QuestionListResponse {
  data: Question[]
  meta: AdminListMeta
}

export interface CreateQuestionDto {
  questionData: QuestionData
  referenceType?: QuestionReferenceType
  referenceId?: string
  isPublic?: boolean
}

export interface UpdateQuestionDto {
  questionData?: QuestionData
  referenceType?: QuestionReferenceType | null
  referenceId?: string | null
  isPublic?: boolean
}
