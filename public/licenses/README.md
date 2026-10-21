# 오픈소스 라이선스 고지

빌드하면 번들 JS의 `@license` 주석이 지워지므로(Next.js 14 운영 빌드에서 확인, 2026-10-21) 배포에 포함되는 오픈소스의 라이선스 원문을 여기에 둔다. 화면에서는 각 메뉴의 출처 문구가 이 파일들로 연결된다.

| 폴더 | 대상 | 사용하는 곳 | 라이선스 · 저작권 | 원문 출처 |
| --- | --- | --- | --- | --- |
| `docx-preview/LICENSE.txt` | docx-preview 0.4.1 (npm, 번들에 포함) | TOOLBOX 텍스트추출(OCR) — Word 화면 미리보기 | Apache-2.0 · Copyright Volodymyr Baydalka | https://github.com/VolodymyrBaydalka/docxjs/blob/master/LICENSE |
| `paddleocr/LICENSE.txt` | PaddleOCR PP-OCR 모델(감지 PP-OCRv4 mobile, 인식 PP-OCRv5 korean mobile — ONNX 변환본) | TOOLBOX 텍스트추출(OCR) — 글자 인식 | Apache-2.0 · Copyright (c) 2016 PaddlePaddle Authors | https://github.com/PaddlePaddle/PaddleOCR/blob/main/LICENSE (모델 파일·출처 상세: `public/tool-models/ocr/README.md`) |

- `docx-preview/LICENSE.txt`는 `node_modules/docx-preview/LICENSE`, `paddleocr/LICENSE.txt`는 `public/tool-models/ocr/LICENSE`와 같은 내용이다(확장자 없는 파일은 브라우저가 내려받기로 처리할 수 있어 `.txt` 사본을 둔다).
- 버전을 올리거나 라이브러리를 추가하면 이 표와 원문을 함께 갱신한다.
