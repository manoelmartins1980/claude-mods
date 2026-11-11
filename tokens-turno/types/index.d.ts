export type Uso = { entrada: number; cache: number; saida: number }
export type Contagem = { ultima: Uso | null; sessao: Uso }

declare module 'claude-code' {
  interface PluginState {
    'tokens-turno': { contagem: Contagem }
  }
}
