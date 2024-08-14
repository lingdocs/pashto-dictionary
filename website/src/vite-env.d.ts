/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly REACT_APP_BUILD_NO: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
