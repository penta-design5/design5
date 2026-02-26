/**
 * B2 URL → assets.layerary.com (Worker) 일괄 마이그레이션 스크립트
 *
 * 사용법:
 *   npx tsx scripts/migrate-b2-urls-to-worker.ts --dry-run   # 변경 대상만 로그, DB 미수정
 *   npx tsx scripts/migrate-b2-urls-to-worker.ts            # 실제 DB 업데이트
 *
 * .env에 DATABASE_URL(및 필요 시 DIRECT_URL) 설정 필요.
 * B2_BUCKET_NAME은 path 추출 시 S3/경로형 URL에서만 사용(backblazeb2.com 직접 URL은 불필요).
 */

import 'dotenv/config'
import { prisma } from '../lib/prisma'

const WORKER_BASE = 'https://assets.layerary.com'
const B2_DOMAIN = 'backblazeb2.com'

/** B2 네이티브(/file/...), S3 호환, Worker 경로형 URL에서 파일 경로 추출 (lib/b2.ts와 동일 로직) */
function getFilePathFromB2Url(fileUrl: string): string {
  let filePath = ''
  if (fileUrl.includes('/file/')) {
    const match = fileUrl.match(/\/file\/[^/]+\/(.+)$/)
    if (match) filePath = match[1]
  } else {
    try {
      const urlObj = new URL(fileUrl)
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      const bucketName = process.env.B2_BUCKET_NAME
      if (pathParts.length >= 1 && bucketName && pathParts[0] === bucketName) {
        filePath = pathParts.slice(1).join('/')
      } else if (pathParts.length >= 1) {
        filePath = pathParts.join('/')
      }
    } catch {
      // invalid URL
    }
  }
  return filePath
}

/** B2 URL이면 Worker URL로 변환, 이미 Worker URL이거나 B2가 아니면 그대로 반환 */
function toWorkerUrl(url: string | null | undefined): string | null {
  if (url == null || typeof url !== 'string' || !url.trim()) return url ?? null
  const u = url.trim()
  if (u.includes(WORKER_BASE)) return u
  if (!u.includes(B2_DOMAIN)) return u
  const path = getFilePathFromB2Url(u)
  if (!path) return u
  return `${WORKER_BASE}/${path}`
}

function isDryRun(): boolean {
  return process.argv.includes('--dry-run')
}

// --- 모델별 마이그레이션 ---

async function migrateUsers(dryRun: boolean) {
  const users = await prisma.user.findMany({
    where: { avatar: { not: null } },
    select: { id: true, email: true, avatar: true },
  })
  let count = 0
  for (const u of users) {
    const avatar = u.avatar as string | null
    const next = toWorkerUrl(avatar)
    if (next !== avatar) {
      count++
      console.log(`  User ${u.email} avatar: ${avatar} → ${next}`)
      if (!dryRun) await prisma.user.update({ where: { id: u.id }, data: { avatar: next } })
    }
  }
  return count
}

async function migratePosts(dryRun: boolean) {
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      fileUrl: true,
      images: true,
    },
  })
  let count = 0
  for (const p of posts) {
    const updates: { thumbnailUrl?: string | null; fileUrl?: string; images?: unknown } = {}
    const thumb = toWorkerUrl(p.thumbnailUrl)
    if (thumb !== p.thumbnailUrl) {
      updates.thumbnailUrl = thumb
      console.log(`  Post ${p.id} thumbnailUrl: ${p.thumbnailUrl} → ${thumb}`)
    }
    const file = toWorkerUrl(p.fileUrl)
    if (file !== p.fileUrl) {
      updates.fileUrl = file!
      console.log(`  Post ${p.id} fileUrl: ${p.fileUrl} → ${file}`)
    }
    if (Array.isArray(p.images)) {
      let changed = false
      const nextImages = p.images.map((item: { url?: string; thumbnailUrl?: string; [k: string]: unknown }) => {
        const url = toWorkerUrl(item.url)
        const thumbnailUrl = toWorkerUrl(item.thumbnailUrl)
        if (url !== item.url || thumbnailUrl !== item.thumbnailUrl) changed = true
        return { ...item, url: url ?? item.url, thumbnailUrl: thumbnailUrl ?? item.thumbnailUrl }
      })
      if (changed) {
        updates.images = nextImages
        console.log(`  Post ${p.id} images: updated ${nextImages.length} items`)
      }
    }
    if (Object.keys(updates).length > 0) {
      count++
      if (!dryRun) await prisma.post.update({ where: { id: p.id }, data: updates })
    }
  }
  return count
}

async function migrateNotices(dryRun: boolean) {
  const notices = await prisma.notice.findMany({
    select: { id: true, title: true, attachments: true },
  })
  let count = 0
  for (const n of notices) {
    if (!Array.isArray(n.attachments)) continue
    let changed = false
    const next = n.attachments.map((item: { url?: string; [k: string]: unknown }) => {
      const url = toWorkerUrl(item.url)
      if (url !== item.url) changed = true
      return { ...item, url: url ?? item.url }
    })
    if (changed) {
      count++
      console.log(`  Notice ${n.id} attachments: updated`)
      if (!dryRun) await prisma.notice.update({ where: { id: n.id }, data: { attachments: next } })
    }
  }
  return count
}

async function migrateWelcomeBoardTemplates(dryRun: boolean) {
  const list = await prisma.welcomeBoardTemplate.findMany({
    select: { id: true, name: true, thumbnailUrl: true, backgroundUrl: true },
  })
  let count = 0
  for (const t of list) {
    const thumb = toWorkerUrl(t.thumbnailUrl)
    const bg = toWorkerUrl(t.backgroundUrl)
    if (thumb !== t.thumbnailUrl || bg !== t.backgroundUrl) {
      count++
      if (thumb !== t.thumbnailUrl) console.log(`  WelcomeBoardTemplate ${t.id} thumbnailUrl: ${t.thumbnailUrl} → ${thumb}`)
      if (bg !== t.backgroundUrl) console.log(`  WelcomeBoardTemplate ${t.id} backgroundUrl: ${t.backgroundUrl} → ${bg}`)
      if (!dryRun) {
        await prisma.welcomeBoardTemplate.update({
          where: { id: t.id },
          data: { thumbnailUrl: thumb ?? undefined, backgroundUrl: bg! },
        })
      }
    }
  }
  return count
}

async function migrateDiagrams(dryRun: boolean) {
  const list = await prisma.diagram.findMany({
    select: { id: true, title: true, thumbnailUrl: true },
  })
  let count = 0
  for (const d of list) {
    const thumb = toWorkerUrl(d.thumbnailUrl)
    if (thumb !== d.thumbnailUrl) {
      count++
      console.log(`  Diagram ${d.id} thumbnailUrl: ${d.thumbnailUrl} → ${thumb}`)
      if (!dryRun) await prisma.diagram.update({ where: { id: d.id }, data: { thumbnailUrl: thumb } })
    }
  }
  return count
}

async function migrateDesktopWallpapers(dryRun: boolean) {
  const list = await prisma.desktopWallpaper.findMany({
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      backgroundUrlWindows: true,
      backgroundUrlMac: true,
    },
  })
  let count = 0
  for (const w of list) {
    const thumb = toWorkerUrl(w.thumbnailUrl)
    const win = toWorkerUrl(w.backgroundUrlWindows)
    const mac = toWorkerUrl(w.backgroundUrlMac)
    if (thumb !== w.thumbnailUrl || win !== w.backgroundUrlWindows || mac !== w.backgroundUrlMac) {
      count++
      if (thumb !== w.thumbnailUrl) console.log(`  DesktopWallpaper ${w.id} thumbnailUrl → ${thumb}`)
      if (win !== w.backgroundUrlWindows) console.log(`  DesktopWallpaper ${w.id} backgroundUrlWindows → ${win}`)
      if (mac !== w.backgroundUrlMac) console.log(`  DesktopWallpaper ${w.id} backgroundUrlMac → ${mac}`)
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
  }
  return count
}

async function migrateCardTemplates(dryRun: boolean) {
  const list = await prisma.cardTemplate.findMany({
    select: { id: true, name: true, thumbnailUrl: true, backgroundImages: true },
  })
  let count = 0
  for (const c of list) {
    const thumb = toWorkerUrl(c.thumbnailUrl)
    let bgChanged = false
    const bgImages = Array.isArray(c.backgroundImages)
      ? (c.backgroundImages as { url?: string; [k: string]: unknown }[]).map((item) => {
          const url = toWorkerUrl(item.url)
          if (url !== item.url) bgChanged = true
          return { ...item, url: url ?? item.url }
        })
      : c.backgroundImages
    if (thumb !== c.thumbnailUrl || bgChanged) {
      count++
      if (thumb !== c.thumbnailUrl) console.log(`  CardTemplate ${c.id} thumbnailUrl: ${c.thumbnailUrl} → ${thumb}`)
      if (bgChanged) console.log(`  CardTemplate ${c.id} backgroundImages: updated`)
      if (!dryRun) {
        await prisma.cardTemplate.update({
          where: { id: c.id },
          data: { thumbnailUrl: thumb ?? undefined, backgroundImages: bgImages },
        })
      }
    }
  }
  return count
}

async function migrateDiagramZipConfig(dryRun: boolean) {
  const row = await prisma.diagramZipConfig.findFirst({ select: { id: true, zipFileUrl: true } })
  if (!row?.zipFileUrl) return 0
  const next = toWorkerUrl(row.zipFileUrl)
  if (next === row.zipFileUrl) return 0
  console.log(`  DiagramZipConfig zipFileUrl: ${row.zipFileUrl} → ${next}`)
  if (!dryRun) await prisma.diagramZipConfig.update({ where: { id: row.id }, data: { zipFileUrl: next } })
  return 1
}

async function migrateCategories(dryRun: boolean) {
  const list = await prisma.category.findMany({
    select: { id: true, name: true, config: true },
  })
  let count = 0
  for (const c of list) {
    const config = c.config as { guideVideoUrl?: string; [k: string]: unknown } | null
    if (!config || typeof config.guideVideoUrl !== 'string') continue
    const url = toWorkerUrl(config.guideVideoUrl)
    if (url === config.guideVideoUrl) continue
    count++
    console.log(`  Category ${c.name} config.guideVideoUrl: ${config.guideVideoUrl} → ${url}`)
    if (!dryRun) {
      await prisma.category.update({
        where: { id: c.id },
        data: { config: { ...config, guideVideoUrl: url } },
      })
    }
  }
  return count
}

async function main() {
  const dryRun = isDryRun()
  console.log(dryRun ? '\n[DRY RUN] 변경 대상만 출력하고 DB는 수정하지 않습니다.\n' : '\n실제 DB를 업데이트합니다.\n')

  const totals: Record<string, number> = {}
  totals.User = await migrateUsers(dryRun)
  totals.Post = await migratePosts(dryRun)
  totals.Notice = await migrateNotices(dryRun)
  totals.WelcomeBoardTemplate = await migrateWelcomeBoardTemplates(dryRun)
  totals.Diagram = await migrateDiagrams(dryRun)
  totals.DesktopWallpaper = await migrateDesktopWallpapers(dryRun)
  totals.CardTemplate = await migrateCardTemplates(dryRun)
  totals.DiagramZipConfig = await migrateDiagramZipConfig(dryRun)
  totals.Category = await migrateCategories(dryRun)

  const total = Object.values(totals).reduce((a, b) => a + b, 0)
  console.log('\n--- 요약 ---')
  Object.entries(totals).forEach(([model, n]) => console.log(`  ${model}: ${n}건`))
  console.log(`  총 변경: ${total}건`)
  if (dryRun && total > 0) console.log('\n실제 반영하려면 --dry-run 없이 실행하세요.')
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
