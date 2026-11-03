import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { RESERVED_MENU_SLUGS } from '@/lib/menus/reserved-slugs'

const root = process.cwd()

/** 디렉터리 안의 라우트 세그먼트 폴더 (라우트 그룹 `(x)`·private `_x`·동적 `[x]` 제외) */
function routeSegments(dir: string): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !/^[([_]/.test(name))
}

function folders(dir: string): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
}

describe('RESERVED_MENU_SLUGS', () => {
  it.each([
    ['app', routeSegments('app')],
    ['app/(auth)', routeSegments('app/(auth)')],
    ['app/(dashboard)', routeSegments('app/(dashboard)')],
    ['public', folders('public')],
  ])('%s 최상위 경로를 모두 포함한다', (_dir, names) => {
    const missing = names.filter((name) => !RESERVED_MENU_SLUGS.has(name))
    expect(missing).toEqual([])
  })
})
