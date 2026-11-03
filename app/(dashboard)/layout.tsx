import { getCategories, stripHtmlMenuConfig } from '@/lib/categories'
import { MainLayout } from '@/components/category-pages/layout/MainLayout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 클라이언트(사이드바·헤더)로 넘기므로 HTML 메뉴의 Storage 주소는 제거
  const categories = stripHtmlMenuConfig(await getCategories())

  return <MainLayout categories={categories}>{children}</MainLayout>
}
