# Penta Design System

> v1.0.0 · 2026-06-12  
> Figma: https://www.figma.com/design/FgVjdOtgDeS0cXjH7v4sL6

---

## 1. 개요

Penta Security 제품군의 UI 일관성을 유지하기 위한 디자인 시스템입니다.  
컬러, 타이포그래피, 스페이싱, 컴포넌트 토큰을 정의합니다.

---

## 2. 컬러 (Color)

### Primary – Penta Blue

| Token        | Hex       | 용도 |
|-------------|-----------|------|
| Primary/50  | `#EBF2FF` | 배경 강조 (subtle) |
| Primary/100 | `#C2D9FF` | hover 배경 |
| Primary/200 | `#99BFFF` | - |
| Primary/300 | `#70A5FF` | - |
| Primary/400 | `#478BFF` | - |
| **Primary/500** | **`#1E6FFF`** | **메인 브랜드 컬러** |
| Primary/600 | `#1858CC` | hover 상태 |
| Primary/700 | `#124199` | active / pressed |
| Primary/800 | `#0C2B66` | - |
| Primary/900 | `#061433` | 다크 배경 |

### Neutral – Gray

| Token        | Hex       | 용도 |
|-------------|-----------|------|
| Neutral/0   | `#FFFFFF` | 기본 배경 |
| Neutral/50  | `#F7F8FA` | 서브 배경 |
| Neutral/100 | `#ECEEF2` | 구분선 배경 |
| Neutral/200 | `#D9DCE3` | Border Default |
| Neutral/300 | `#BFC4CF` | - |
| Neutral/400 | `#9AA1B0` | 비활성 텍스트 |
| Neutral/500 | `#747E93` | Secondary Text |
| Neutral/600 | `#545D70` | Body Text (Secondary) |
| Neutral/700 | `#3A4253` | - |
| Neutral/800 | `#242B38` | Heading |
| Neutral/900 | `#111620` | Default Text |

### Semantic Colors

| Token         | 50        | 500       | 700       |
|--------------|-----------|-----------|-----------|
| Success      | `#ECFDF5` | `#22C55E` | `#15803D` |
| Warning      | `#FFFBEB` | `#F59E0B` | `#B45309` |
| Error        | `#FEF2F2` | `#EF4444` | `#B91C1C` |
| Info         | `#EFF6FF` | `#3B82F6` | `#1D4ED8` |

### Semantic Alias Tokens

| Token                      | References        | 용도 |
|---------------------------|-------------------|------|
| `color/brand/primary`     | Primary/500       | 주요 액션 |
| `color/brand/primary-hover` | Primary/600     | 호버 |
| `color/brand/primary-subtle` | Primary/50     | 강조 배경 |
| `color/text/default`      | Neutral/900       | 기본 텍스트 |
| `color/text/secondary`    | Neutral/600       | 서브 텍스트 |
| `color/text/disabled`     | Neutral/400       | 비활성 |
| `color/text/inverse`      | Neutral/0         | 다크 배경 위 텍스트 |
| `color/text/brand`        | Primary/500       | 브랜드 컬러 텍스트 |
| `color/bg/default`        | Neutral/0         | 기본 배경 |
| `color/bg/subtle`         | Neutral/50        | 카드 배경 등 |
| `color/bg/muted`          | Neutral/100       | 입력란 배경 |
| `color/border/default`    | Neutral/200       | 기본 보더 |
| `color/border/strong`     | Neutral/400       | 강조 보더 |
| `color/status/success`    | Success/500       | - |
| `color/status/warning`    | Warning/500       | - |
| `color/status/error`      | Error/500         | - |
| `color/status/info`       | Info/500          | - |

---

## 3. 타이포그래피 (Typography)

**Font Family:** Pretendard (한글/영문 공통)  
- 설치: [naver.github.io/fe-developers/…/pretendard](https://naver.github.io/fe-developers/coding-convention/font/pretendard) 또는 [Google Fonts](https://fonts.google.com/specimen/Pretendard)

### Type Scale

| Token       | Size | Line Height | Weight    | Letter Spacing |
|------------|------|-------------|-----------|----------------|
| Display    | 56px | 64px        | Bold 700  | -1.5px |
| Heading 1  | 40px | 48px        | Bold 700  | -0.5px |
| Heading 2  | 32px | 40px        | Bold 700  | -0.25px |
| Heading 3  | 24px | 32px        | SemiBold 600 | 0 |
| Heading 4  | 20px | 28px        | SemiBold 600 | 0 |
| Body Large | 18px | 28px        | Regular 400 | 0 |
| Body       | 16px | 24px        | Regular 400 | 0 |
| Body Small | 14px | 20px        | Regular 400 | 0 |
| Label      | 12px | 16px        | Medium 500 | +0.25px |
| Caption    | 11px | 16px        | Regular 400 | +0.4px |

---

## 4. 스페이싱 (Spacing)

8pt 그리드 기반. 주요 스케일:

| Token       | Value | 
|------------|-------|
| spacing/1  | 2px   |
| spacing/2  | 4px   |
| spacing/3  | 6px   |
| spacing/4  | 8px   |
| spacing/5  | 12px  |
| spacing/6  | 16px  |
| spacing/7  | 20px  |
| spacing/8  | 24px  |
| spacing/9  | 32px  |
| spacing/10 | 40px  |
| spacing/11 | 48px  |
| spacing/12 | 64px  |

---

## 5. 보더 반경 (Border Radius)

| Token       | Value   | 용도 |
|------------|---------|------|
| radius/none | 0px   | 테이블, 풀-블리드 |
| radius/sm   | 4px   | 태그, 작은 칩 |
| radius/md   | 8px   | 버튼, 입력창 |
| radius/lg   | 12px  | 카드 |
| radius/xl   | 16px  | 모달, 패널 |
| radius/full | 9999px | 배지, 아바타 |

---

## 6. 그림자 (Shadow / Elevation)

| Level | CSS                                      | 용도 |
|-------|------------------------------------------|------|
| sm    | `0 1px 3px rgba(0,0,0,0.08)`            | 드롭다운 |
| md    | `0 4px 16px rgba(0,0,0,0.06)`           | 카드 |
| lg    | `0 8px 32px rgba(0,0,0,0.10)`           | 모달 |
| xl    | `0 16px 48px rgba(0,0,0,0.14)`          | 사이드패널 |

---

## 7. 컴포넌트 (Components)

### Button

| Variant   | Background  | Text Color  | Border       |
|----------|-------------|-------------|--------------|
| Primary  | Primary/500 | Neutral/0   | -            |
| Secondary | Neutral/0  | Primary/500 | Primary/500  |
| Danger   | Error/500   | Neutral/0   | -            |
| Ghost    | Neutral/50  | Neutral/700 | Neutral/200  |
| Disabled | Neutral/100 | Neutral/400 | -            |

- Height: 44px (MD), 36px (SM), 52px (LG)
- Padding: 16px horizontal
- Border Radius: `radius/md` (8px)
- Font: Body Small, SemiBold

### Status Badge

| Variant | Background   | Text Color   |
|---------|-------------|-------------|
| Success | Success/50  | Success/700 |
| Warning | Warning/50  | Warning/700 |
| Error   | Error/50    | Error/700   |
| Info    | Info/50     | Info/700    |
| Neutral | Neutral/50  | Neutral/600 |

- Height: 28px
- Padding: 8px horizontal
- Border Radius: `radius/full`
- Font: Label, SemiBold

### Input Field

| State    | Background  | Border       |
|---------|-------------|-------------|
| Default  | Neutral/0   | Neutral/200 |
| Focused  | Neutral/0   | Primary/500 |
| Error    | Error/50    | Error/500   |
| Disabled | Neutral/50  | Neutral/100 |

- Height: 44px
- Padding: 12px horizontal
- Border Radius: `radius/md`
- Font: Body Small, Regular

### Card

- Background: Neutral/0
- Border: 1px solid Neutral/100
- Border Radius: `radius/lg` (12px)
- Shadow: `md`
- Padding: 20px

---

## 8. TODO / 수정 예정

- [ ] 다크 모드 컬러 토큰 추가
- [ ] 아이콘 시스템 연결
- [ ] Motion / Animation 가이드
- [ ] 컴포넌트 상태 (hover, focus, pressed) 상세 정의
- [ ] 접근성 (WCAG AA) 컨트라스트 검증
