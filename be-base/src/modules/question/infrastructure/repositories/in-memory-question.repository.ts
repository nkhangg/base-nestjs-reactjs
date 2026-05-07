import type {
  IQuestionRepository,
  ListQuestionsOptions,
} from '../../domain/repositories/question.repository';
import type { Question } from '../../domain/entities/question.entity';

export class InMemoryQuestionRepository implements IQuestionRepository {
  private readonly store = new Map<string, Question>();

  async findById(id: string): Promise<Question | null> {
    return this.store.get(id) ?? null;
  }

  async list(
    opts: ListQuestionsOptions,
  ): Promise<{ data: Question[]; total: number }> {
    let results = Array.from(this.store.values());

    if (opts.status) results = results.filter((q) => q.status === opts.status);
    if (opts.referenceType)
      results = results.filter((q) => q.referenceType === opts.referenceType);
    if (opts.referenceId)
      results = results.filter((q) => q.referenceId === opts.referenceId);
    if (opts.isPublic !== undefined)
      results = results.filter((q) => q.isPublic === opts.isPublic);

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const skip = (opts.page - 1) * opts.pageSize;
    return { data: results.slice(skip, skip + opts.pageSize), total };
  }

  async listByReference(
    referenceType: string,
    referenceId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Question[]; total: number }> {
    const results = Array.from(this.store.values())
      .filter(
        (q) =>
          q.referenceType === referenceType &&
          q.referenceId === referenceId &&
          q.status === 'approved' &&
          q.isPublic,
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const total = results.length;
    const skip = (page - 1) * pageSize;
    return { data: results.slice(skip, skip + pageSize), total };
  }

  async findApprovedPublic(
    count: number,
    jlptLevel?: number,
  ): Promise<Question[]> {
    let results = Array.from(this.store.values()).filter(
      (q) => q.status === 'approved' && q.isPublic,
    );

    if (jlptLevel !== undefined) {
      results = results.filter((q) => q.questionData.jlptLevel === jlptLevel);
    }

    const shuffled = results.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  async save(question: Question): Promise<void> {
    this.store.set(question.id.value, question);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
