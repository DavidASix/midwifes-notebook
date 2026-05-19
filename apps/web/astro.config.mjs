// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { site } from "./src/lib/site.ts";

// https://astro.build/config
export default defineConfig({
  site: site.url,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
