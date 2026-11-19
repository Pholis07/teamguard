import { expect, test } from 'vitest'
import { reducer, estadoInicial, type Estado } from './estado'

const ejemplo = (): Estado => reducer(estadoInicial(), { type: 'cargarEjemplo' })
const archivo = { taskId: 't1', uploaderId: 'm1', file: new File(['x'], 'boceto.txt') }

test('el cambio manual de responsable reasigna y queda en la bitácora', () => {
  const e = reducer(ejemplo(), { type: 'reassignTask', id: 't2', ownerId: 'm3', hora: '11:30' })
  expect(e.tasks.find((t) => t.id === 't2')!.ownerId).toBe('m3')
  expect(e.decisiones).toEqual([{ hora: '11:30', texto: 'Ficha pasó de Luis a Sol (cambio manual)' }])
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
