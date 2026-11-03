-- 사이드 메뉴 관리 P0: 카테고리 숨김 컬럼 추가 (순수 additive — 데이터 보존)
-- 계획: docs/MENU_ADMIN_구현계획.md · Handoff: docs/MENU_ADMIN_handoff.md
-- 주의: DROP/기존 컬럼 변경 없음. `prisma migrate deploy`(전진 전용)로만 적용할 것. shadow DB 미사용.

-- AlterTable
-- 기존 행은 false(표시). Sidebar의 slug 하드코딩 숨김을 이 값으로 대체한다.
ALTER TABLE "categories" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- Data: 기존 하드코딩 숨김(eDM: LABs 링크로만 사용, 다이어그램: 비공개)을 컬럼 값으로 이전
UPDATE "categories" SET "isHidden" = true WHERE "slug" IN ('edm', 'diagram');

-- Data: Sidebar templateMenuSlugOrder(ppt → wallpaper → welcome-board → card) 하드코딩을 DB order로 이전
UPDATE "categories" SET "order" = 1 WHERE "slug" = 'ppt';
UPDATE "categories" SET "order" = 2 WHERE "slug" = 'wallpaper';
UPDATE "categories" SET "order" = 3 WHERE "slug" = 'welcome-board';
UPDATE "categories" SET "order" = 4 WHERE "slug" = 'card';
UPDATE "categories" SET "order" = 5 WHERE "slug" = 'edm';
