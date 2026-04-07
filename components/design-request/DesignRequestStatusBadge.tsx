import { DesignRequestStatus } from '@prisma/client'
import { cn } from '@/lib/utils'
import { DESIGN_REQUEST_STATUS_LABEL } from '@/lib/design-request-constants'

const statusBgClass: Record<DesignRequestStatus, string> = {
  REQUESTED: 'bg-penta-yellow/10',
  IN_PROGRESS: 'bg-penta-blue/5',
  COMPLETED: 'bg-primary/50 text-white',
}

interface DesignRequestStatusBadgeProps {
  status: DesignRequestStatus
  className?: string
}

export function DesignRequestStatusBadge({
  status,
  className,
}: DesignRequestStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-transparent px-2 py-0.5 text-xs font-medium',
        status === 'COMPLETED' ? '' : 'text-foreground',
        statusBgClass[status],
        className
      )}
    >
      {DESIGN_REQUEST_STATUS_LABEL[status]}
    </span>
  )
}
