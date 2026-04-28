/**
 * DB에 저장된 스토리지 절대 URL을 일괄 치환 (Supabase / R2 / B2·Worker 등 → 사내 S3 퍼블릭 베이스).
 * 포함: User, Post, Notice(content·attachments), DesignRequest(content), WelcomeBoard, Diagram(+canvasData),
 * Edm(html·JSON), DesktopWallpaper, CardTemplate, DiagramZipConfig, Category.config
 *
 * 사용법:
 *   STORAGE_URL_REPLACEMENTS_FILE=scripts/my-replacements.json npx tsx scripts/migrate-storage-urls-to-s3.ts --dry-run
 *   STORAGE_URL_REPLACEMENTS_FILE=scripts/my-replacements.json npx tsx scripts/migrate-storage-urls-to-s3.ts
 *
 * 또는 한 줄 JSON:
 *   STORAGE_URL_REPLACEMENTS_JSON='[{"from":"https://old","to":"https://new"}]' npx tsx ...
 *
 * DATABASE_URL(및 필요 시 DIRECT_URL) 필수.
 */

import * as fs from 'fs'
import * as path from 'path'
import 'dotenv/config'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

type Pair = { from: string; to: string }

function loadPairs(): Pair[] {
  const file = process.env.STORAGE_URL_REPLACEMENTS_FILE?.trim()
  const jsonEnv = process.env.STORAGE_URL_REPLACEMENTS_JSON?.trim()
  let raw: string
  if (file) {
    const p = path.isAbsolute(file) ? file : path.join(process.cwd(), file)
    raw = fs.readFileSync(p, 'utf8')
  } else if (jsonEnv) {
    raw = jsonEnv
  } else {
    console.error(
      'STORAGE_URL_REPLACEMENTS_FILE 또는 STORAGE_URL_REPLACEMENTS_JSON 을 설정하세요.\n' +
        '예: STORAGE_URL_REPLACEMENTS_FILE=scripts/storage-url-replacements.example.json'
    )
    process.exit(1)
  }
  const arr = JSON.parse(raw) as unknown
  if (!Array.isArray(arr) || arr.length === 0) {
    console.error('치환 규칙은 비어 있지 않은 JSON 배열이어야 합니다: [{ "from": "...", "to": "..." }, ...]')
    process.exit(1)
  }
  const pairs: Pair[] = []
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue
    const from = String((item as Pair).from ?? '').trim()
    const to = String((item as Pair).to ?? '').trim()
    if (!from) continue
    pairs.push({ from, to })
  }
  if (pairs.length === 0) {
    console.error('유효한 from/to 쌍이 없습니다.')
    process.exit(1)
  }
  pairs.sort((a, b) => b.from.length - a.from.length)
  return pairs
}

const PAIRS = loadPairs()

function applyToString(s: string): string {
  let out = s
  for (const { from, to } of PAIRS) {
    if (out.includes(from)) out = out.split(from).join(to)
  }
  return out
}

function applyMaybe(s: string | null | undefined): string | null {
  if (s == null || typeof s !== 'string') return s ?? null
  const next = applyToString(s)
  return next === s ? s : next
}

function mapJson(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return applyToString(value)
  if (Array.isArray(value)) return value.map((v) => mapJson(v))
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(o)) {
      out[k] = mapJson(v)
    }
    return out
  }
  return value
}

function jsonChanged(before: unknown, after: unknown): boolean {
  return JSON.stringify(before) !== JSON.stringify(after)
}

function isDryRun(): boolean {
  return process.argv.includes('--dry-run')
}

async function migrateUsers(dryRun: boolean): Promise<number> {
  const users = await prisma.user.findMany({
    where: { avatar: { not: null } },
    select: { id: true, email: true, avatar: true },
  })
  let n = 0
  for (const u of users) {
    const next = applyMaybe(u.avatar)
    if (next !== u.avatar) {
      n++
      console.log(`  User ${u.email} avatar`)
      if (!dryRun) await prisma.user.update({ where: { id: u.id }, data: { avatar: next } })
    }
  }
  return n
}

async function migratePosts(dryRun: boolean): Promise<number> {
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, thumbnailUrl: true, fileUrl: true, images: true },
  })
  let n = 0
  for (const p of posts) {
    const updates: Prisma.PostUpdateInput = {}
    const thumb = applyMaybe(p.thumbnailUrl)
    if (thumb !== p.thumbnailUrl) updates.thumbnailUrl = thumb
    const file = applyToString(p.fileUrl)
    if (file !== p.fileUrl) updates.fileUrl = file
    if (p.images != null) {
      const next = mapJson(p.images)
      if (jsonChanged(p.images, next)) {
        updates.images = next as Prisma.InputJsonValue
        console.log(`  Post ${p.id} (${p.title}) images JSON`)
      }
    }
    if (Object.keys(updates).length > 0) {
      n++
      if (!dryRun) await prisma.post.update({ where: { id: p.id }, data: updates })
    }
  }
  return n
}

async function migrateNotices(dryRun: boolean): Promise<number> {
  const notices = await prisma.notice.findMany({
    select: { id: true, title: true, attachments: true, content: true },
  })
  let n = 0
  for (const x of notices) {
    const updates: Prisma.NoticeUpdateInput = {}
    const nextContent = applyToString(x.content)
    if (nextContent !== x.content) {
      updates.content = nextContent
      console.log(`  Notice ${x.id} content (Markdown 등 URL)`)
    }
    if (x.attachments != null) {
      const next = mapJson(x.attachments)
      if (jsonChanged(x.attachments, next)) {
        updates.attachments = next as Prisma.InputJsonValue
        console.log(`  Notice ${x.id} attachments`)
      }
    }
    if (Object.keys(updates).length > 0) {
      n++
      if (!dryRun) await prisma.notice.update({ where: { id: x.id }, data: updates })
    }
  }
  return n
}

async function migrateDesignRequests(dryRun: boolean): Promise<number> {
  const rows = await prisma.designRequest.findMany({
    select: { id: true, title: true, content: true },
  })
  let n = 0
  for (const r of rows) {
    const next = applyToString(r.content)
    if (next === r.content) continue
    n++
    console.log(`  DesignRequest ${r.id} (${r.title}) content`)
    if (!dryRun) await prisma.designRequest.update({ where: { id: r.id }, data: { content: next } })
  }
  return n
}

async function migrateWelcomeBoardTemplates(dryRun: boolean): Promise<number> {
  const list = await prisma.welcomeBoardTemplate.findMany({
    select: { id: true, name: true, thumbnailUrl: true, backgroundUrl: true },
  })
  let n = 0
  for (const t of list) {
    const thumb = applyMaybe(t.thumbnailUrl)
    const bg = applyMaybe(t.backgroundUrl)
    if (thumb === t.thumbnailUrl && bg === t.backgroundUrl) continue
    n++
    console.log(`  WelcomeBoardTemplate ${t.id}`)
    if (!dryRun) {
      await prisma.welcomeBoardTemplate.update({
        where: { id: t.id },
        data: { thumbnailUrl: thumb ?? undefined, backgroundUrl: bg! },
      })
    }
  }
  return n
}

async function migrateDiagrams(dryRun: boolean): Promise<number> {
  const list = await prisma.diagram.findMany({
    select: { id: true, title: true, thumbnailUrl: true, canvasData: true },
  })
  let n = 0
  for (const d of list) {
    const updates: Prisma.DiagramUpdateInput = {}
    const thumb = applyMaybe(d.thumbnailUrl)
    if (thumb !== d.thumbnailUrl) updates.thumbnailUrl = thumb
    if (d.canvasData != null) {
      const next = mapJson(d.canvasData)
      if (jsonChanged(d.canvasData, next)) {
        updates.canvasData = next as Prisma.InputJsonValue
        console.log(`  Diagram ${d.id} canvasData`)
      }
    }
    if (Object.keys(updates).length > 0) {
      n++
      if (!dryRun) await prisma.diagram.update({ where: { id: d.id }, data: updates })
    }
  }
  return n
}

async function migrateEdms(dryRun: boolean): Promise<number> {
  const list = await prisma.edm.findMany({
    select: { id: true, title: true, thumbnailUrl: true, cellImages: true, cellLinks: true, htmlCode: true },
  })
  let n = 0
  for (const e of list) {
    const updates: Prisma.EdmUpdateInput = {}
    const thumb = applyMaybe(e.thumbnailUrl)
    if (thumb !== e.thumbnailUrl) updates.thumbnailUrl = thumb
    if (e.cellImages != null) {
      const next = mapJson(e.cellImages)
      if (jsonChanged(e.cellImages, next)) {
        updates.cellImages = next as Prisma.InputJsonValue
        console.log(`  Edm ${e.id} cellImages`)
      }
    }
    if (e.cellLinks != null) {
      const next = mapJson(e.cellLinks)
      if (jsonChanged(e.cellLinks, next)) {
        updates.cellLinks = next as Prisma.InputJsonValue
        console.log(`  Edm ${e.id} cellLinks`)
      }
    }
    if (e.htmlCode != null) {
      const next = applyToString(e.htmlCode)
      if (next !== e.htmlCode) {
        updates.htmlCode = next
        console.log(`  Edm ${e.id} htmlCode`)
      }
    }
    if (Object.keys(updates).length > 0) {
      n++
      if (!dryRun) await prisma.edm.update({ where: { id: e.id }, data: updates })
    }
  }
  return n
}

async function migrateDesktopWallpapers(dryRun: boolean): Promise<number> {
  const list = await prisma.desktopWallpaper.findMany({
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      backgroundUrlWindows: true,
      backgroundUrlMac: true,
    },
  })
  let n = 0
  for (const w of list) {
    const thumb = applyMaybe(w.thumbnailUrl)
    const win = applyMaybe(w.backgroundUrlWindows)
    const mac = applyMaybe(w.backgroundUrlMac)
    if (thumb === w.thumbnailUrl && win === w.backgroundUrlWindows && mac === w.backgroundUrlMac) continue
    n++
    console.log(`  DesktopWallpaper ${w.id}`)
    if (!dryRun) {
      await prisma.desktopWallpaper.update({
        where: { id: w.id },
        data: {
          thumbnailUrl: thumb ?? undefined,
          backgroundUrlWindows: win ?? undefined,
          backgroundUrlMac: mac ?? undefined,
        },
      })
    }
  }
  return n
}

async function migrateCardTemplates(dryRun: boolean): Promise<number> {
  const list = await prisma.cardTemplate.findMany({
    select: { id: true, name: true, thumbnailUrl: true, backgroundImages: true },
  })
  let n = 0
  for (const c of list) {
    const updates: Prisma.CardTemplateUpdateInput = {}
    const thumb = applyMaybe(c.thumbnailUrl)
    if (thumb !== c.thumbnailUrl) updates.thumbnailUrl = thumb
    if (c.backgroundImages != null) {
      const next = mapJson(c.backgroundImages)
      if (jsonChanged(c.backgroundImages, next)) {
        updates.backgroundImages = next as Prisma.InputJsonValue
        console.log(`  CardTemplate ${c.id} backgroundImages`)
      }
    }
    if (Object.keys(updates).length > 0) {
      n++
      if (!dryRun) await prisma.cardTemplate.update({ where: { id: c.id }, data: updates })
    }
  }
  return n
}

async function migrateDiagramZipConfig(dryRun: boolean): Promise<number> {
  const row = await prisma.diagramZipConfig.findFirst({ select: { id: true, zipFileUrl: true } })
  if (!row?.zipFileUrl) return 0
  const next = applyMaybe(row.zipFileUrl)
  if (next === row.zipFileUrl) return 0
  console.log(`  DiagramZipConfig zipFileUrl`)
  if (!dryRun) await prisma.diagramZipConfig.update({ where: { id: row.id }, data: { zipFileUrl: next } })
  return 1
}

async function migrateCategories(dryRun: boolean): Promise<number> {
  const list = await prisma.category.findMany({ select: { id: true, name: true, config: true } })
  let n = 0
  for (const c of list) {
    if (c.config == null) continue
    const next = mapJson(c.config)
    if (!jsonChanged(c.config, next)) continue
    n++
    console.log(`  Category ${c.name} config`)
    if (!dryRun) await prisma.category.update({ where: { id: c.id }, data: { config: next as Prisma.InputJsonValue } })
  }
  return n
}

async function main() {
  const dryRun = isDryRun()
  console.log(dryRun ? '\n[DRY RUN] DB를 수정하지 않습니다.\n' : '\n실제 DB를 업데이트합니다.\n')
  console.log('치환 규칙 개수:', PAIRS.length)
  PAIRS.forEach((p, i) => console.log(`  ${i + 1}. "${p.from}" → "${p.to}"`))

  const totals: Record<string, number> = {}
  totals.User = await migrateUsers(dryRun)
  totals.Post = await migratePosts(dryRun)
  totals.Notice = await migrateNotices(dryRun)
  totals.WelcomeBoardTemplate = await migrateWelcomeBoardTemplates(dryRun)
  totals.Diagram = await migrateDiagrams(dryRun)
  totals.Edm = await migrateEdms(dryRun)
  totals.DesktopWallpaper = await migrateDesktopWallpapers(dryRun)
  totals.CardTemplate = await migrateCardTemplates(dryRun)
  totals.DiagramZipConfig = await migrateDiagramZipConfig(dryRun)
  totals.Category = await migrateCategories(dryRun)
  totals.DesignRequest = await migrateDesignRequests(dryRun)

  const total = Object.values(totals).reduce((a, b) => a + b, 0)
  console.log('\n--- 요약 ---')
  Object.entries(totals).forEach(([k, v]) => console.log(`  ${k}: ${v}건`))
  console.log(`  총 변경 행(추정): ${total}`)
  if (dryRun && total > 0) console.log('\n실행하려면 --dry-run 을 빼고 동일 env 로 다시 실행하세요.')
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
