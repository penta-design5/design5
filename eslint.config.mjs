import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  // `next lint`(Next 15까지)가 검사하던 범위와 맞춘다 — 빌드 산출물·자체 호스팅 외부 파일(public/js/pdfjs 등)·스크립트는 제외
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "public/**",
    "scripts/**",
    "prisma/**",
    "deploy/**",
    "docs/**",
    "next-env.d.ts",
    "next.config.js",
    "postcss.config.js",
  ]),
  {
    extends: [...nextCoreWebVitals, ...nextTypescript],

    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],

      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "prefer-const": "warn",
      "no-var": "warn",

      // eslint-plugin-react-hooks 7(Next 16)에서 추가된 React Compiler 규칙 — 기존 코드 패턴을 에러로 잡는다.
      // 업그레이드(UPGRADE_next16-react19_handoff.md U1)에서는 동작을 바꾸지 않고 경고로만 보이게 둔다(정리는 별도 과제)
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/incompatible-library": "warn",
    },
  },
]);
