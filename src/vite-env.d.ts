/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dev-only: password for the browser-only "local mode" admin (set in .env.local). Ignored in production builds. */
  readonly VITE_LOCAL_ADMIN_PASSWORD?: string;
}
