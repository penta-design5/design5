/** 목록의 파일 한 개. `file`은 디스크를 참조하므로 목록에 담는 것만으로는 내용을 메모리에 올리지 않는다. */
export interface RenameItem {
  id: string
  file: File
  /** 원본 파일명(붙여넣은 캡처는 P4에서 만든 이름) */
  originalName: string
  size: number
}
