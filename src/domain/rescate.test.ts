import { expect, test } from 'vitest'
import { DEMO_ABSENCE, DEMO_DATE, DEMO_MEMBERS, DEMO_TASKS } from './data'
import { analizarRescate, cicloDe, dependientes, sumarHabiles } from './rescate'
import { isTaskOverdue } from './rules'
import type { Member, RuleContext, Task } from './types'

// Caso común: hoy jueves 19 nov, entrega viernes 20 → 2 días hábiles. Ana 4 h (2 h/día), Luis 6 h (3 h/día), Sol 4 h (2 h/día).
const ctx = (cambios: Partial<RuleContext> = {}): RuleContext => ({
  members: DEMO_MEMBERS.map((m) => ({ ...m })),
  tasks: DEMO_TASKS.map((t) => ({ ...t })),
  absences: [],
  asOf: DEMO_DATE,
  ...cambios,
})
const lunes = sumarHabiles(DEMO_DATE, 2)

test('1 · distribución equilibrada: todo cabe y termina a tiempo', () => {
  const { sinIntervenir } = analizarRescate(ctx())
  expect(sinIntervenir).toMatchObject({ estimatedCompletion: '2026-11-20', deadline: '2026-11-20', lateTaskIds: [], overloadedMemberIds: [], feasible: true })
})

test('2 · sobrecarga: pasar la Ficha a Ana excede sus horas y se marca', () => {
  const base = ctx()
  const { sinIntervenir } = analizarRescate({ ...base, tasks: base.tasks.map((t) => (t.id === 't2' ? { ...t, ownerId: 'm1' } : t)) })
  expect(sinIntervenir.overloadedMemberIds).toEqual(['m1'])
  expect(sinIntervenir.feasible).toBe(false)
})

test('3 · dependencias: si A se atrasa, B (que depende de A) queda bloqueada y tardía', () => {
  const members: Member[] = [{ id: 'm1', name: 'Carlos', availableHours: 8 }, { id: 'm2', name: 'Luis', availableHours: 8 }]
  const tasks: Task[] = [
    { id: 'a', title: 'Base de datos', ownerId: 'm1', estimatedHours: 4, status: 'active', dueDate: '2026-11-20', requiresFile: true },
    { id: 'b', title: 'Integración', ownerId: 'm2', estimatedHours: 2, status: 'active', dueDate: '2026-11-20', requiresFile: true, dependsOn: ['a'] },
  ]
  expect(dependientes(tasks, 'a')).toEqual(['b'])
  const { sinIntervenir } = analizarRescate({ members, tasks, absences: [], asOf: DEMO_DATE }, { taskId: 'a', ownerId: 'm1', hasta: lunes })
  expect(sinIntervenir.blockedTaskIds).toEqual(['b'])
  expect(sinIntervenir.lateTaskIds).toEqual(['a', 'b'])
})

test('4 · rescate viable: la Ficha atrasada pasa a quien tiene horas y la habilidad', () => {
  const base = ctx()
  const members = base.members.map((m) => ({ ...m, skills: m.id === 'm3' ? ['redacción'] : ['diseño'] }))
  const tasks = base.tasks.map((t) => (t.id === 't2' ? { ...t, skill: 'redacción' } : t))
  const { sinIntervenir, plan } = analizarRescate({ ...base, members, tasks }, { taskId: 't2', ownerId: 'm2', hasta: lunes })
  expect(sinIntervenir.lateTaskIds).toEqual(['t2'])
  expect(plan.proposedChanges).toEqual([{ taskId: 't2', fromMemberId: 'm2', toMemberId: 'm3', motivo: 'Se atrasa con su responsable actual' }])
  expect(plan).toMatchObject({ estimatedCompletion: '2026-11-20', lateTaskIds: [], feasible: true })
})

test('5 · rescate inviable: sin capacidad libre lo reconoce y no inventa cambios', () => {
  const base = ctx()
  const justos = base.members.map((m) => ({ ...m, availableHours: m.id === 'm1' ? 3 : 2 }))
  const { plan } = analizarRescate({ ...base, members: justos }, { taskId: 't2', ownerId: 'm2', hasta: lunes })
  expect(plan.proposedChanges).toEqual([])
  expect(plan.feasible).toBe(false)
  expect(plan.warnings).toContain('Ninguna redistribución disponible permite entregar a tiempo sin sobrecargar a alguien.')
})

test('6 · confirmación: analizar no modifica las tareas recibidas', () => {
  const base = ctx({ absences: [DEMO_ABSENCE] })
  const copia = structuredClone(base.tasks)
  const { plan } = analizarRescate(base)
  expect(plan.proposedChanges.length).toBeGreaterThan(0)
  expect(base.tasks).toEqual(copia)
})

test('7 · ausencia: evalúa las tareas afectadas y propone cobertura sin marcar incumplimiento', () => {
  const base = ctx({ absences: [DEMO_ABSENCE] })
  const { sinIntervenir, plan } = analizarRescate(base)
  expect(sinIntervenir.lateTaskIds).toEqual(['t1'])
  expect(plan.proposedChanges).toEqual([{ taskId: 't1', fromMemberId: 'm1', toMemberId: 'm2', motivo: 'Termina después de su fecha límite' }])
  expect(plan.feasible).toBe(true)
  expect(base.tasks.some((t) => isTaskOverdue(t, base.asOf))).toBe(false)
})

test('8 · datos incompletos: sin estimación no da una fecha y lo dice', () => {
  const base = ctx()
  const { sinIntervenir, plan } = analizarRescate({ ...base, tasks: base.tasks.map((t) => (t.id === 't3' ? { ...t, estimatedHours: 0 } : t)) })
  expect(sinIntervenir).toMatchObject({ estimatedCompletion: null, datosCompletos: false, feasible: false })
  expect(sinIntervenir.warnings[0]).toMatch(/^Falta estimar las horas de: Resumen/)
  expect(plan.proposedChanges).toEqual([])
})

test('dependencias circulares: se detectan y no se estima fecha', () => {
  const base = ctx()
  const tasks = base.tasks.map((t) => (t.id === 't1' ? { ...t, dependsOn: ['t2'] } : t.id === 't2' ? { ...t, dependsOn: ['t1'] } : t))
  expect(cicloDe(tasks)).toEqual(['t1', 't2', 't1'])
  expect(analizarRescate({ ...base, tasks }).sinIntervenir.estimatedCompletion).toBeNull()
})
