# [BE] FEATURE PLAN — MODULE 2: article (Bài đọc / Đọc hiểu)
> **Ngày:** 06/05/2026

---

## Mục đích

Kho bài đọc tiếng Nhật với phân loại (categories, tags), tokenization để click-to-lookup, furigana toggle. Khác với blog module (marketing), article phục vụ học viên trực tiếp và có workflow moderation.

---

## Domain

Files:
- CREATE `be-base/src/modules/article/domain/entities/article.entity.ts`
  — id, title, slug, contentRaw, contentAnnotated (tokenized JSON), level, status (pending/approved/rejected), authorId, staffAuthorId, verifiedBy, createdAt
- CREATE `be-base/src/modules/article/domain/entities/article-category.entity.ts`
  — id, name, slug, colorCode, iconUrl
- CREATE `be-base/src/modules/article/domain/entities/article-tag.entity.ts`
  — id, name
- CREATE repositories cho article, article-category, article-tag
- CREATE `be-base/src/modules/article/domain/events/article-published.event.ts`

---

## Application

Files:
- CREATE use-cases: create, update, delete, get, list, publish, unpublish, moderate, list-pending
- CREATE category use-cases: create, update, delete, list
- CREATE tag use-cases: create, delete, list

---

## Infrastructure

Files:
- CREATE `prisma-article.repository.ts` — many-to-many join cho categories và tags qua junction tables
- CREATE mappers, in-memory repos

---

## Presentation

**Admin** (`/admin/articles`) — CRUD + publish/unpublish + moderate + category/tag CRUD

**Public** (`/articles`) — @Public():

| Method | Path | Mô tả |
|---|---|---|
| GET | `/articles` | list (filter: category, tag, level, page) |
| GET | `/articles/categories` | list categories |
| GET | `/articles/:slug` | get article + annotated content |

---

## Prisma Schema

```prisma
model Article {
  id               String   @id @default(uuid())
  title            String
  slug             String   @unique
  contentRaw       String
  contentAnnotated Json?
  level            Int?
  status           String   @default("pending")
  authorId         String?
  staffAuthorId    String?
  verifiedBy       String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  categories ArticleCategoryMap[]
  tags       ArticleTagMap[]
  questions  Question[]
  progresses UserArticleProgress[]

  @@index([status])
  @@index([level])
  @@map("articles")
}

model ArticleCategory {
  id        String @id @default(uuid())
  name      String
  slug      String @unique
  colorCode String?
  iconUrl   String?

  articles ArticleCategoryMap[]
  @@map("article_categories")
}

model ArticleTag {
  id   String @id @default(uuid())
  name String @unique

  articles ArticleTagMap[]
  @@map("article_tags")
}

model ArticleCategoryMap {
  articleId  String
  categoryId String
  article    Article         @relation(fields: [articleId], references: [id], onDelete: Cascade)
  category   ArticleCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([articleId, categoryId])
  @@map("article_category_maps")
}

model ArticleTagMap {
  articleId String
  tagId     String
  article   Article    @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag       ArticleTag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([articleId, tagId])
  @@map("article_tag_maps")
}
```

**Migration name:** `create_articles_and_taxonomy`

---

## Edge Cases

- `contentAnnotated` (JSONB) có thể rất lớn — chỉ trả về trong GET single article, **không** trong list endpoint
- Many-to-many với categories/tags qua junction table, cần cascade delete
