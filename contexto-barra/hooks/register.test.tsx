import { describe, expect, test } from 'claude-code/testing'

const PROPS = { hasSurvey: false, isWorking: false, maxRows: 20, width: 80 } as never

function base(on: never) {
  const o = on as (...a: unknown[]) => unknown
  o('turn.start', {}, (_$: unknown, e: { turnId: string }) => ({ turnId: e.turnId }))
  o('turn.complete', {}, (_$: unknown, e: { answer: string }) => ({ text: e.answer }))
  o('ui.render', { component: 'AbovePrompt' }, ($: never, e: never) => {
    const { Box } = ($ as { ui: { resolve: (e: never) => { Box: (p: object) => unknown } } }).ui.resolve(e)

    return Box({ key: 'base' })
  })
}

const completa = ($: never) =>
  ($ as { turn: { complete: (e: unknown) => Promise<unknown> } }).turn.complete({
    answer: 'ok', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer',
  })

describe('contexto-barra', () => {
  test('sem leitura de contexto não desenha, mas deixa passar o que vem de baixo', async ($, on) => {
    base(on as never)
    const ui = await $.ui.mount({ plugin: 'contexto-barra', surface: 'terminal', component: 'AbovePrompt', props: PROPS })
    expect(await ui.find({ type: 'Text', text: 'Contexto  ' })).toBeUndefined()
    expect(await ui.find({ key: 'base' })).toBeDefined()
    await ui.unmount()
  })

  test('depois de uma resposta mostra a barra, o percentual e os tokens', async ($, on) => {
    base(on as never)
    ;(on as unknown as (...a: unknown[]) => unknown)('session.usage', () => ({
      value: { startedAt: 0, rateLimits: [], context: { tokens: 62600, window: 1000000, percent: 6 } },
    }))
    await completa($ as never)
    const ui = await $.ui.mount({ plugin: 'contexto-barra', surface: 'desktop', component: 'AbovePrompt', props: PROPS })
    expect(await ui.find({ type: 'Text', text: ' 6%' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '  ·  62.6k / 1.0M' })).toBeDefined()
    expect(await ui.find({ key: 'base' })).toBeDefined()
    await ui.unmount()
  })

  test('cor por faixa: verde, amarelo e vermelho', async ($, on) => {
    base(on as never)
    let pct = 30
    ;(on as unknown as (...a: unknown[]) => unknown)('session.usage', () => ({
      value: { startedAt: 0, rateLimits: [], context: { tokens: pct * 1000, window: 100000, percent: pct } },
    }))
    for (const [p, cor] of [[30, 'success'], [60, 'warning'], [90, 'error']] as const) {
      pct = p
      await completa($ as never)
      const ui = await $.ui.mount({ plugin: 'contexto-barra', surface: 'desktop', component: 'AbovePrompt', props: PROPS })
      expect(await ui.find({ type: 'Text', text: ` ${p}%`, color: cor })).toBeDefined()
      await ui.unmount()
    }
  })
})
