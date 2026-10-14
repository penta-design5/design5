/**
 * 끌어다 놓은 항목에서 파일만 꺼낸다. 폴더는 건너뛰고 개수만 센다(D3 — 폴더 추가는 MVP 제외).
 * `webkitGetAsEntry`가 없는 브라우저는 `files`를 그대로 쓴다(폴더 판별 불가).
 */
export function filesFromDataTransfer(data: DataTransfer | null): { files: File[]; folders: number } {
  if (!data) return { files: [], folders: 0 }
  const items = Array.from(data.items ?? []).filter((item) => item.kind === 'file')
  if (items.length === 0 || typeof items[0].webkitGetAsEntry !== 'function') {
    return { files: Array.from(data.files ?? []), folders: 0 }
  }
  const files: File[] = []
  let folders = 0
  for (const item of items) {
    // getAsFile·webkitGetAsEntry는 drop 이벤트 안에서 동기로 호출해야 한다
    if (item.webkitGetAsEntry()?.isDirectory) {
      folders++
      continue
    }
    const file = item.getAsFile()
    if (file) files.push(file)
  }
  return { files, folders }
}
