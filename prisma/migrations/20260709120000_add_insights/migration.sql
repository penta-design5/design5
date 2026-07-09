-- INSIGHTS 기능 추가 마이그레이션 (순수 additive — 데이터 보존)
-- 계획: docs/INSIGHTS_구현계획.md · Handoff: docs/INSIGHTS_handoff.md
-- 주의: DROP/기존 컬럼 변경 없음. `prisma migrate deploy`(전진 전용)로만 적용할 것. shadow DB 미사용.

-- AlterEnum
-- CategoryType enum 끝에 INSIGHTS 추가. 이 마이그레이션 내에서 새 값을 사용하지 않으므로 PG12+ 트랜잭션에서 안전.
ALTER TYPE "CategoryType" ADD VALUE 'INSIGHTS';

-- CreateTable
CREATE TABLE "insight_posts" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "htmlUrl" TEXT NOT NULL,
    "htmlFileName" TEXT NOT NULL,
    "htmlFileSize" INTEGER NOT NULL,
    "thumbnailUrl" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insight_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "insight_posts_categoryId_createdAt_idx" ON "insight_posts"("categoryId", "createdAt");

-- AddForeignKey
ALTER TABLE "insight_posts" ADD CONSTRAINT "insight_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_posts" ADD CONSTRAINT "insight_posts_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_posts" ADD CONSTRAINT "insight_posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
