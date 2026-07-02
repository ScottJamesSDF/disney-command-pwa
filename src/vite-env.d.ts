/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_BACKEND?: 'local' | 'supabase'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
