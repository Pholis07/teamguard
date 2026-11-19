import { expect, test } from 'vitest'
import { confirmProposal, createDemoState, DEMO_ABSENCE, DEMO_DATE, proposeCoverage, type RuleContext } from '../domain'
import { equilibrio } from './equilibrio'

const { members, tasks } = createDemoState()
const base: RuleContext = { members, tasks, absences: [], asOf: DEMO_DATE }

test('caso común: 100 → 86 al simular sobrecarga, 57 con la ausencia sin cubrir, 100 al cubrirla', () => {
  expect(equilibrio(base)).toMatchObject({ indice: 100, caben: 7, total: 7, riesgo: 'Bajo', sobrecargados: [] })

  const simulada = tasks.map((t) => (t.id === 't2' ? { ...t, ownerId: 'm1' } : t))
  expect(equilibrio({ ...base, tasks: simulada })).toMatchObject({ indice: 86, caben: 6, total: 7, riesgo: 'Medio', sobrecargados: ['m1'] })

  const ausencia = { ...base, absences: [DEMO_ABSENCE] }
  expect(equilibrio(ausencia)).toMatchObject({ indice: 57, caben: 4, total: 7, riesgo: 'Alto', sobrecargados: [] })
  expect(equilibrio(ausencia).sinCubrir.map((t) => t.id)).toEqual(['t1'])

  const cubiertas = confirmProposal(ausencia, proposeCoverage(ausencia, 't1').proposal!)
  expect(equilibrio({ ...ausencia, tasks: cubiertas })).toMatchObject({ indice: 100, caben: 7, total: 7, riesgo: 'Bajo', sinCubrir: [] })
})

test('sin tareas abiertas el equilibrio es 100', () => {
  expect(equilibrio({ ...base, tasks: tasks.map((t) => ({ ...t, status: 'done' as const })) }).indice).toBe(100)
})
