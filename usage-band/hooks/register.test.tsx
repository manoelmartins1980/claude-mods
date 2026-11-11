import { describe, expect, test } from 'claude-code/testing'

const PROPS = { hasSurvey: false, isWorking: false, maxRows: 20, width: 80 } as never

const medir = (percentFive: number, percentWeek: number) =>
  ({
    context: { window: 200000 },
    changed: ['rateLimits'],
    rateLimits: [
      { kind: 'five_hour', percentUsed: percentFive, resetsAt: '2026-10-08T18:40:00-03:00' },
      { kind: 'seven_day', percentUsed: percentWeek, resetsAt: '2026-10-09T09:00:00-03:00' },
    ],
  }) as never

describe('usage-band', () => {
  test('mostra 5h e semana com o percentual, abaixo do que outros plugins desenham', async ($, on) => {
    on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
      const { Box, Text } = $.ui.resolve(e)

      return (
        <Box key="outro">
          <Text>OUTRO</Text>
        </Box>
      )
    })

    on('session.measure', (_$, e) => ({ changed: e.changed }))

    await $.session.measure(medir(32, 58))

    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ plugin: 'usage-band', surface, component: 'AbovePrompt', props: PROPS })
      expect(await ui.find({ type: 'Text', text: ' 32%' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: ' 58%' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'OUTRO' })).toBeDefined()
      // reset no horário de Lisboa, qualquer que seja o fuso da máquina
      expect(await ui.find({ type: 'Text', text: ' · reset 22:40' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: ' · reset sex 13:00' })).toBeDefined()
      await ui.unmount()
    }
  })
})
