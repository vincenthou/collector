import { defineConfig, WxtViteConfig } from 'wxt';
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  manifest: {
    name: 'Page Collector',
    permissions: ['storage']
  },
  modules: ['@wxt-dev/module-react'],
  vite: (): WxtViteConfig => ({
    plugins: [tailwindcss() as any],
  }),
});
