import {
  Question,
  type QuestionData,
  type QuestionReferenceType,
  type QuestionStatus,
} from '../../domain/entities/question.entity';

interface PrismaQuestionRow {
  id: string;
  questionData: unknown;
  referenceType: string | null;
  referenceId: string | null;
  status: string;
  isPublic: boolean;
  creatorId: string | null;
  staffAuthorId: string | null;
  verifiedBy: string | null;
  createdAt: Date;
}

export class QuestionMapper {
  static toDomain(row: PrismaQuestionRow): Question {
    return Question.reconstitute(row.id, {
      questionData: row.questionData as QuestionData,
      referenceType: (row.referenceType as QuestionReferenceType) ?? null,
      referenceId: row.referenceId,
      status: row.status as QuestionStatus,
      isPublic: row.isPublic,
      creatorId: row.creatorId,
      staffAuthorId: row.staffAuthorId,
      verifiedBy: row.verifiedBy,
      createdAt: row.createdAt,
    });
  }
}
