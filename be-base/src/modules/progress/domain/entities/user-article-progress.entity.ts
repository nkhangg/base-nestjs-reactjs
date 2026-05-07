export type ArticleProgressStatus = 'reading' | 'completed';

export interface UserArticleProgressProps {
  userId: string;
  articleId: string;
  status: ArticleProgressStatus;
  lastScrollPosition: number;
  completedAt: Date | null;
}

export class UserArticleProgress {
  private props: UserArticleProgressProps;

  private constructor(props: UserArticleProgressProps) {
    this.props = props;
  }

  static create(params: {
    userId: string;
    articleId: string;
  }): UserArticleProgress {
    return new UserArticleProgress({
      userId: params.userId,
      articleId: params.articleId,
      status: 'reading',
      lastScrollPosition: 0,
      completedAt: null,
    });
  }

  static reconstitute(props: UserArticleProgressProps): UserArticleProgress {
    return new UserArticleProgress(props);
  }

  updatePosition(position: number): void {
    this.props.lastScrollPosition = position;
  }

  markCompleted(): void {
    this.props.status = 'completed';
    this.props.completedAt = new Date();
  }

  get userId(): string {
    return this.props.userId;
  }
  get articleId(): string {
    return this.props.articleId;
  }
  get status(): ArticleProgressStatus {
    return this.props.status;
  }
  get lastScrollPosition(): number {
    return this.props.lastScrollPosition;
  }
  get completedAt(): Date | null {
    return this.props.completedAt;
  }
}
