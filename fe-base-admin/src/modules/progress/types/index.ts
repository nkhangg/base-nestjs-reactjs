export type ActionType = 'read_article' | 'quiz_done' | 'flashcard_review' | 'login'

export interface ActivityLog {
  id: string
  userId: string
  actionType: ActionType
  xpGained: number
  referenceId: string | null
  createdAt: string
}

export interface LeaderboardEntry {
  userId: string
  email: string
  name: string | null
  xpTotal: number
  weeklyXp?: number
}

export interface UserActivityResponse {
  total: number
  data: ActivityLog[]
}

export interface LeaderboardResponse {
  data: LeaderboardEntry[]
}
