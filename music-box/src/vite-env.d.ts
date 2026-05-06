/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BYPASS_AUTH?: string;
  readonly VITE_MUSICKIT_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
