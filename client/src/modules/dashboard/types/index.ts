export interface DashboardStats {
  streak: number
  totalCards: number
  masteredWords: number
  todayGoal: number
  completedToday: number
  xpTotal: number
}

export interface LearningModule {
  id: string
  title: string
  description: string
  progress: number
  icon: string
  route: string
}
