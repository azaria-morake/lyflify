/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // other VITE_ variables can be added here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
