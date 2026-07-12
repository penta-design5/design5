-- AI 사용가이드 카드 그라데이션 색상 추가 마이그레이션 (순수 additive — 데이터 보존)
-- 계획: docs/INSIGHTS_구현계획.md · Handoff: docs/INSIGHTS_handoff.md
-- 주의: DROP/기존 컬럼 변경 없음. `prisma migrate deploy`(전진 전용)로만 적용할 것. shadow DB 미사용.

-- AlterTable
-- insight_posts에 nullable cardColor(HEX) 컬럼 추가. 기존 행은 NULL(기본 중립색으로 렌더).
ALTER TABLE "insight_posts" ADD COLUMN "cardColor" TEXT;
