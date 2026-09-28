import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

/** TOOLBOX 전체(`/toolbox/*`)는 로그인 사용자만 접근 — eDM과 동일한 서버 세션 가드 */
export default async function ToolboxLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return <>{children}</>
}
