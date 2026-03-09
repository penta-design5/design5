# layerary.com SEO 최적화 구현 계획

## 목표

- 구글 등 검색엔진이 layerary.com을 수집·노출하기 쉽게 하기
- 공유 시 제목·설명·이미지가 안정적으로 표시되도록 하기
- 크롤링은 허용하되, 관리자/인증/API 경로는 Disallow로 검색 노출 최소화

## 현재 상태

- [app/layout.tsx](../app/layout.tsx): `title`, `description`, `icons`만 설정됨. `metadataBase`, `openGraph` 없음.
- sitemap.xml, robots.txt 미구현.
- 공개 URL 구조: `/`(대시보드 홈), `/[slug]`(카테고리 목록), `/[slug]/[id]`(상세). 인증/관리자: `/login`, `/register`, `/error`, `/admin/*`, `/profile`, `/diagram/editor`, `/edm/editor` 등.

---

## 1. 기준 URL 통일

- **선택지**
  - **A)** 환경 변수 `NEXT_PUBLIC_APP_URL` 사용 (이미 [env.example.txt](../env.example.txt)에 정의됨). 로컬은 localhost, Vercel은 `https://layerary.com` 설정.
  - **B)** 코드 상수로 `https://layerary.com` 고정.
- **권장:** A. 배포 URL이 바뀌어도 재배포 없이 환경 변수만 변경 가능.
- sitemap/robots/메타데이터의 절대 URL은 모두 이 기준 URL을 사용.

---

## 2. 메타데이터 보강 (app/layout.tsx)

**파일:** [app/layout.tsx](../app/layout.tsx)

**추가할 내용:**

- **metadataBase**  
  `NEXT_PUBLIC_APP_URL`이 있으면 `new URL(process.env.NEXT_PUBLIC_APP_URL)`, **반드시 없을 때 fallback** `new URL('https://layerary.com')` 사용. (로컬 빌드 시 env 미설정 대비)
- **openGraph**  
  - `title`: 현재와 동일 (또는 "LAYERARY | 펜타시큐리티 디자인 플랫폼" 등).
  - `description`: 현재 description과 동일.
  - `url`: 기준 URL (metadataBase와 동일).
  - `siteName`: `"LAYERARY"`.
  - `locale`: `"ko_KR"`.
  - `type`: `"website"`.
  - **images**: `public/img/og-default.png` 파일이 있을 때만 지정. 없으면 생략(미설정 권장).
- **twitter** (선택)  
  `card: 'summary_large_image'`, `title`, `description` 정도만 넣어도 됨.
- 기존 `title`, `description`, `icons` 유지.

**주의:** `NEXT_PUBLIC_*`는 빌드 시점에만 주입되므로, Vercel 환경 변수에 `NEXT_PUBLIC_APP_URL=https://layerary.com` 설정 필요.

---

## 3. Sitemap 생성 (app/sitemap.ts)

**파일:** 신규 `app/sitemap.ts`

- Next.js 14 규칙에 따라 `MetadataRoute.Sitemap`를 반환하는 default export.
- **기준 URL:** 위와 동일하게 `NEXT_PUBLIC_APP_URL` 또는 `https://layerary.com`.

**포함할 URL (권장):**

| 경로 | 출처 | 비고 |
|------|------|------|
| `/` | 고정 | 대시보드 홈 |
| `/[slug]` | DB 카테고리 | [lib/categories.ts](../lib/categories.ts)의 `getCategories()`로 최상위 + 자식 카테고리 slug 수집. 각 slug에 대해 `/${slug}` 1건. |
| (선택) `/[slug]/[id]` | DB 게시물 | 상세 페이지 수가 많으면 최근 N건 또는 제외. 초기에는 카테고리 페이지만으로도 가능. |

**구현 포인트:**

- `getCategories()`는 `unstable_cache` 사용. sitemap.ts는 서버에서 실행되므로 Prisma/캐시 사용 가능.
- slug 수집 시 **안전 접근**: 최상위 `slug` + 자식은 `c.children?.map(ch => ch.slug) ?? []`로 flatten. (children 없을 수 있으므로 optional chaining·빈 배열 fallback)
- 최상위 및 자식 카테고리의 `slug`를 순회하여 `url`, `lastModified`(예: `new Date()` 또는 카테고리 `updatedAt`), `changeFrequency`(예: `'weekly'`), `priority`(홈 1.0, 카테고리 0.8 등) 설정.
- 상세 `/[slug]/[id]`를 넣을 경우: Prisma로 Post(또는 해당 리소스) 목록 조회, slug+id 조합해 URL 생성. 50,000건 제한 등 sitemap 규격 고려.

**반환 예시:**

```ts
return [
  { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
  ...categorySlugs.map(slug => ({ url: `${baseUrl}/${slug}`, lastModified: ..., changeFrequency: 'weekly', priority: 0.8 })),
]
```

---

## 4. Robots.txt 동적 생성 (app/robots.ts)

**파일:** 신규 `app/robots.ts`

- Next.js 14 규칙에 따라 `MetadataRoute.Robots`를 반환하는 default export.

**규칙 제안:**

- Next.js `MetadataRoute.Robots` 형식: `rules`는 **배열**로 전달 (예: `rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', ...] }]`). `disallow`는 문자열 배열.
- **User-agent:** `*`
- **Allow:** `/`
- **Disallow:**  
  `/admin`, `/api`, `/login`, `/register`, `/error`, `/profile`, `/diagram/editor`, `/edm/editor`
  - 필요 시 `/chart-generator`, `/pdf-extractor`는 허용(공개 도구로 둘 경우). 관리자 전용/편집기만 확실히 막으면 됨.
- **Sitemap:** `{기준URL}/sitemap.xml` (예: `https://layerary.com/sitemap.xml`).

**기준 URL:** `NEXT_PUBLIC_APP_URL` 또는 fallback `https://layerary.com` (sitemap과 동일).

---

## 5. 배포·검색엔진 측 작업 (구현 외)

- **Google Search Console**  
  - 속성 추가: `https://layerary.com`  
  - URL 검사로 홈 페이지 수집 요청  
  - Sitemap 제출: `https://layerary.com/sitemap.xml`
- **Vercel 환경 변수**  
  - `NEXT_PUBLIC_APP_URL=https://layerary.com` 확인 (이미 적용되어 있다고 가정).

---

## 6. 작업 순서 요약

1. **app/layout.tsx**  
   metadataBase, openGraph(및 선택적으로 twitter) 추가. 기존 title/description/icons 유지.
2. **app/robots.ts**  
   신규 생성. Allow/Disallow/Sitemap, 기준 URL 적용.
3. **app/sitemap.ts**  
   신규 생성. getCategories()로 slug 수집 후 카테고리 URL + 홈 URL 반환. (선택) 상세 페이지 URL 추가.
4. 로컬에서 `npm run build` 후 `/sitemap.xml`, `/robots.txt` 응답 확인.
5. Search Console에서 sitemap 제출 및 수집 요청.

---

## 7. 구현 시 권장 사항 (체크리스트)

- **metadataBase**: env 없을 때 반드시 `https://layerary.com` fallback 사용.
- **sitemap slug 수집**: `getCategories()` 결과에 `?.children`, `?? []`로 안전 접근.
- **openGraph.images**: 파일 추가 시에만 설정, 없으면 생략.
- **robots rules**: `MetadataRoute.Robots` 타입에 맞게 `rules` 배열, `disallow` 문자열 배열 사용.
- **배포 후 확인**: `https://layerary.com/sitemap.xml`, `https://layerary.com/robots.txt` 직접 호출해 200 및 내용 확인.

---

## 8. 주의사항

- **robots.txt는 "요청"**일 뿐이라, 크롤러가 따르지 않을 수 있음. 민감 정보 보호는 기존처럼 **인증·권한**으로 유지.
- **Sitemap**에 포함되는 페이지는 "검색에 노출돼도 되는 공개 페이지"만 포함. 로그인 필요 페이지는 sitemap에서 제외(이미 경로 자체를 sitemap에 넣지 않음).
- **OG 이미지**를 추가할 경우 `public/img/og-default.png` 등 1장 준비 후 metadata의 openGraph.images에 지정.

이 순서대로 적용하면 layerary.com 도메인 기준 SEO(검색 노출·공유 미리보기·크롤링 제한)가 정리됩니다.
