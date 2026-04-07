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
