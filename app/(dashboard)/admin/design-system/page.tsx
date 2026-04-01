'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { AlertCircle, XCircle, Search } from 'lucide-react'
import { canAccessDesignSystem } from '@/lib/design-system-access'

export default function DesignSystemPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || !canAccessDesignSystem(session.user.email)) {
      router.replace('/admin/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading' || !session?.user || !canAccessDesignSystem(session.user.email)) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">확인 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-10">
      <div>
        <h1 className="page-header-title">디자인 시스템</h1>
        <p className="text-muted-foreground mt-2">
          Desing5에서 사용하는 색상, 타이포그래피, 간격 등 디자인 가이드 및 기본 UI 컴포넌트에 대한 사용 규칙입니다.
        </p>
      </div>

      {/* 1. 스타일 가이드 - 색상 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">1. 스타일 가이드</h2>

        <Card>
          <CardHeader>
            <CardTitle>색상 팔레트</CardTitle>
            <CardDescription>
              globals.css에 정의된 CSS 변수 및 Penta 브랜드 색상
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium mb-2">시맨틱 색상</p>
              <div className="flex flex-wrap gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-lg bg-primary" />
                  <p className="text-xs mt-1">primary</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-lg bg-secondary" />
                  <p className="text-xs mt-1">secondary</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-lg bg-destructive" />
                  <p className="text-xs mt-1">destructive</p>
                </div>
                {/* <div className="text-center">
                  <div className="w-16 h-16 rounded-lg bg-muted" />
                  <p className="text-xs mt-1">muted</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-lg bg-accent" />
                  <p className="text-xs mt-1">accent</p>
                </div> */}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Penta 브랜드</p>
              <div className="flex flex-wrap gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-lg bg-penta-indigo" />
                  <p className="text-xs mt-1">penta-indigo</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-lg bg-penta-blue" />
                  <p className="text-xs mt-1">penta-blue</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-lg bg-penta-sky" />
                  <p className="text-xs mt-1">penta-sky</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-lg bg-penta-green" />
                  <p className="text-xs mt-1">penta-green</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-lg bg-penta-yellow" />
                  <p className="text-xs mt-1">penta-yellow</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>타이포그래피</CardTitle>
            <CardDescription>Pretendard 폰트, 제목·본문·캡션 스타일</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                page-header-title (모바일: app-page-title / md: app-page-title-md)
              </p>
              <p className="page-header-title">페이지 제목 예시</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">text-2xl font-semibold (섹션 제목)</p>
              <p className="text-2xl font-semibold">섹션 제목 예시</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">text-base (본문)</p>
              <p className="text-base">본문 텍스트입니다. 가독성을 위해 적절한 행간과 크기를 사용합니다.</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">text-sm text-muted-foreground (캡션/보조)</p>
              <p className="text-sm text-muted-foreground">캡션 또는 보조 설명 텍스트</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>간격 및 Radius</CardTitle>
            <CardDescription>Tailwind spacing, --radius (0.5rem)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="p-2 bg-muted rounded-md border">p-2</div>
              <div className="p-4 bg-muted rounded-md border">p-4</div>
              <div className="p-6 bg-muted rounded-md border">p-6</div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="w-20 h-20 rounded-md bg-muted border" title="rounded-md (--radius)" />
              <div className="w-20 h-20 rounded-lg bg-muted border" title="rounded-lg" />
              <div className="w-20 h-20 rounded-full bg-muted border" title="rounded-full" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 2. 컴포넌트 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">2. 컴포넌트</h2>

        {/* Button */}
        <Card>
          <CardHeader>
            <CardTitle>Button</CardTitle>
            <CardDescription>
              주요 액션, 폼 제출, 네비게이션 등에 사용. variant와 size로 스타일을 선택합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium mb-2">Variant</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Size</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">
                  <Search className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Do</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>주요 액션에는 default, 위험 액션에는 destructive 사용</li>
                <li>한 행에 여러 버튼일 때 우선순위에 따라 variant 구분</li>
                <li>비활성화 시 disabled 속성 사용</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Don&apos;t</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>한 화면에 destructive 버튼을 과도하게 사용하지 않기</li>
                <li>link variant를 일반 텍스트 링크 대신 남용하지 않기</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">접근성</p>
              <p className="text-sm text-muted-foreground">
                focus-visible 링크 스타일 적용됨. 버튼에는 명확한 라벨을 넣고, 아이콘만 있을 경우 aria-label을 지정하세요.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>
              폼 필드, 검색창 등 사용자 입력에 사용. Label과 함께 사용하는 것을 권장합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 max-w-sm">
              <div className="grid gap-2">
                <Label htmlFor="sample-default">기본</Label>
                <Input id="sample-default" placeholder="placeholder 텍스트" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sample-disabled">Disabled</Label>
                <Input id="sample-disabled" placeholder="비활성" disabled />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Do</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Label과 id로 연결하여 접근성 확보</li>
                <li>필수 입력은 placeholder 또는 Label로 안내</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Don&apos;t</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Label 없이 Input만 두지 않기</li>
                <li>에러 메시지는 Input 근처에 표시</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">접근성</p>
              <p className="text-sm text-muted-foreground">
                focus-visible 링크 스타일 적용. Label의 htmlFor와 Input의 id를 일치시키세요.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card */}
        <Card>
          <CardHeader>
            <CardTitle>Card</CardTitle>
            <CardDescription>
              콘텐츠 그룹, 대시보드 타일, 목록 아이템 등에 사용. CardHeader, CardTitle, CardDescription, CardContent로 구성합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Card className="max-w-sm">
              <CardHeader>
                <CardTitle>카드 제목</CardTitle>
                <CardDescription>카드에 대한 짧은 설명을 넣을 수 있습니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">카드 본문 영역입니다.</p>
              </CardContent>
            </Card>
            <div>
              <p className="text-sm font-medium mb-2">Do</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>관련 정보를 하나의 카드로 묶기</li>
                <li>제목은 CardTitle, 보조 문구는 CardDescription 사용</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Don&apos;t</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>한 카드에 과도한 정보를 넣지 않기</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Badge */}
        <Card>
          <CardHeader>
            <CardTitle>Badge</CardTitle>
            <CardDescription>
              상태, 카테고리, 카운트 등 짧은 라벨 표시에 사용합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Do</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>짧은 텍스트(상태, 태그)에만 사용</li>
                <li>destructive는 경고·삭제 등 부정적 의미에 사용</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Don&apos;t</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>긴 문장이나 버튼 대신 사용하지 않기</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Alert */}
        <Card>
          <CardHeader>
            <CardTitle>Alert</CardTitle>
            <CardDescription>
              사용자에게 알림, 경고, 에러 등 중요한 메시지를 전달할 때 사용합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 max-w-xl">
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>기본 알림</AlertTitle>
                <AlertDescription>일반적인 안내 메시지입니다.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>오류</AlertTitle>
                <AlertDescription>오류가 발생했을 때 이 variant를 사용합니다.</AlertDescription>
              </Alert>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Do</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>AlertTitle과 AlertDescription으로 제목·본문 구분</li>
                <li>destructive는 실제 오류·위험 상황에만 사용</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Don&apos;t</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>일반 안내에 destructive 사용하지 않기</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">접근성</p>
              <p className="text-sm text-muted-foreground">
                {'role="alert"'}로 스크린 리더에 알림이 전달됩니다. 중요한 메시지는 페이지 상단 근처에 배치하세요.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ! 참고: 페이지 접근권한 사용자 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Page Access Permission</CardTitle>
            <CardDescription>
              현재 tiper 사용자에게만 이 페이지 접근권한이 설정되어 있습니다. 프로젝트 &gt; lib &gt; <span className='text-penta-blue'>design-system-access.ts</span> 파일에서 사용자 email을 추가 및 삭제하여 &quot;디자인 시스템&quot; 페이지 접근권한 설정을 할 수 있습니다.
            </CardDescription>
          </CardHeader>
        </Card>        
      </section>
    </div>
  )
}
