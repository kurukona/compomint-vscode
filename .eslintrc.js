module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended", // Prettier 설정과 충돌 방지
  ],
  plugins: ["@typescript-eslint", "prettier", "unused-imports"],
  rules: {
    // Prettier 관련
    "prettier/prettier": "warn",

    // 미사용 import 제거
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      { vars: "all", varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
    ],

    // 기타 설정 예시
    "@typescript-eslint/no-explicit-any": "off",
    "no-console": "warn",
  },
};
