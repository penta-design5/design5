import { UserRole } from '@prisma/client'
import { BRAND_EN } from '@/lib/brand'
import { prisma } from '@/lib/prisma'
import { getMailTransporter } from './transporter'

type CreatedWithAuthor = {
  id: string
  title: string
  departmentTeam: string
  dueDate: Date
  author: { email: string; name: string | null }
}

/** app/layout.tsx 의 metadataBase 와 동일한 origin 규칙 */
function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL
  if (raw) {
    try {
      return new URL(raw).origin.replace(/\/$/, '')
    } catch {
      return raw.replace(/\/$/, '')
    }
  }
  return 'https://layerary.com'
}

function formatDueYmdUtc(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * 디자인 의뢰 등록 직후 관리자·의뢰자에게 알림 메일.
 * 내부에서 오류를 삼키고 로그만 남김 — API 응답에는 영향 없음.
 */
export async function notifyDesignRequestCreated(
  created: CreatedWithAuthor
): Promise<void> {
  try {
    const transporter = getMailTransporter()
    if (!transporter) {
      console.warn(
        '[mail] GMAIL_USER or GMAIL_APP_PASSWORD missing; skip design request notification'
      )
      return
    }

    const gmailUser = process.env.GMAIL_USER
    if (!gmailUser) return

    const category = await prisma.category.findFirst({
      where: { pageType: 'design-request' },
      select: { slug: true },
    })
    const slug = category?.slug ?? 'design-request'
    const detailUrl = `${getSiteOrigin()}/${slug}/${created.id}`

    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { email: true },
    })

    const recipientMap = new Map<string, string>()
    for (const row of admins) {
      const e = row.email?.trim()
      if (e) recipientMap.set(e.toLowerCase(), e)
    }
    const authorEmail = created.author.email?.trim()
    if (authorEmail) {
      recipientMap.set(authorEmail.toLowerCase(), authorEmail)
    }

    if (recipientMap.size === 0) {
      console.warn('[mail] no recipients for design request notification')
      return
    }

    const subject = `[${BRAND_EN}] 신규 디자인 의뢰가 등록되었습니다`
    const dueStr = formatDueYmdUtc(created.dueDate)
    const authorLabel =
      created.author.name?.trim() || created.author.email || '의뢰자'

    const text = [
      `안녕하세요. ${BRAND_EN}에 아래와 같이 신규 디자인 의뢰가 등록되었습니다.`,
      '',
      `제목: ${created.title}`,
      `의뢰 부서/팀: ${created.departmentTeam}`,
      `희망 마감일: ${dueStr}`,
      `의뢰자: ${authorLabel}`,
      '',
      `상세 보기: ${detailUrl}`,
      '',
      '이 메일은 시스템에서 자동 발송되었습니다.',
    ].join('\n')

    const html = `<p>안녕하세요. ${escapeHtml(BRAND_EN)}에 아래와 같이 신규 디자인 의뢰가 등록되었습니다.</p>
<ul>
<li><strong>제목</strong>: ${escapeHtml(created.title)}</li>
<li><strong>의뢰 부서/팀</strong>: ${escapeHtml(created.departmentTeam)}</li>
<li><strong>희망 마감일</strong>: ${escapeHtml(dueStr)}</li>
<li><strong>의뢰자</strong>: ${escapeHtml(authorLabel)}</li>
</ul>
<p><a href="${escapeHtml(detailUrl)}">디자인 의뢰 내용 상세 보기</a></p>
<br /><br />
<p style="font-size:12px;color:#666">본 메일은 시스템에서 자동 발송되었습니다.<br />
본 메일이 스팸으로 분류될 경우, tiper@pentasecurity.com을 주소록에 추가하시면 정상 수신됩니다.</p>`

    const from = `"${BRAND_EN}" <${gmailUser}>`

    for (const to of recipientMap.values()) {
      try {
        await transporter.sendMail({
          from,
          to,
          replyTo: gmailUser,
          subject,
          text,
          html,
        })
      } catch (err) {
        console.error('[mail] design request notification failed for', to, err)
      }
    }
  } catch (e) {
    console.error('[mail] notifyDesignRequestCreated', e)
  }
}
