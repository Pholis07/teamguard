import { expect, test } from 'vitest'
import { analizarRescate, DEMO_ABSENCE, proposeCoverage } from '../domain'
import { contextoDe, reducer, estadoInicial, type Estado } from './estado'

const ejemplo = (): Estado => reducer(estadoInicial(), { type: 'cargarEjemplo' })
const archivo = { taskId: 't1', uploaderId: 'm1', file: new File(['x'], 'boceto.txt') }

test('el cambio manual de responsable reasigna y queda en la bitácora', () => {
  const e = reducer(ejemplo(), { type: 'reassignTask', id: 't2', ownerId: 'm3', hora: '11:30' })
  expect(e.tasks.find((t) => t.id === 't2')!.ownerId).toBe('m3')
  expect(e.decisiones).toEqual([{ hora: '11:30', texto: 'Ficha pasó de Luis a Sol (cambio manual)', equilibrio: { antes: 100, despues: 100 } }])
})

test('reasignar al mismo responsable o a alguien inexistente no cambia nada', () => {
  const base = ejemplo()
  expect(reducer(base, { type: 'reassignTask', id: 't2', ownerId: 'm2', hora: '11:30' })).toBe(base)
  expect(reducer(base, { type: 'reassignTask', id: 't2', ownerId: 'm9', hora: '11:30' })).toBe(base)
})

test('una tarea con archivos entregados no se borra; sin archivos, sí', () => {
  const conArchivo = reducer(ejemplo(), { type: 'addFile', entrega: archivo })
  expect(reducer(conArchivo, { type: 'removeTask', id: 't1' })).toBe(conArchivo)
  const sinT2 = reducer(conArchivo, { type: 'removeTask', id: 't2' })
  expect(sinT2.tasks.map((t) => t.id)).toEqual(['t1', 't3'])
  expect(sinT2.files).toHaveLength(1)
})

test('cada decisión guarda el equilibrio de antes y de después', () => {
  const conAusencia = reducer(ejemplo(), { type: 'setAbsence', absence: DEMO_ABSENCE, hora: '11:40' })
  const propuesta = proposeCoverage(contextoDe(conAusencia), 't1').proposal!
  const cubierta = reducer(conAusencia, { type: 'acceptProposal', proposal: propuesta, hora: '11:41' })
  expect(cubierta.decisiones.map((d) => d.equilibrio)).toEqual([{ antes: 100, despues: 57 }, { antes: 57, despues: 100 }])
})

test('caso 6 · un cambio del plan de rescate solo se aplica al aceptarlo, y queda en la bitácora', () => {
  const conAusencia = reducer(ejemplo(), { type: 'setAbsence', absence: DEMO_ABSENCE, hora: '12:00' })
  const [cambio] = analizarRescate(contextoDe(conAusencia)).plan.proposedChanges
  expect(conAusencia.tasks.find((t) => t.id === 't1')!.ownerId).toBe('m1')
  const aceptado = reducer(conAusencia, { type: 'applyRescueChange', change: cambio, hora: '12:01' })
  expect(aceptado.tasks.find((t) => t.id === 't1')!.ownerId).toBe('m2')
  expect(aceptado.decisiones.at(-1)!.texto).toBe('Boceto pasó de Ana a Luis (plan de rescate)')
  expect(reducer(aceptado, { type: 'applyRescueChange', change: cambio, hora: '12:02' })).toBe(aceptado)
})

test('las dependencias inválidas (a sí misma o circulares) se rechazan; al borrar una tarea se limpian', () => {
  const base = ejemplo()
  expect(reducer(base, { type: 'updateTask', id: 't1', cambios: { dependsOn: ['t1'] } })).toBe(base)
  const conDep = reducer(base, { type: 'updateTask', id: 't3', cambios: { dependsOn: ['t2'] } })
  expect(conDep.tasks.find((t) => t.id === 't3')!.dependsOn).toEqual(['t2'])
  expect(reducer(conDep, { type: 'updateTask', id: 't2', cambios: { dependsOn: ['t3'] } })).toBe(conDep)
  expect(reducer(conDep, { type: 'removeTask', id: 't2' }).tasks.find((t) => t.id === 't3')!.dependsOn).toEqual([])
})
