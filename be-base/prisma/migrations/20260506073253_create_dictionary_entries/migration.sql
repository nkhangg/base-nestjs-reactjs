-- CreateTable
CREATE TABLE "dictionary_entries" (
    "id" TEXT NOT NULL,
    "kanji" TEXT,
    "hiragana" TEXT NOT NULL,
    "romaji" TEXT NOT NULL,
    "meanings" JSONB NOT NULL,
    "jlptLevel" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "creatorId" TEXT,
    "staffAuthorId" TEXT,
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dictionary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dictionary_entries_hiragana_idx" ON "dictionary_entries"("hiragana");

-- CreateIndex
CREATE INDEX "dictionary_entries_jlptLevel_idx" ON "dictionary_entries"("jlptLevel");

-- CreateIndex
CREATE INDEX "dictionary_entries_status_idx" ON "dictionary_entries"("status");
