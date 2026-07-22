-- 디자인 의뢰 첨부파일 기능 추가 마이그레이션 (순수 additive — 데이터 보존)
-- 계획: docs/디자인의뢰_첨부파일_구현계획.md
-- 주의: DROP/기존 컬럼 변경 없음. `prisma migrate deploy`(전진 전용)로만 적용할 것. shadow DB 미사용.

-- CreateTable
CREATE TABLE "design_request_attachments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "design_request_attachments_requestId_idx" ON "design_request_attachments"("requestId");

-- AddForeignKey
ALTER TABLE "design_request_attachments" ADD CONSTRAINT "design_request_attachments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "design_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
