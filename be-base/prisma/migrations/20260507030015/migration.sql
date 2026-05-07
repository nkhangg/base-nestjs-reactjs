-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "questionData" JSONB NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "creatorId" TEXT,
    "staffAuthorId" TEXT,
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "questions_referenceType_referenceId_idx" ON "questions"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "questions_status_idx" ON "questions"("status");
