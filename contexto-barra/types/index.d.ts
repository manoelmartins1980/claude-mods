export type Contexto = { tokens: number; janela: number; percent: number }

declare module 'claude-code' {
  interface PluginState {
    'contexto-barra': { contexto: Contexto | null }
  }
}
