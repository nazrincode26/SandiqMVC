import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The original site uses plain <img> tags with uploaded files of unknown size.
      "@next/next/no-img-element": "off",
      // Several links intentionally do full page loads, like the original MVC site.
      "@next/next/no-html-link-for-pages": "off",
      // Full reloads are intentional after sign-in/checkout so the server renders with the new session.
      "@next/next/no-location-assign-relative-destination": "off",
    },
  },
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
];

export default config;
