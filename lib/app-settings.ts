import { prisma } from '@/lib/prisma'

const SETTINGS_ROW_ID = 'default'

export async function getShowCredentialsLogin(): Promise<boolean> {
  const row = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_ROW_ID },
  })
  if (!row) return true
  return row.showCredentialsLogin
}

export async function setShowCredentialsLogin(
  value: boolean
): Promise<void> {
  await prisma.appSettings.upsert({
    where: { id: SETTINGS_ROW_ID },
    create: { id: SETTINGS_ROW_ID, showCredentialsLogin: value },
    update: { showCredentialsLogin: value },
  })
}

/** 메뉴 구독 알림 기능 전역 on/off. 행이 없으면 기본 켜짐(true). */
export async function getMenuSubscriptionEnabled(): Promise<boolean> {
  const row = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_ROW_ID },
  })
  if (!row) return true
  return row.menuSubscriptionEnabled
}

export async function setMenuSubscriptionEnabled(
  value: boolean
): Promise<void> {
  await prisma.appSettings.upsert({
    where: { id: SETTINGS_ROW_ID },
    create: { id: SETTINGS_ROW_ID, menuSubscriptionEnabled: value },
    update: { menuSubscriptionEnabled: value },
  })
}
