import next from "eslint-config-next";

const config = [
  ...next,
  { ignores: [".next/**", "node_modules/**", "public/**", "playwright-report/**", "test-results/**", "infra/**"] },
];

export default config;
