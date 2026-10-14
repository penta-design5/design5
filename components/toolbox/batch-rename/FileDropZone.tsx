'use client'

import { ClipboardPaste, FilePlus2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LIMIT_LABEL } from '@/lib/toolbox/batch-rename/list'

interface FileDropZoneProps {
  dragActive: boolean
  onBrowse: () => void
  onPaste: () => void
  className?: string
}

/** 파일이 없을 때의 업로드 영역 + 사용 안내. 끌어다 놓기 처리는 페이지(작업 영역 전체)가 담당 */
export function FileDropZone({ dragActive, onBrowse, onPaste, className }: FileDropZoneProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <button
        type="button"
        data-drop-zone
        onClick={onBrowse}
        className={cn(
          'flex min-h-[240px] w-full flex-1 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-card p-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          dragActive
            ? 'border-[var(--penta-indigo)] bg-[rgb(var(--penta-indigo-rgb)/0.05)]'
            : 'border-border hover:border-[rgb(var(--penta-indigo-rgb)/0.6)]'
        )}
      >
        <FilePlus2 className="h-10 w-10 text-muted-foreground" />
        <p className="text-base font-medium">{dragActive ? '여기에 파일을 놓으세요' : '클릭하거나 파일을 끌어다 놓으세요'}</p>
        <p className="text-sm text-muted-foreground">여러 파일을 한 번에 추가할 수 있고, 계속 추가하면 목록 뒤에 붙습니다.</p>
        <p className="text-sm text-muted-foreground">캡처(Win + Shift + S)한 이미지는 Ctrl/⌘ + V로 붙여넣을 수 있습니다.</p>
        <p className="text-xs text-muted-foreground">모든 형식 · {LIMIT_LABEL}</p>
      </button>
      <div className="-mt-3 flex justify-center">
        <Button type="button" variant="outline" size="sm" onClick={onPaste}>
          <ClipboardPaste className="mr-1.5 h-4 w-4" />
          캡처 붙여넣기
        </Button>
      </div>

      <section aria-labelledby="batch-rename-howto" className="space-y-2">
        <h2 id="batch-rename-howto" className="text-base font-semibold">
          이렇게 사용하세요
        </h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>파일을 끌어다 놓거나 「파일 추가」로 추가하고, 캡처한 이미지는 Ctrl/⌘ + V로 붙여넣으세요. 계속 추가할 수 있습니다.</li>
          <li>공통 이름·시작 번호·번호 자릿수와 순서를 정하세요.</li>
          <li>바뀔 이름을 확인하고 ZIP으로 내려받으세요.</li>
        </ol>
        <p className="text-xs text-muted-foreground">
          파일은 서버로 전송되지 않습니다. 브라우저는 내 PC에 있는 파일의 이름을 직접 바꿀 수 없어, 새 이름으로 묶은 ZIP을 내려받는 방식입니다.
        </p>
      </section>
    </div>
  )
}
