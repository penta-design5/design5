# Penta Design System

> v2.0.0 · 2026-07-20 · 웹(UI) + PPT(문서·발표) 공용 스펙
> Figma: https://www.figma.com/design/zIICDqUtkcbUx95w1WalS5

이 문서 하나로 (1) 웹/UI 개발과 (2) PPT 제작을 모두 커버합니다.
**PPT(발표·제안서)를 만들 때는 아래 「PPT 제작 규칙」을 먼저 적용하세요.** 이 규칙을 건너뛰면 글자가 작게 나오고 아이콘이 빠집니다.

---

## ⭐ PPT 제작 규칙 — AI로 슬라이드 만들 때 (필독)

PowerPoint 와이드(16:9) 슬라이드 = **960 × 540 pt** 기준.

### 1) 글자 크기 — 반드시 pt로 (px 아님)

아래 표의 **PPT(pt)** 열을 쓰세요. 웹(px) 숫자를 그대로 pt로 넣으면 회의실·빔프로젝터에서 너무 작습니다.

| 용도 | **PPT (pt)** | 웹 (px, 참고) | Weight |
|---|---|---|---|
| 표지 · 대형 숫자 | **60–80pt** | 56 | Bold 700 |
| 슬라이드 제목 | **36–44pt** | 40 | Bold 700 |
| 소제목 | **24–28pt** | 24 | SemiBold 600 |
| 본문 | **18–24pt** | 16 | Regular 400 |
| 주석 · 출처 | **12–14pt** | 11 | Regular 400 |

- **본문은 18pt 미만으로 내리지 말 것.**
- 폰트: **Pretendard**. 파일 저장 시 「글꼴 포함(Embed fonts)」을 켜면 미설치 PC에서도 안 깨집니다.

### 2) 색 — PowerPoint 테마 12슬롯 매핑

슬라이드 테마 색을 이렇게 지정하면 문서 전체가 브랜드 색으로 통일됩니다.

| PPT 테마 슬롯 | Penta 토큰 | Hex | 용도 |
|---|---|---|---|
| text1 / Dark 1 | Neutral/900 | `#111620` | 기본 텍스트 |
| background1 / Light 1 | Neutral/0 | `#FFFFFF` | 기본 배경 |
| text2 / Dark 2 | Neutral/600 | `#545D70` | 보조 텍스트 |
| background2 / Light 2 | Neutral/50 | `#F7F8FA` | 옅은 배경 |
| accent1 | Primary/500 | `#1E6FFF` | 메인 브랜드 |
| accent2 | Primary/700 | `#124199` | 진한 강조 |
| accent3 | Success/500 | `#22C55E` | 성공·긍정 |
| accent4 | Warning/500 | `#F59E0B` | 주의 |
| accent5 | Error/500 | `#EF4444` | 위험·경고 |
| accent6 | Info/500 | `#3B82F6` | 정보 |
| hyperlink | Primary/500 | `#1E6FFF` | 링크 |
| followedHyperlink | Primary/700 | `#124199` | 방문한 링크 |

### 3) 아이콘 — 펜타 아이콘 라이브러리를 함께 (중요)

AI로 PPT를 만들 때 펜타 아이콘을 주지 않으면, AI가 **엉뚱한 아이콘을 임의로 넣습니다** — 이게 "아이콘이 적용 안 됨"의 원인입니다. 아래 라이브러리를 함께 올리세요.

- 함께 제공되는 **`펜타아이콘-라이브러리.json`** (아이콘 이름 → SVG)을 이 문서와 같이 업로드하세요.
- 지시: **"아이콘은 이 라이브러리에서 해당 이름의 SVG를 그대로 써라. 목록에 없으면 임의로 그리지 말고 비워둬라."**
- 색: SVG 안의 `currentColor`를 밝은 배경 `#111620`, 어두운 배경 `#FFFFFF`로 바꿔 삽입.
- 슬라이드에서 아이콘 크기는 대략 **24–48pt**.
- 아이콘 목록·미리보기: 사내 디자인 아카이브의 *Penta Design System* 페이지 → **PPT 탭**.

---

## 1. 컬러 (Color)

### Primary — Penta Blue
| Token | Hex | 용도 |
|---|---|---|
| Primary/50 | `#EBF2FF` | 배경 강조 |
| Primary/100 | `#C2D9FF` | hover 배경 |
| Primary/500 | `#1E6FFF` | **메인 브랜드 컬러** |
| Primary/600 | `#1858CC` | hover 상태 |
| Primary/700 | `#124199` | active / pressed |
| Primary/900 | `#061433` | 다크 배경 |

### Neutral — Gray
| Token | Hex | 용도 |
|---|---|---|
| Neutral/0 | `#FFFFFF` | 기본 배경 |
| Neutral/50 | `#F7F8FA` | 서브 배경 |
| Neutral/100 | `#ECEEF2` | 구분선 배경 |
| Neutral/200 | `#D9DCE3` | Border |
| Neutral/400 | `#9AA1B0` | 비활성 텍스트 |
| Neutral/600 | `#545D70` | 보조 텍스트 |
| Neutral/900 | `#111620` | 기본 텍스트 |

### Semantic
| Token | 500 | 700 |
|---|---|---|
| Success | `#22C55E` | `#15803D` |
| Warning | `#F59E0B` | `#B45309` |
| Error | `#EF4444` | `#B91C1C` |
| Info | `#3B82F6` | `#1D4ED8` |

---

## 2. 타이포그래피 (Typography)

**Font Family:** Pretendard (한글/영문 공통)

### 웹/화면용 스케일 (px) — PPT는 위 「PPT 제작 규칙」 참조

| Token | Size | Line Height | Weight |
|---|---|---|---|
| Display | 56px | 64px | Bold 700 |
| Heading 1 | 40px | 48px | Bold 700 |
| Heading 2 | 32px | 40px | Bold 700 |
| Heading 3 | 24px | 32px | SemiBold 600 |
| Body Large | 18px | 28px | Regular 400 |
| Body | 16px | 24px | Regular 400 |
| Body Small | 14px | 20px | Regular 400 |
| Label | 12px | 16px | Medium 500 |
| Caption | 11px | 16px | Regular 400 |

---

## 3. 스페이싱 (Spacing)

8pt 그리드: 2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 (px)

## 4. 보더 반경 (Radius)

| Token | Value | 용도 |
|---|---|---|
| sm | 4px | 태그·칩 |
| md | 8px | 버튼·입력창 |
| lg | 12px | 카드 |
| xl | 16px | 모달·패널 |
| full | 9999px | 배지·아바타 |

## 5. 그림자 (Elevation)

| Level | CSS | 용도 |
|---|---|---|
| sm | `0 1px 3px rgba(0,0,0,.08)` | 드롭다운 |
| md | `0 4px 16px rgba(0,0,0,.06)` | 카드 |
| lg | `0 8px 32px rgba(0,0,0,.10)` | 모달 |
| xl | `0 16px 48px rgba(0,0,0,.14)` | 사이드패널 |

---

## 6. 컴포넌트 (Components)

### Button
| Variant | Background | Text | Border |
|---|---|---|---|
| Primary | Primary/500 | #FFF | – |
| Secondary | #FFF | Primary/500 | Primary/500 |
| Danger | Error/500 | #FFF | – |
| Ghost | Neutral/50 | Neutral/700 | Neutral/200 |
- Height 44(MD)/36(SM)/52(LG) · Padding 16 · Radius 8 · Font Body Small SemiBold

### Status Badge
| Variant | BG | Text |
|---|---|---|
| Success | Success/50 | Success/700 |
| Warning | Warning/50 | Warning/700 |
| Error | Error/50 | Error/700 |
| Info | Info/50 | Info/700 |
- Height 28 · Padding 8 · Radius full · Font Label SemiBold

### Input
- Height 44 · Padding 12 · Radius md · Border Neutral/200 (focus Primary/500)

### Card
- BG Neutral/0 · Border 1px Neutral/100 · Radius 12 · Shadow md · Padding 20

---

## 7. 아이콘 (Icons)

383개 · 14개 카테고리 · 24px · 1px stroke. `icon/<이름>` 네이밍.
AI로 PPT 제작 시 `펜타아이콘-라이브러리.json`을 함께 업로드(위 「PPT 제작 규칙 3」). 미리보기·검색은 사내 아카이브의 *Penta Design System* 페이지에서.
