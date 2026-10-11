# YOLOv9-t 640 번호판 감지 (yolo-v9-t-640-license-plates-end2end.onnx)

- 용도: TOOLBOX「이미지 모자이크」 번호판 자동 감지 (브라우저에서 `onnxruntime-web`으로 실행 — 이미지는 서버로 전송되지 않음)
- 모델: open-image-models(ankandrew)의 `yolo-v9-t-640-license-plate-end2end` — https://github.com/ankandrew/open-image-models
- 받은 곳: https://github.com/ankandrew/open-image-models/releases/download/assets/yolo-v9-t-640-license-plates-end2end.onnx
- 라이선스: 저장소 MIT (같은 폴더의 `LICENSE`). ⚠️ **학습 데이터 출처는 저장소 문서에 적혀 있지 않다** — 운영망(외부 공개) 반영 전에 한 번 더 확인한다.
- 파일: 7,835,770 bytes · SHA-256 `c3c1026ca7d0585dd88084d68182dd897113712fa734ae1557ca70174440c076`
- 입력 `images` [1, 3, 640, 640] (RGB, 0~1, 레터박스 회색 114/255) / 출력 `output0` [N, 7] = `[배치, x1, y1, x2, y2, 클래스, 점수]` (NMS 포함 — 채움 행은 점수 0)
- 저장소 공개 성능(자체 검증 세트): P 0.966 · R 0.896 · mAP50 0.958 · mAP50-95 0.758
- 앱은 원본 해상도 타일 + 축소 피라미드(+ 정밀 감지 시 2배 확대)로 훑는다(`lib/toolbox/mosaic/plate.ts`).
- 파일이 바뀌면 `lib/toolbox/mosaic/plate.ts`의 `PLATE_MODEL.sha256`·`bytes`도 함께 바꾼다(앱이 내려받은 뒤 해시를 확인한다).
