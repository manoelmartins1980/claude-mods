import { describe, expect, test } from 'claude-code/testing'

const PROPS = { hasSurvey: false, isWorking: false, maxRows: 20, width: 80 } as never
const uso = (i: number, o: number, cr = 0, cc = 0) =>
  ({ input_tokens: i, output_tokens: o, cache_read_input_tokens: cr, cache_creation_input_tokens: cc, model: 'm' }) as never

function base(on: never) {
  const o = on as (...a: unknown[]) => unknown
  o('turn.start', {}, (_$: unknown, e: { turnId: string }) => ({ turnId: e.turnId }))
  o('turn.complete', {}, (_$: unknown, e: { answer: string }) => ({ text: e.answer }))
  o('ui.render', { component: 'AbovePrompt' }, ($: never, e: never) => {
    const { Box } = ($ as { ui: { resolve: (e: never) => { Box: (p: object) => unknown } } }).ui.resolve(e)

    return Box({ key: 'base' })
  })
}

const completa = ($: never, turnId: string, usage: unknown, agentId?: string) =>
  ($ as { turn: { complete: (e: unknown) => Promise<unknown> } }).turn.complete({
    answer: 'ok', durationMs: 1, isAborted: false, turnId, reason: 'answer', usage, ...(agentId ? { agentId } : {}),
  })

describe('tokens-turno', () => {
  test('sem resposta ainda não desenha; depois mostra entrada, cache, saída e total', async ($, on) => {
    base(on as never)
    const mount = () => $.ui.mount({ plugin: 'tokens-turno', surface: 'terminal', component: 'AbovePrompt', props: PROPS })

    const vazio = await mount()
    expect(await vazio.find({ type: 'Text', text: /entrada/ })).toBeUndefined()
    await vazio.unmount()

    await completa($ as never, 't1', uso(2000, 1800, 9100, 1300))
    const ui = await mount()
    expect(await ui.find({ type: 'Text', text: '↑ 12.4k entrada' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: ' (cache 9.1k)' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '↓ 1.8k saída' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '14.2k' })).toBeDefined()
    await ui.unmount()
  })

  test('sessão acumula as respostas e subagentes entram na conta da resposta', async ($, on) => {
    base(on as never)
    await completa($ as never, 't1', uso(1000, 500))
    await completa($ as never, 't2sub', uso(300, 200), 'ag1')
    await completa($ as never, 't2', uso(1000, 500))

    const ui = await $.ui.mount({ plugin: 'tokens-turno', surface: 'desktop', component: 'AbovePrompt', props: PROPS })
    // última resposta: 1000+300 entrada, 500+200 saída (principal + subagente)
    expect(await ui.find({ type: 'Text', text: '↑ 1.3k entrada' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '↓ 700 saída' })).toBeDefined()
    // sessão: 1000+300+1000 entrada, 500+200+500 saída
    expect(await ui.find({ type: 'Text', text: '↑ 2.3k' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: ' ↓ 1.2k' })).toBeDefined()
    await ui.unmount()
  })

  test('compõe acima do que vem de outros plugins', async ($, on) => {
    base(on as never)
    await completa($ as never, 't1', uso(10, 5))
    const ui = await $.ui.mount({ plugin: 'tokens-turno', surface: 'terminal', component: 'AbovePrompt', props: PROPS })
    expect(await ui.find({ key: 'base' })).toBeDefined()
    await ui.unmount()
  })
})
