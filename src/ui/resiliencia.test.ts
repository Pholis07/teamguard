import { expect, test } from 'vitest'
import { createDemoState, DEMO_DATE, type RuleContext } from '../domain'
import { resiliencia } from './resiliencia'

const { members, tasks } = createDemoState()
const base: RuleContext = { members, tasks, absences: [], asOf: DEMO_DATE }

test('caso común: cualquier ausencia se puede cubrir y el equipo vuelve a 100', () => {
  const r = resiliencia(base)
  expect(r.map((x) => [x.memberId, x.sinCobertura, x.conCobertura])).toEqual([['m1', 57, 100], ['m2', 71, 100], ['m3', 71, 100]])
  expect(r.map((x) => x.cubre)).toEqual([[{ tarea: 'Boceto', quien: 'm2' }], [{ tarea: 'Ficha', quien: 'm3' }], [{ tarea: 'Resumen', quien: 'm2' }]])
  expect(r.every((x) => x.imposibles.length === 0)).toBe(true)
})

test('detecta el punto frágil cuando nadie tiene horas para cubrir', () => {
  const ajustado = members.map((m) => (m.id === 'm2' ? { ...m, availableHours: 2 } : m))
  const ana = resiliencia({ ...base, members: ajustado })[0]
  expect(ana.imposibles.map((t) => t.id)).toEqual(['t1'])
  expect(ana.conCobertura).toBe(57)
})
