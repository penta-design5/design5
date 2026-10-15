# PaddleOCR 한국어·영어 글자 인식 (감지 + 인식)

- 용도: TOOLBOX「텍스트추출(OCR)」 (브라우저에서 `onnxruntime-web`으로 실행 — 이미지는 서버로 전송되지 않음)
- 원본: PaddleOCR(PaddlePaddle) — https://github.com/PaddlePaddle/PaddleOCR
- 라이선스: Apache-2.0 (같은 폴더의 `LICENSE` — PaddleOCR 저장소 원문). ⚠️ 운영망(외부 공개) 반영 전에 원본 모델 카드·학습 데이터 출처를 한 번 더 확인한다.

| 파일 | 내용 | 받은 곳(ONNX 변환본) | 크기 · SHA-256 |
| --- | --- | --- | --- |
| `ch_PP-OCRv4_det_mobile.onnx` | 글자 영역 감지(PP-OCRv4 mobile det, 언어 공용) | Hugging Face `SWHL/RapidOCR` — `PP-OCRv4/ch_PP-OCRv4_det_infer.onnx` (Apache-2.0) | 4,745,517 bytes · `d2a7720d45a54257208b1e13e36a8479894cb74155a5efe29462512d42f49da9` |
| `korean_PP-OCRv5_mobile_rec.onnx` | 줄 단위 글자 인식(PP-OCRv5 korean mobile rec — 한국어·영어) | Hugging Face `monkt/paddleocr-onnx` — `languages/korean/rec.onnx` (Apache-2.0) | 13,401,252 bytes · `322f140154c820fcb83c3d24cfe42c9ec70dd1a1834163306a7338136e4f1eaa` |
| `ppocrv5_korean_dict.txt` | 인식 문자 사전(한 줄에 한 글자, 11,945자) | 같은 저장소 `languages/korean/dict.txt` | 47,451 bytes · `a88071c68c01707489baa79ebe0405b7beb5cca229f4fc94cc3ef992328802d7` |

- 감지: 입력 `x` [1, 3, H, W] (BGR, ImageNet 평균·표준편차 정규화, H·W는 32의 배수) / 출력 [1, 1, H, W] 글자 확률 맵
- 인식: 입력 `x` [1, 3, 48, W] (BGR, (v/255 − 0.5)/0.5) / 출력 [1, T, 11,947] — 0번은 CTC 빈칸, 1~11,945번은 사전 순서, 마지막은 띄어쓰기
- 비교 PoC(2026-10-15, `docs/TOOLBOX_text-extractor_handoff.md` §4 P0): Tesseract.js보다 모든 샘플에서 정확하고 빠름. 서버용 감지 모델(v5, 88MB)은 품질 차이가 거의 없어 쓰지 않음
- 파일이 바뀌면 `lib/toolbox/text-extractor/model.ts`의 `OCR_MODEL_FILES`(sha256·bytes)도 함께 바꾼다(앱이 내려받은 뒤 해시를 확인한다).
