import { redirect } from 'next/navigation'
import { TOOLBOX_MENU, toolboxPath } from '@/lib/toolbox/menu'

/** `/toolbox` 인덱스는 첫 번째 도구로 이동 */
export default function ToolboxIndexPage() {
  redirect(`/${toolboxPath(TOOLBOX_MENU[0].slug)}`)
}
