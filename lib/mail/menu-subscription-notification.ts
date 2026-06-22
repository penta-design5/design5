import { BRAND_EN } from '@/lib/brand'
import { prisma } from '@/lib/prisma'
import { getMenuSubscriptionEnabled } from '@/lib/app-settings'
import { getMailTransporter } from './transporter'
import { getSiteOrigin, escapeHtml } from './utils'

type NotifyMenuUpdateInput = {
  categoryId: string
  action: 'created' | 'updated'
  /** 추가/수정된 항목 제목 (메일 본문 표시용) */
  title: string
  /** 메뉴 페이지 링크용 slug */
  slug: string
  /** Post 기반이면 상세 링크용 ID (독립 모델 메뉴는 생략 → 메뉴 페이지로 링크) */
  postId?: string
}

const ACTION_LABEL: Record<NotifyMenuUpdateInput['action'], string> = {
  created: '추가',
  updated: '수정',
}

/**
 * 메뉴(카테고리)에 게시물이 추가/수정된 직후, 해당 메뉴를 구독한 사용자에게 알림 메일.
 * 호출부에서 await 할 것(서버리스에서 발송 전 프로세스 정리 방지).
 * 내부에서 오류를 삼키고 로그만 남김 — API 응답에는 영향 없음.
 *
 * - 전역 토글(menuSubscriptionEnabled)이 false면 즉시 return.
 * - 메일 미설정(GMAIL_USER/APP_PASSWORD)이면 경고 로그 후 return.
 * - 구독자가 없으면 조용히 return.
 */
export async function notifyMenuUpdate(
  input: NotifyMenuUpdateInput
): Promise<void> {
  try {
    if (!(await getMenuSubscriptionEnabled())) {
      return
    }

    const transporter = getMailTransporter()
    if (!transporter) {
      console.warn(
        '[mail] GMAIL_USER or GMAIL_APP_PASSWORD missing; skip menu subscription notification'
      )
      return
    }

    const gmailUser = process.env.GMAIL_USER
    if (!gmailUser) return

    // 수신자 = 해당 카테고리 구독자
    const subscriptions = await prisma.menuSubscription.findMany({
      where: { categoryId: input.categoryId },
      select: { user: { select: { email: true } } },
    })

    const recipientMap = new Map<string, string>()
    for (const sub of subscriptions) {
      const e = sub.user.email?.trim()
      if (e) recipientMap.set(e.toLowerCase(), e)
    }

    if (recipientMap.size === 0) {
      // 구독자 없음 — 정상 (로그 불필요)
      return
    }

    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { name: true },
    })
    const categoryName = category?.name ?? '메뉴'

    const origin = getSiteOrigin()
    const link = input.postId
      ? `${origin}/${input.slug}/${input.postId}`
      : `${origin}/${input.slug}`

    const actionLabel = ACTION_LABEL[input.action]
    const subject = `[${BRAND_EN}] ${categoryName} 업데이트`

    const text = [
      `안녕하세요. 구독하신 ${categoryName} 메뉴에 콘텐츠가 ${actionLabel}되었습니다.`,
      '',
      `메뉴: ${categoryName}`,
      `제목: ${input.title}`,
      `구분: ${actionLabel}`,
      '',
      `바로 보기: ${link}`,
      '',
      '구독 취소는 해당 메뉴 페이지의 "구독 취소" 버튼으로 언제든 가능합니다.',
      '이 메일은 시스템에서 자동 발송되었습니다.',
    ].join('\n')

    const html = `<p>안녕하세요. 구독하신 <strong>${escapeHtml(categoryName)}</strong> 메뉴에 콘텐츠가 ${escapeHtml(actionLabel)}되었습니다.</p>
<ul>
<li><strong>메뉴</strong>: ${escapeHtml(categoryName)}</li>
<li><strong>제목</strong>: ${escapeHtml(input.title)}</li>
<li><strong>구분</strong>: ${escapeHtml(actionLabel)}</li>
</ul>
<p><a href="${escapeHtml(link)}">${escapeHtml(categoryName)} 바로 보기</a></p>
<br /><br />
<p style="font-size:12px;color:#666">구독 취소는 해당 메뉴 페이지의 "구독 취소" 버튼으로 언제든 가능합니다.<br />
본 메일은 시스템에서 자동 발송되었습니다.<br />
본 메일이 스팸으로 분류될 경우, ${escapeHtml(gmailUser)}을 주소록에 추가하시면 정상 수신됩니다.</p>`

    const from = `"${BRAND_EN}" <${gmailUser}>`
    const mailOptions = {
      from,
      replyTo: gmailUser,
      subject,
      text,
      html,
    }

    await Promise.all(
      [...recipientMap.values()].map(async (to) => {
        try {
          await transporter.sendMail({ ...mailOptions, to })
        } catch (err) {
          console.error('[mail] menu subscription notification failed for', to, err)
        }
      })
    )
  } catch (e) {
    console.error('[mail] notifyMenuUpdate', e)
  }
}
