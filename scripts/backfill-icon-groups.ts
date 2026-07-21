/**
 * ICON 탭 기존 아이콘에 그룹값(subtitle) 백필.
 *
 * 배경: ICON 탭 아이콘(Post)은 업로드 시 그룹 정보를 저장하지 않아, 그룹 필터 도입 전
 * 올라간 아이콘들은 `subtitle`이 비어 있다. 이 스크립트가 `scripts/icon-group-map.json`
 * (name→group, Figma 추출 폴더 구조에서 생성)을 기준으로 `Post.title`을 매칭해 `subtitle`을 채운다.
 *
 * ⚠️ 데이터 작업이라 배포(git)로 옮겨지지 않는다. 개발망(design6) → 운영망(design5) 각각 실행.
 *    스키마 변경 없음(기존 subtitle 컬럼 재사용).
 *
 * 사용법 (DATABASE_URL 필요, 서버 등 DB 접근 가능한 곳에서):
 *   npx tsx scripts/backfill-icon-groups.ts --dry-run   # 미리보기(쓰기 없음)
 *   npx tsx scripts/backfill-icon-groups.ts             # 실제 반영
 *   ICON_CATEGORY_SLUG=icon npx tsx scripts/backfill-icon-groups.ts   # 카테고리 slug 지정(기본 icon)
 *
 * npm 스크립트: npm run db:backfill-icon-groups[:dry]
 *
 * @see docs/ICON_SVG렌더링_수정_handoff.md §9
 */

import * as fs from 'fs'
import * as path from 'path'
import 'dotenv/config'
import { prisma } from '../lib/prisma'
import { isIconGroup } from '../lib/icon-groups'

const DRY_RUN = process.argv.includes('--dry-run')
const CATEGORY_SLUG = process.env.ICON_CATEGORY_SLUG?.trim() || 'icon'
const MAP_PATH = path.join(process.cwd(), 'scripts', 'icon-group-map.json')

async function main() {
  // 1) name→group 매핑 로드 및 검증
  const raw = fs.readFileSync(MAP_PATH, 'utf8')
  const map = JSON.parse(raw) as Record<string, string>
  const names = Object.keys(map)
  const invalidGroups = [...new Set(Object.values(map))].filter((g) => !isIconGroup(g))
  if (invalidGroups.length > 0) {
    console.error('매핑에 알 수 없는 그룹이 있습니다:', invalidGroups)
    process.exit(1)
  }
  console.log(`매핑 로드: ${names.length}개 이름 (${MAP_PATH})`)
  console.log(DRY_RUN ? '모드: DRY-RUN (쓰기 없음)\n' : '모드: 실제 반영\n')

  // 2) 대상 카테고리 확인
  const category = await prisma.category.findUnique({ where: { slug: CATEGORY_SLUG } })
  if (!category) {
    console.error(`카테고리를 찾을 수 없습니다: slug=${CATEGORY_SLUG}`)
    process.exit(1)
  }

  // 3) 해당 카테고리의 아이콘 Post 조회
  const posts = await prisma.post.findMany({
    where: { categoryId: category.id },
    select: { id: true, title: true, subtitle: true },
  })
  console.log(`카테고리 '${CATEGORY_SLUG}' 아이콘 Post: ${posts.length}개\n`)

  // 4) 매칭 및 업데이트
  let updated = 0
  let alreadyOk = 0
  const unmatched: string[] = []

  for (const post of posts) {
    const group = map[post.title]
    if (!group) {
      unmatched.push(post.title)
      continue
    }
    if (post.subtitle === group) {
      alreadyOk++
      continue
    }
    if (!DRY_RUN) {
      await prisma.post.update({ where: { id: post.id }, data: { subtitle: group } })
    }
    updated++
    if (updated <= 10) console.log(`  ${DRY_RUN ? '[예정]' : '[반영]'} ${post.title} → ${group}`)
  }

  // 5) 매핑엔 있으나 DB에 없는 이름(누락 아이콘)
  const dbTitles = new Set(posts.map((p) => p.title))
  const missingInDb = names.filter((n) => !dbTitles.has(n))

  console.log('\n=== 결과 요약 ===')
  console.log(`업데이트${DRY_RUN ? '(예정)' : ''}: ${updated}`)
  console.log(`이미 정상(변경 불필요): ${alreadyOk}`)
  console.log(`매칭 실패(매핑에 없는 Post): ${unmatched.length}`)
  if (unmatched.length > 0) console.log('  →', unmatched.join(', '))
  console.log(`매핑엔 있으나 DB에 없는 이름: ${missingInDb.length}`)
  if (missingInDb.length > 0) console.log('  →', missingInDb.join(', '))

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
