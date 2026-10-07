/**
 * onnxruntime-web 공용 설정 — 배경 편집(배경 제거)·이미지 모자이크(얼굴 감지)가 같은 실행기를 쓴다.
 * wasm은 같은 버전을 jsDelivr에서 받는다(JS는 next.config.js alias로 번들).
 */

/** package.json의 onnxruntime-web 버전과 같아야 한다(background-editor.test.ts에서 확인) */
export const ORT_VERSION = '1.30.0'
export const ORT_WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`
