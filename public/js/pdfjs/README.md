# pdf.js 보조 파일 (pdfjs-dist 5.4.296)

- 용도: TOOLBOX「텍스트추출(OCR)」에서 PDF를 브라우저로 읽을 때 pdf.js가 불러오는 파일 (`lib/toolbox/text-extractor/pdf.ts`의 `PDFJS_ASSETS`)
  - `pdf.min.mjs` — pdf.js 본체. **webpack을 거치지 않고 `import(/* webpackIgnore: true */ ...)`로 불러온다** — Next 14 webpack이 pdfjs-dist 5의 pdf.mjs를 다시 번들링하면 `Object.defineProperty called on non-object`로 실패했다
  - `wasm/` — 이미지 디코더(OpenJPEG: 스캔 PDF의 JPEG 2000 이미지, QCMS: 색 관리). 없으면 JPEG 2000 스캔본이 빈 페이지로 렌더된다
  - `cmaps/` — CJK 글꼴 문자 매핑(한글 PDF의 글자 추출·렌더에 필요)
  - `standard_fonts/` — 내장되지 않은 표준 글꼴 대체
- 원본: `node_modules/pdfjs-dist/build/pdf.min.mjs`·`node_modules/pdfjs-dist/{wasm,cmaps,standard_fonts}` 복사 — **`pdfjs-dist`(react-pdf 의존성)·`public/js/pdf.worker.min.mjs`와 같은 버전이어야 한다**(`text-extractor.test.ts`에서 확인). react-pdf를 올리면 이 폴더도 다시 복사한다.
- 라이선스: pdf.js Apache-2.0(`LICENSE`), 각 폴더의 `LICENSE_*`(OpenJPEG BSD-2, QCMS MIT, Foxit·Liberation 글꼴)
