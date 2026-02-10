import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function HomePage() {
  const session = await auth()
  // 관리자는 카테고리 카드가 있는 admin/home으로, 일반 사용자는 Penta Design으로
  if (session?.user?.role === 'ADMIN') {
    redirect('/admin/home')
  }
  redirect('/penta-design')
}
