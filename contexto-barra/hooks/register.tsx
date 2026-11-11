import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Contexto } from '../types'

const contexto = atom({ plugin: 'contexto-barra', key: 'contexto' } as const, null as Contexto | null)

const colorFor = (pct: number) => (pct < 49 ? 'success' : pct < 85 ? 'warning' : 'error')

const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

const BLOCOS = 20

export const register: Register = on => {
  on('turn.complete', async ($, e, next) => {
    if (!e.agentId) {
      const { context } = await $.session.usage()

      if (context.tokens !== undefined && context.percent !== undefined) {
        const novo: Contexto = { tokens: context.tokens, janela: context.window, percent: context.percent }
        await update($, contexto, () => novo)
      }
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const c = await read($, contexto)

    if (e.props.hasSurvey || !c) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const pct = Math.max(0, Math.min(100, c.percent))
    const cheios = Math.max(pct > 0 ? 1 : 0, Math.round((pct / 100) * BLOCOS))
    const cor = colorFor(pct)

    return (
      <Box flexDirection="column">
        <Box>
          <Text key="t" dimColor>Contexto  </Text>
          <Text key="f" color={cor}>{'█'.repeat(cheios)}</Text>
          <Text key="v" dimColor>{'░'.repeat(BLOCOS - cheios)}</Text>
          <Text key="p" color={cor} bold> {Math.round(pct)}%</Text>
          <Text key="n" dimColor>  ·  {fmt(c.tokens)} / {fmt(c.janela)}</Text>
        </Box>
        {await next(e)}
      </Box>
    )
  })
}
