# YuNet (face_detection_yunet_2023mar.onnx)

- 용도: TOOLBOX「이미지 모자이크」 얼굴 자동 감지 (브라우저에서 `onnxruntime-web`으로 실행 — 이미지는 서버로 전송되지 않음)
- 모델: YuNet — Shiqi Yu 외, libfacedetection.train (https://github.com/ShiqiYu/libfacedetection.train)
- 배포본: OpenCV Zoo `opencv/face_detection_yunet` (Hugging Face), 커밋 `3cc26e7f1014a5ee5d74a42acee58bafc9d0a310`
  https://huggingface.co/opencv/face_detection_yunet/resolve/3cc26e7f1014a5ee5d74a42acee58bafc9d0a310/face_detection_yunet_2023mar.onnx
- 라이선스: MIT (같은 폴더의 `LICENSE`)
- 파일: 232,589 bytes · SHA-256 `8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4`
- 입력 `input` [1, 3, 640, 640] (BGR, 0~255, 정규화 없음) / 출력 `cls_*`·`obj_*`·`bbox_*`·`kps_*` (스트라이드 8·16·32)
- 약 10~300px 크기의 얼굴을 찾는다. 앱은 원본 해상도 타일 + 축소 피라미드로 큰 얼굴·작은 얼굴을 모두 처리한다(`lib/toolbox/mosaic/face.ts`).
- 파일이 바뀌면 `lib/toolbox/mosaic/face.ts`의 `FACE_MODEL.sha256`·`bytes`도 함께 바꾼다(앱이 내려받은 뒤 해시를 확인한다).
