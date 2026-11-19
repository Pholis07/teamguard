import { expect, test } from 'vitest'
import { DEMO_ABSENCE, proposeCoverage } from '../domain'
import { equilibrio } from './equilibrio'
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

test('la versión nombra el ejemplo, se conserva al reiniciar y no toca los datos', () => {
  const emp = reducer(estadoInicial(), { type: 'setVersion', version: 'empresas' })
  const e = reducer(emp, { type: 'cargarEjemplo' })
  expect(e.proyecto).toEqual({ nombre: 'Campaña Q4 (ejemplo)', ejemplo: true })
  expect(e.tasks).toEqual(ejemplo().tasks)
  expect(e.members.map((m) => m.name)).toEqual(['Ana', 'Luis', 'Sol'])
  expect(equilibrio(contextoDe(e)).indice).toBe(100)
  expect(reducer(e, { type: 'reset' }).version).toBe('empresas')
  expect(ejemplo().proyecto!.nombre).toBe('Proyecto final (ejemplo)')
  expect(reducer(emp, { type: 'setVersion', version: 'empresas' })).toBe(emp)
})

test('restoreTask reinserta la misma tarea en su posición original, con su responsable', () => {
  const base = ejemplo()
  const original = base.tasks[1]
  const sin = reducer(base, { type: 'removeTask', id: original.id })
  expect(sin.tasks).toHaveLength(base.tasks.length - 1)
  const de_vuelta = reducer(sin, { type: 'restoreTask', task: original, index: 1 })
  expect(de_vuelta.tasks).toEqual(base.tasks)
  expect(de_vuelta.tasks[1]).toBe(original)
  expect(de_vuelta.decisiones).toEqual([])
})

test('restoreTask no duplica una tarea que ya existe', () => {
  const base = ejemplo()
  expect(reducer(base, { type: 'restoreTask', task: base.tasks[0], index: 0 })).toBe(base)
})

test('restoreMember reinserta al integrante en su posición y recupera su ausencia', () => {
  const base = reducer(ejemplo(), { type: 'setAbsence', absence: { ...DEMO_ABSENCE, memberId: 'm2' }, hora: '10:00' })
  // m2 sin tareas para poder borrarlo
  const libre = { ...base, tasks: base.tasks.filter((t) => t.ownerId !== 'm2') }
  const miembro = libre.members[1]
  const sin = reducer(libre, { type: 'removeMember', id: miembro.id })
  expect(sin.members.map((m) => m.id)).not.toContain(miembro.id)
  expect(sin.absence).toBeNull()
  const de_vuelta = reducer(sin, { type: 'restoreMember', member: miembro, index: 1, absence: libre.absence })
  expect(de_vuelta.members).toEqual(libre.members)
  expect(de_vuelta.absence).toEqual(libre.absence)
  expect(reducer(de_vuelta, { type: 'restoreMember', member: miembro, index: 0 })).toBe(de_vuelta)
})
