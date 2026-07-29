-- ICON+ MAIN 아이콘 마스킹 프리셋 추가 마이그레이션 (순수 additive — 데이터 보존)
-- 계획: docs/ICON_PLUS_절단마스킹_구현계획.md (P8-1)
-- 주의: DROP/기존 컬럼 변경 없음(기존 icon_plus_resources는 미변경).
--       `prisma migrate deploy`(전진 전용)로만 적용할 것. shadow DB 미사용.

-- CreateEnum
CREATE TYPE "IconPlusCutPosition" AS ENUM ('TOP_RIGHT', 'BOTTOM_RIGHT');

-- CreateTable
CREATE TABLE "icon_plus_main_presets" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "position" "IconPlusCutPosition" NOT NULL,
    "cutX" DOUBLE PRECISION NOT NULL,
    "cutY" DOUBLE PRECISION NOT NULL,
    "cutRadius" DOUBLE PRECISION NOT NULL,
    "anchorX" DOUBLE PRECISION NOT NULL,
    "anchorY" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "icon_plus_main_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "icon_plus_main_presets_resourceId_position_key" ON "icon_plus_main_presets"("resourceId", "position");

-- AddForeignKey
ALTER TABLE "icon_plus_main_presets" ADD CONSTRAINT "icon_plus_main_presets_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "icon_plus_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
