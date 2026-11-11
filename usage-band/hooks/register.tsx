import { atom, read, update } from 'claude-code'
import type { Register, SessionRateLimit } from 'claude-code'

import type { Limits } from '../types'

const limits = atom(
  { plugin: 'usage-band', key: 'limits' } as const,
  { fiveHour: null, sevenDay: null } as Limits,
)

const pick = (rows: SessionRateLimit[], kind: string) => {
  const row = rows.find(r => r.kind === kind)

  return row ? { percentUsed: row.percentUsed, resetsAt: row.resetsAt } : null
}

const toLimits = (rows: SessionRateLimit[]): Limits => ({
  fiveHour: pick(rows, 'five_hour'),
  sevenDay: pick(rows, 'seven_day'),
})

const pad = (n: number) => String(n).padStart(2, '0')
const DAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

// fuso fixo do horário de reset, igual em máquina local e na nuvem (UTC); troque pelo seu fuso IANA
const TZ = 'Europe/Lisbon'
const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

const noFuso = (d: Date) => {
  try {
    const p: Record<string, string> = {}
    for (const x of new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(d)) {
      p[x.type] = x.value
    }
    if (p.hour !== undefined && p.minute !== undefined && p.weekday in WD) {
      return { h: Number(p.hour), m: Number(p.minute), wd: WD[p.weekday] }
    }
  } catch {
    // sem Intl: usa o fuso da máquina
  }

  return { h: d.getHours(), m: d.getMinutes(), wd: d.getDay() }
}

const clock = (iso?: string, withDay = false) => {
  if (!iso) return '?'
  const { h, m, wd } = noFuso(new Date(iso))
  const hm = `${pad(h)}:${pad(m)}`

  return withDay ? `${DAYS[wd]} ${hm}` : hm
}

const colorFor = (pct: number) => (pct < 49 ? 'success' : pct < 85 ? 'warning' : 'error')

const bar = (pct: number) => {
  const filled = Math.max(0, Math.min(10, Math.round(pct / 10)))

  return '█'.repeat(filled) + '░'.repeat(10 - filled)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const usage = await $.session.usage()
    await update($, limits, () => toLimits(usage.rateLimits))

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) {
      await update($, limits, () => toLimits(e.rateLimits))
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const { fiveHour, sevenDay } = await read($, limits)

    if (!fiveHour && !sevenDay) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    // o que outros plugins (ex.: diario-tarefas) desenham fica acima desta faixa
    const acima = await next(e)

    const meter = (label: string, l: Limits['fiveHour'] & {}, withDay: boolean) => {
      const color = colorFor(l.percentUsed)

      return [
        <Text key="l" dimColor>{label} </Text>,
        <Text key="b" color={color}>{bar(l.percentUsed)}</Text>,
        <Text key="p" color={color} bold> {l.percentUsed}%</Text>,
        <Text key="r" dimColor> · reset {clock(l.resetsAt, withDay)}</Text>,
      ]
    }

    return (
      <Box flexDirection="column">
        {acima}
        <Box>
        {fiveHour && meter('5h', fiveHour, false)}
        {fiveHour && sevenDay && <Text dimColor>{'   │   '}</Text>}
        {sevenDay && meter('Semana', sevenDay, true)}
        </Box>
      </Box>
    )
  })
}
