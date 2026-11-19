import { expect, test } from 'vitest'
import { createDemoState } from '../domain'
import type { Entrega } from '../delivery/zip'
import { aporte } from './aporte'

const archivo = (taskId: string, uploaderId: string): Entrega => ({ taskId, uploaderId, file: new File(['x'], 'a.txt') })

test('ejemplo: Ana 3 h, Luis 2 h, Sol 2 h → 43/29/28 y suman 100', () => {
  const { members, tasks } = createDemoState()
  const r = aporte(members, tasks, [])
  expect(r.total).toBe(7)
  expect(r.miembros.map((m) => m.horas)).toEqual([3, 2, 2])
  expect(r.miembros.map((m) => m.pct)).toEqual([43, 29, 28])
  expect(r.miembros.reduce((s, m) => s + m.pct, 0)).toBe(100)
})

test('separa hecho, en progreso y pendiente', () => {
  const { members, tasks } = createDemoState()
  const t = tasks.map((x) => (x.id === 't2' ? { ...x, status: 'done' as const } : x.id === 't3' ? { ...x, status: 'pending' as const } : x))
  const [ana, luis, sol] = aporte(members, t, []).miembros
  expect(ana).toMatchObject({ hecho: 0, enProgreso: 3, pendiente: 0, tareas: 1 })
  expect(luis).toMatchObject({ hecho: 2, enProgreso: 0, pendiente: 0 })
  expect(sol).toMatchObject({ hecho: 0, enProgreso: 0, pendiente: 2 })
})

test('cuenta archivos por quien los subió', () => {
  const { members, tasks } = createDemoState()
  const r = aporte(members, tasks, [archivo('t1', 'm1'), archivo('t1', 'm1'), archivo('t2', 'm3')])
  expect(r.miembros.map((m) => m.archivos)).toEqual([2, 0, 1])
})

test('sin integrantes o sin tareas', () => {
  const { members, tasks } = createDemoState()
  expect(aporte([], tasks, [])).toEqual({ miembros: [], total: 0 })
  const r = aporte(members, [], [])
  expect(r.total).toBe(0)
  expect(r.miembros.every((m) => m.pct === 0 && m.horas === 0)).toBe(true)
})

test('los porcentajes suman 100 con repartos incómodos', () => {
  const { members, tasks } = createDemoState()
  const t = tasks.map((x, i) => ({ ...x, estimatedHours: [1, 1, 1][i] }))
  expect(aporte(members, t, []).miembros.reduce((s, m) => s + m.pct, 0)).toBe(100)
})
