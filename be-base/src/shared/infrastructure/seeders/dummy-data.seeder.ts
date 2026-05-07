import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

interface DictEntry {
  id: string;
  kanji: string | null;
  hiragana: string;
  romaji: string;
  meanings: string[];
  jlptLevel: number;
}

interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  colorCode?: string;
}

interface ArticleTag {
  id: string;
  name: string;
}

interface ArticleData {
  id: string;
  title: string;
  slug: string;
  contentRaw: string;
  level: number;
  status: string;
  categoryIds: string[];
  tagIds: string[];
}

interface ArticlesFile {
  categories: ArticleCategory[];
  tags: ArticleTag[];
  articles: ArticleData[];
}

interface QuestionFile {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  questionData: any;
  referenceType: string | null;
  referenceId: string | null;
}

interface UserFile {
  id: string;
  email: string;
  name: string;
  role: string;
  xpTotal: number;
  streakCount: number;
}

interface ClassroomData {
  id: string;
  name: string;
  inviteCode: string;
  teacherId: string;
  memberIds: string[];
}

interface OrgFile {
  id: string;
  name: string;
  ownerId: string;
  classrooms: ClassroomData[];
}

@Injectable()
export class DummyDataSeeder {
  private readonly logger = new Logger(DummyDataSeeder.name);
  private readonly dataDir = join(process.cwd(), 'prisma', 'seed-data');

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    if (process.env.NODE_ENV === 'production') return;

    this.logger.log('Seeding dummy data...');

    const dictEntries = await this.seedDictionary();
    const { articles } = await this.seedArticles();
    await this.seedQuestions();
    const users = await this.seedUsers();
    await this.seedOrganizations();
    await this.seedFlashcards(users, dictEntries);
    await this.seedProgress(users, articles);

    this.logger.log('Dummy data seeded successfully');
  }

  private load<T>(filename: string): T {
    return JSON.parse(readFileSync(join(this.dataDir, filename), 'utf-8')) as T;
  }

  private async seedDictionary(): Promise<DictEntry[]> {
    const entries = this.load<DictEntry[]>('dictionary.json');

    for (const entry of entries) {
      await this.prisma.dictionaryEntry.upsert({
        where: { id: entry.id },
        create: {
          id: entry.id,
          kanji: entry.kanji,
          hiragana: entry.hiragana,
          romaji: entry.romaji,
          meanings: entry.meanings,
          jlptLevel: entry.jlptLevel,
          status: 'approved',
          isPublic: true,
        },
        update: {},
      });
    }

    this.logger.log(`Seeded ${entries.length} dictionary entries`);
    return entries;
  }

  private async seedArticles(): Promise<{ articles: ArticleData[] }> {
    const file = this.load<ArticlesFile>('articles.json');

    for (const cat of file.categories) {
      await this.prisma.articleCategory.upsert({
        where: { slug: cat.slug },
        create: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          colorCode: cat.colorCode,
        },
        update: {},
      });
    }

    for (const tag of file.tags) {
      await this.prisma.articleTag.upsert({
        where: { name: tag.name },
        create: { id: tag.id, name: tag.name },
        update: {},
      });
    }

    for (const article of file.articles) {
      await this.prisma.article.upsert({
        where: { slug: article.slug },
        create: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          contentRaw: article.contentRaw,
          level: article.level,
          status: article.status,
          categories: {
            create: article.categoryIds.map((categoryId) => ({ categoryId })),
          },
          tags: {
            create: article.tagIds.map((tagId) => ({ tagId })),
          },
        },
        update: {},
      });
    }

    this.logger.log(`Seeded ${file.articles.length} articles`);
    return { articles: file.articles };
  }

  private async seedQuestions(): Promise<void> {
    const questions = this.load<QuestionFile[]>('questions.json');

    for (const q of questions) {
      await this.prisma.question.upsert({
        where: { id: q.id },
        create: {
          id: q.id,
          questionData: q.questionData,
          referenceType: q.referenceType,
          referenceId: q.referenceId,
          status: 'approved',
          isPublic: true,
        },
        update: {},
      });
    }

    this.logger.log(`Seeded ${questions.length} questions`);
  }

  private async seedUsers(): Promise<UserFile[]> {
    const users = this.load<UserFile[]>('users.json');
    const passwordHash = bcrypt.hashSync('Test@1234', 10);

    for (const user of users) {
      await this.prisma.user.upsert({
        where: { email: user.email },
        create: {
          id: user.id,
          email: user.email,
          firstName: user.name,
          passwordHash,
          role: user.role,
          xpTotal: user.xpTotal,
          streakCount: user.streakCount,
          isActive: true,
        },
        update: {},
      });
    }

    this.logger.log(`Seeded ${users.length} dummy users`);
    return users;
  }

  private async seedOrganizations(): Promise<void> {
    const orgs = this.load<OrgFile[]>('organizations.json');

    for (const org of orgs) {
      await this.prisma.organization.upsert({
        where: { id: org.id },
        create: { id: org.id, name: org.name, ownerId: org.ownerId },
        update: {},
      });

      for (const classroom of org.classrooms) {
        await this.prisma.classroom.upsert({
          where: { inviteCode: classroom.inviteCode },
          create: {
            id: classroom.id,
            orgId: org.id,
            name: classroom.name,
            inviteCode: classroom.inviteCode,
            teacherId: classroom.teacherId,
          },
          update: {},
        });

        for (const userId of classroom.memberIds) {
          await this.prisma.classroomMember.upsert({
            where: {
              classroomId_userId: { classroomId: classroom.id, userId },
            },
            create: { classroomId: classroom.id, userId },
            update: {},
          });
        }
      }
    }

    this.logger.log(`Seeded ${orgs.length} organizations`);
  }

  private async seedFlashcards(
    users: UserFile[],
    dictEntries: DictEntry[],
  ): Promise<void> {
    // Each user gets flashcards for a subset of dictionary entries
    const assignments: Array<{ userId: string; entryIds: string[] }> = [
      {
        userId: users[0].id,
        entryIds: dictEntries.slice(0, 10).map((e) => e.id),
      },
      {
        userId: users[1].id,
        entryIds: dictEntries.slice(0, 5).map((e) => e.id),
      },
      {
        userId: users[2].id,
        entryIds: dictEntries.slice(0, 8).map((e) => e.id),
      },
      { userId: users[3].id, entryIds: dictEntries.map((e) => e.id) },
      {
        userId: users[4].id,
        entryIds: dictEntries.slice(0, 15).map((e) => e.id),
      },
    ];

    let total = 0;
    for (const { userId, entryIds } of assignments) {
      for (const dictionaryEntryId of entryIds) {
        await this.prisma.flashcard.upsert({
          where: { userId_dictionaryEntryId: { userId, dictionaryEntryId } },
          create: {
            userId,
            dictionaryEntryId,
            interval: 0,
            easeFactor: 2.5,
            nextReview: new Date(),
            status: 'new',
          },
          update: {},
        });
        total++;
      }
    }

    this.logger.log(`Seeded ${total} flashcards`);
  }

  private async seedProgress(
    users: UserFile[],
    articles: ArticleData[],
  ): Promise<void> {
    const articleIds = articles.map((a) => a.id);

    // Activity logs with deterministic IDs
    const actionTypes = [
      'login',
      'read_article',
      'quiz_done',
      'flashcard_review',
    ] as const;
    const xpMap: Record<string, number> = {
      login: 5,
      read_article: 20,
      quiz_done: 30,
      flashcard_review: 10,
    };

    let logCount = 0;
    for (let ui = 0; ui < users.length; ui++) {
      for (let ai = 0; ai < actionTypes.length; ai++) {
        const actionType = actionTypes[ai];
        const id = `0fa0${ui}000-0000-4000-8000-00000000${String(ai).padStart(4, '0')}`;
        await this.prisma.activityLog.upsert({
          where: { id },
          create: {
            id,
            userId: users[ui].id,
            actionType,
            xpGained: xpMap[actionType],
            referenceId:
              actionType === 'read_article'
                ? articleIds[ai % articleIds.length]
                : null,
          },
          update: {},
        });
        logCount++;
      }
    }

    // Article progress
    let progressCount = 0;
    for (let ui = 0; ui < users.length; ui++) {
      const assignedArticles = articleIds.slice(0, Math.min(3, ui + 1));
      for (const articleId of assignedArticles) {
        const isCompleted = ui >= 2;
        await this.prisma.userArticleProgress.upsert({
          where: { userId_articleId: { userId: users[ui].id, articleId } },
          create: {
            userId: users[ui].id,
            articleId,
            status: isCompleted ? 'completed' : 'reading',
            lastScrollPosition: isCompleted ? 100 : 45,
            completedAt: isCompleted ? new Date('2026-04-01') : null,
          },
          update: {},
        });
        progressCount++;
      }
    }

    this.logger.log(
      `Seeded ${logCount} activity logs, ${progressCount} article progresses`,
    );
  }
}
