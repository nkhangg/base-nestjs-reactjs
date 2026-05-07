-- CreateTable
CREATE TABLE "flashcards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dictionaryEntryId" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "nextReview" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'new',
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flashcards_userId_nextReview_idx" ON "flashcards"("userId", "nextReview");

-- CreateIndex
CREATE INDEX "flashcards_userId_status_idx" ON "flashcards"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "flashcards_userId_dictionaryEntryId_key" ON "flashcards"("userId", "dictionaryEntryId");

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_dictionaryEntryId_fkey" FOREIGN KEY ("dictionaryEntryId") REFERENCES "dictionary_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
