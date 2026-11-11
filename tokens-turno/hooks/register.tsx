import { atom, read, update } from 'claude-code'
import type { Register, TurnUsage } from 'claude-code'

import type { Contagem, Uso } from '../types'

const ZERO: Uso = { entrada: 0, cache: 0, saida: 0 }

const contagem = atom({ plugin: 'tokens-turno', key: 'contagem' } as const, { ultima: null, sessao: ZERO } as Contagem)

// entrada = tudo o que o modelo leu (novo + cache); cache = parte dela servida/gravada pelo cache
const deUso = (u: TurnUsage): Uso => ({
  entrada: u.input_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens,
  cache: u.cache_read_input_tokens,
  saida: u.output_tokens,
})

const soma = (a: Uso, b: Uso): Uso => ({
  entrada: a.entrada + b.entrada,
  cache: a.cache + b.cache,
  saida: a.saida + b.saida,
})

const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

export const register: Register = on => {
  // subagentes terminam antes da resposta principal: entram na conta da resposta
  let subagentes: Uso = ZERO

  on('turn.start', async ($, e, next) => {
    subagentes = ZERO

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.usage) {
      const uso = deUso(e.usage)

      if (e.agentId) {
        subagentes = soma(subagentes, uso)
        await update($, contagem, c => ({ ...c, sessao: soma(c.sessao, uso) }))
      } else {
        const total = soma(uso, subagentes)
        subagentes = ZERO
        await update($, contagem, c => ({ ultima: total, sessao: soma(c.sessao, uso) }))
      }
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const { ultima, sessao } = await read($, contagem)

    if (e.props.hasSurvey || !ultima) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Box>
          <Text key="t0" dimColor>Última resposta  </Text>
          <Text key="i" color="cyan">↑ {fmt(ultima.entrada)} entrada</Text>
          <Text key="c" color="blue" dimColor> (cache {fmt(ultima.cache)})</Text>
          <Text key="d1" dimColor>  ·  </Text>
          <Text key="o" color="#fb923c">↓ {fmt(ultima.saida)} saída</Text>
          <Text key="d2" dimColor>  ·  total </Text>
          <Text key="tt" bold>{fmt(ultima.entrada + ultima.saida)}</Text>
          <Text key="d3" dimColor>   │   Sessão  </Text>
          <Text key="si" color="cyan">↑ {fmt(sessao.entrada)}</Text>
          <Text key="ss" color="#fb923c"> ↓ {fmt(sessao.saida)}</Text>
        </Box>
        {await next(e)}
      </Box>
    )
  })
}
