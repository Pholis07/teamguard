import { describe, expect, it } from 'vitest'
import {
  calculateLoads, confirmProposal, createDemoState, DEMO_ABSENCE, DEMO_DATE,
  getCoverageCandidates, getTasksNeedingCoverage, isTaskOverdue, proposeCoverage,
  rejectProposal, simulateAssignment,
} from './index'
import type { RuleContext } from './types'

function context(): RuleContext {
  return { ...createDemoState(), absences: [{ ...DEMO_ABSENCE }], asOf: DEMO_DATE }
}

describe('cargas y simulación del caso común', () => {
  it('calcula 3/4 normal y simula 5/4 sobrecargado sin modificar el reparto', () => {
    const { members, tasks } = context()
    const before = structuredClone(tasks)
    expect(calculateLoads(members, tasks)[0]).toMatchObject({ assignedHours: 3, ratio: 0.75, percentage: 75, status: 'normal' })
    const simulation = simulateAssignment(members, tasks, 't2', 'm1')
    expect(simulation.projectedLoads[0]).toMatchObject({ assignedHours: 5, ratio: 1.25, percentage: 125, status: 'overloaded' })
    expect(tasks).toEqual(before)
    expect(calculateLoads(members, tasks)[0].percentage).toBe(75)
  })

  it('marca cero horas como sin capacidad incluso sin trabajo', () => {
    const member = { id: 'm0', name: 'Sin capacidad', availableHours: 0 }
    expect(calculateLoads([member], [])[0]).toMatchObject({ ratio: null, percentage: null, status: 'no-capacity' })
    expect(calculateLoads([member], [{ ...context().tasks[0], ownerId: 'm0' }])[0]).toMatchObject({ assignedHours: 3, ratio: null, status: 'no-capacity' })
  })

  it('cuenta pendientes y vencidas, excluye terminadas y admite exactamente 100 %', () => {
    const { members, tasks } = context()
    const changed = tasks.map((task) => task.id === 't1' ? { ...task, status: 'pending' as const, estimatedHours: 4, dueDate: '2026-11-18' } : { ...task, status: 'done' as const })
    expect(calculateLoads(members, changed).map((load) => load.assignedHours)).toEqual([4, 0, 0])
    expect(calculateLoads(members, changed)[0].status).toBe('normal')
    expect(isTaskOverdue(changed[0], DEMO_DATE)).toBe(true)
    expect(isTaskOverdue({ ...changed[0], status: 'done' }, DEMO_DATE)).toBe(false)
    expect(isTaskOverdue({ ...changed[0], dueDate: DEMO_DATE }, DEMO_DATE)).toBe(false)
  })
})

describe('cobertura con aprobación humana', () => {
  it('propone Luis con 5/6, rechaza y luego confirma únicamente t1', () => {
    const state = context()
    const before = structuredClone(state)
    expect(getTasksNeedingCoverage(state).map((task) => task.id)).toEqual(['t1'])
    const result = proposeCoverage(state, 't1')
    expect(result.proposal).toMatchObject({ taskId: 't1', currentOwnerId: 'm1', candidateId: 'm2' })
    expect(result.proposal!.projectedLoads[1]).toMatchObject({ assignedHours: 5, ratio: 5 / 6 })
    expect(rejectProposal()).toBeNull()
    expect(state).toEqual(before)
    const accepted = confirmProposal(state, proposeCoverage(state, 't1').proposal!)
    expect(accepted[0]).toEqual({ ...state.tasks[0], ownerId: 'm2' })
    expect(accepted.slice(1)).toEqual(state.tasks.slice(1))
    expect(state).toEqual(before)
  })

  it('devuelve motivo si nadie cabe o el candidato está ausente', () => {
    const state = context()
    state.absences = [...state.absences, { ...DEMO_ABSENCE, memberId: 'm2' }]
    expect(getCoverageCandidates(state, 't1')).toEqual([])
    expect(proposeCoverage(state, 't1')).toEqual({ proposal: null, reason: 'No hay integrantes disponibles con horas suficientes.' })
    expect(proposeCoverage(context(), 't1', 'm3').proposal).toBeNull()
  })

  it('permite editar al candidato y recalcula la carga prevista', () => {
    const state = context()
    state.members = state.members.map((member) => member.id === 'm3' ? { ...member, availableHours: 5 } : member)
    expect(getCoverageCandidates(state, 't1').map((member) => member.id)).toEqual(['m2', 'm3'])
    const edited = proposeCoverage(state, 't1', 'm3')
    expect(edited.proposal!.projectedLoads[2]).toMatchObject({ assignedHours: 5, percentage: 100 })
    expect(state.tasks[0].ownerId).toBe('m1')
  })

  it('excluye capacidad cero aunque la tarea requiera cero horas', () => {
    const state = context()
    state.tasks = state.tasks.map((task) => ({ ...task, estimatedHours: 0 }))
    state.members = state.members.map((member) => ({ ...member, availableHours: 0 }))
    expect(proposeCoverage(state, 't1').proposal).toBeNull()
  })

  it('cubre vencidas pendientes y respeta límites inclusivos de ausencia', () => {
    const state = context()
    state.tasks = state.tasks.map((task) => task.id === 't1' ? { ...task, dueDate: '2026-11-18' } : task)
    expect(proposeCoverage(state, 't1').proposal).not.toBeNull()
    for (const dueDate of [DEMO_ABSENCE.from, DEMO_ABSENCE.to]) {
      state.tasks = state.tasks.map((task) => task.id === 't1' ? { ...task, dueDate } : task)
      expect(proposeCoverage(state, 't1').proposal).not.toBeNull()
    }
    state.absences = [{ ...DEMO_ABSENCE, status: 'cancelled' }]
    expect(getTasksNeedingCoverage(state)).toEqual([])
    state.absences = [{ ...DEMO_ABSENCE }]
    state.asOf = '2026-11-22'
    expect(getTasksNeedingCoverage(state)).toEqual([])
  })

  it('no ofrece tareas terminadas ni reasigna tareas inexistentes', () => {
    const state = context()
    state.tasks = state.tasks.map((task) => ({ ...task, status: 'done' }))
    expect(proposeCoverage(state, 't1').proposal).toBeNull()
    expect(proposeCoverage(state, 'missing').proposal).toBeNull()
    expect(() => simulateAssignment(state.members, state.tasks, 't1', 'm2')).toThrow()
    expect(() => simulateAssignment(state.members, state.tasks, 'missing', 'm2')).toThrow()
  })

  it('rechaza propuestas obsoletas al cambiar responsable, capacidad o ausencia', () => {
    const state = context()
    const proposal = proposeCoverage(state, 't1').proposal!
    const changedOwner = { ...state, tasks: state.tasks.map((task) => task.id === 't1' ? { ...task, ownerId: 'm3' } : task) }
    expect(() => confirmProposal(changedOwner, proposal)).toThrow()
    const changedCapacity = { ...state, members: state.members.map((member) => ({ ...member, availableHours: 0 })) }
    expect(() => confirmProposal(changedCapacity, proposal)).toThrow()
    expect(() => confirmProposal({ ...state, absences: [] }, proposal)).toThrow()
  })
})

describe('validación de entradas y datos independientes', () => {
  it('no comparte objetos entre reinicios', () => {
    const first = createDemoState()
    first.tasks[0].ownerId = 'm2'
    first.members[0].availableHours = 0
    expect(createDemoState().tasks[0].ownerId).toBe('m1')
    expect(createDemoState().members[0].availableHours).toBe(4)
  })

  it('rechaza horas inválidas, IDs duplicados, responsables desconocidos y fechas inválidas', () => {
    const { members, tasks } = context()
    for (const availableHours of [-1, NaN, Infinity]) {
      expect(() => calculateLoads([{ ...members[0], availableHours }], [])).toThrow()
    }
    expect(() => calculateLoads(members, [{ ...tasks[0], estimatedHours: -1 }])).toThrow()
    expect(() => calculateLoads([members[0], members[0]], [])).toThrow()
    expect(() => calculateLoads(members, [tasks[0], tasks[0]])).toThrow()
    expect(() => calculateLoads(members, [{ ...tasks[0], ownerId: 'missing' }])).toThrow()
    expect(() => calculateLoads(members, [{ ...tasks[0], dueDate: '2026-02-30' }])).toThrow()
    expect(() => proposeCoverage({ ...context(), absences: [{ ...DEMO_ABSENCE, from: '2026-11-22' }] }, 't1')).toThrow()
  })
})
