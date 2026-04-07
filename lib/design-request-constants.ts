import { DesignRequestStatus } from '@prisma/client'

export const DESIGN_REQUEST_STATUS_LABEL: Record<DesignRequestStatus, string> = {
  REQUESTED: '요청',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
}

export const DESIGN_REQUEST_STATUS_OPTIONS: { value: DesignRequestStatus; label: string }[] = [
  { value: 'REQUESTED', label: '요청' },
  { value: 'IN_PROGRESS', label: '진행중' },
  { value: 'COMPLETED', label: '완료' },
]
