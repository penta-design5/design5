import { auth } from "./auth"
import { UserRole } from "@prisma/client"
import { UnauthorizedError, ForbiddenError } from "./api/errors"

export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    // UnauthorizedError.message === 'Unauthorized' → 기존 `error.message` 기반 catch와 호환
    throw new UnauthorizedError()
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== UserRole.ADMIN) {
    // ForbiddenError.message === 'Forbidden' → 기존 catch와 호환
    throw new ForbiddenError("관리자 권한이 필요합니다.")
  }
  return user
}

