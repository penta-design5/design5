/**
 * eDM 사용 가이드 정적 콘텐츠.
 * 이미지 파일: public/edm-guide/step1.jpg ~ step7.jpg
 */

export interface EdmGuideStep {
  title: string
  body: string
  image: string
}

export const EDM_GUIDE_STEPS: EdmGuideStep[] = [
  {
    title: '1. eDM 목록에서 추가',
    body: 'eDM Code Generator 목록 페이지에서 "eDM 추가" 버튼을 클릭하면 새 eDM 에디터로 이동합니다.',
    image: '/edm-guide/step1.jpg',
  },
  {
    title: '2. 이미지 업로드',
    body: '에디터 왼쪽 영역에서 배경으로 사용할 이미지를 업로드합니다. 드래그 앤 드롭 또는 클릭하여 파일을 선택할 수 있습니다.',
    image: '/edm-guide/step2.jpg',
  },
  {
    title: '3. 그리드로 셀 나누기',
    body: '상단 컨트롤에서 행/열 개수를 지정하여 이미지를 그리드로 나눕니다. 셀을 드래그하여 선택한 뒤 "셀 병합"으로 영역을 결합할 수 있습니다.',
    image: '/edm-guide/step3.jpg',
  },
  {
    title: '4. 링크 추가',
    body: '셀을 클릭하면 링크 설정 필드가 열립니다. 각 셀에 연결될 URL을 입력하여 추가하면 추후 생성되는 HTML 코드에 반영됩니다.',
    image: '/edm-guide/step4.jpg',
  },
  {
    title: '5. HTML 코드 저장',
    body: '셀 편집과 링크 설정 완료 후 우측 상단 "저장" 버튼을 누르면 하단 HTML 코드 영역에 코드가 생성됩니다.',
    image: '/edm-guide/step5.jpg',
  },  
  {
    title: '6. eDM 미리보기',
    body: '미리보기 버튼을 누르면 생성될 HTML이 메일/웹에서 어떻게 보이는지 확인할 수 있습니다. 좌측/중앙/우측 정렬과 링크 동작도 확인해 보세요.',
    image: '/edm-guide/step6.jpg',
  },
  {
    title: '7. HTML 코드 복사',
    body: '하단 HTML 코드 영역에서 생성된 HTML을 확인하고 "Code 복사" 버튼으로 클립보드에 복사한 뒤, 메일 발송 도구나 CMS 등에 붙여 넣어 사용합니다.',
    image: '/edm-guide/step7.jpg',
  },
]
