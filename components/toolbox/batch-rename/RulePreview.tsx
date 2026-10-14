'use client'

export interface RulePreviewProps {
  /** 바뀔 이름 예시(첫 파일 ~ 마지막 파일). 파일이 없거나 규칙 오류면 null */
  example: { first: string; last: string | null } | null
  hasErrors: boolean
  /** 자릿수를 넘는 첫 번호(없으면 null) */
  overflowFrom: number | null
}

/** 바뀔 이름 예시 + 자릿수 초과 경고. 우측 패널과 1280px 미만 본문 카드가 함께 쓴다 */
export function RulePreview({ example, hasErrors, overflowFrom }: RulePreviewProps) {
  return (
    <>
      {example ? (
        <p className="break-all text-sm text-[var(--penta-indigo)]">
          {example.first}
          {example.last && (
            <>
              <span className="text-muted-foreground"> ~ </span>
              {example.last}
            </>
          )}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {hasErrors ? '시작 번호·자릿수를 확인하세요.' : '파일을 추가하면 바뀔 이름을 미리 볼 수 있습니다.'}
        </p>
      )}
      {overflowFrom !== null && (
        <p className="text-xs text-amber-700">
          {overflowFrom.toLocaleString('ko-KR')}번부터는 번호가 자릿수보다 길어집니다. 이름순으로 정렬했을 때 순서가 어긋날 수 있으니 자릿수를 늘려 보세요.
        </p>
      )}
    </>
  )
}
