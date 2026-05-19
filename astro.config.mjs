import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://sitaramshelke.me",
  output: "static",
  build: {
    format: "file"
  },
  integrations: [sitemap()]
});
