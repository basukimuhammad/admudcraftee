interface ImportMetaEnv {
  readonly VITE_ADMIN_SALT: string
  readonly VITE_ADMIN_HASH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
