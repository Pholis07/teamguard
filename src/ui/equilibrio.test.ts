import { expect, test } from 'vitest'
import { confirmProposal, createDemoState, DEMO_ABSENCE, DEMO_DATE, proposeCoverage, type RuleContext } from '../domain'
import { equilibrio } from './equilibrio'

const { members, tasks } = createDemoState()
const base: RuleContext = { members, tasks, absences: [], asOf: DEMO_DATE }

test('caso común: 100 → 86 al simular sobrecarga, 57 con la ausencia sin cubrir, 100 al cubrirla', () => {
  expect(equilibrio(base)).toEqual({ indice: 100, caben: 7, total: 7 })

  const simulada = tasks.map((t) => (t.id === 't2' ? { ...t, ownerId: 'm1' } : t))
  expect(equilibrio({ ...base, tasks: simulada })).toEqual({ indice: 86, caben: 6, total: 7 })

  const ausencia = { ...base, absences: [DEMO_ABSENCE] }
  expect(equilibrio(ausencia)).toEqual({ indice: 57, caben: 4, total: 7 })

  const cubiertas = confirmProposal(ausencia, proposeCoverage(ausencia, 't1').proposal!)
  expect(equilibrio({ ...ausencia, tasks: cubiertas })).toEqual({ indice: 100, caben: 7, total: 7 })
})

test('sin tareas abiertas el equilibrio es 100', () => {
  expect(equilibrio({ ...base, tasks: tasks.map((t) => ({ ...t, status: 'done' as const })) }).indice).toBe(100)
})
