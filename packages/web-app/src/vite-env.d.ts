/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_OAI_URL: string;
  readonly VITE_Z3950_URL: string;
  readonly VITE_BI_URL?: string;
  readonly VITE_DISABLE_MAP_TOUR?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
