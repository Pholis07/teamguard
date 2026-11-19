import JSZip from 'jszip'
import { expect, test } from 'vitest'
import { DEMO_MEMBERS, DEMO_TASKS } from '../domain'
import { armarZip, rutasZip } from './zip'

const archivo = (nombre: string, texto: string) => new File([texto], nombre)

test('rutas por tarea y autor; sufijo solo si el nombre se repite en la misma ruta', () => {
  const rutas = rutasZip(
    [
      { taskId: 't1', uploaderId: 'm1', file: archivo('evidencia.txt', 'a') },
      { taskId: 't2', uploaderId: 'm2', file: archivo('evidencia.txt', 'b') },
      { taskId: 't1', uploaderId: 'm1', file: archivo('Evidencia.txt', 'c') },
    ],
    DEMO_TASKS,
    DEMO_MEMBERS,
  ).map((r) => r.path)
  expect(rutas).toEqual([
    't1-Boceto/Ana/evidencia.txt',
    't2-Ficha/Luis/evidencia.txt',
    't1-Boceto/Ana/Evidencia (2).txt',
  ])
})

test('la autoría se conserva tras reasignar la tarea', () => {
  const reasignadas = DEMO_TASKS.map((t) => (t.id === 't1' ? { ...t, ownerId: 'm2' } : t))
  const [ruta] = rutasZip([{ taskId: 't1', uploaderId: 'm1', file: archivo('boceto.png', 'x') }], reasignadas, DEMO_MEMBERS)
  expect(ruta.path).toBe('t1-Boceto/Ana/boceto.png')
})

test('el ZIP guarda los bytes originales de archivos homónimos', async () => {
  const zip = armarZip(
    [
      { taskId: 't1', uploaderId: 'm1', file: archivo('evidencia.txt', 'Evidencia ficticia para la tarea t1.') },
      { taskId: 't2', uploaderId: 'm2', file: archivo('evidencia.txt', 'Evidencia ficticia para la tarea t2.') },
    ],
    DEMO_TASKS,
    DEMO_MEMBERS,
  )
  const leido = await JSZip.loadAsync(await zip.generateAsync({ type: 'uint8array' }))
  expect(await leido.file('t1-Boceto/Ana/evidencia.txt')!.async('string')).toBe('Evidencia ficticia para la tarea t1.')
  expect(await leido.file('t2-Ficha/Luis/evidencia.txt')!.async('string')).toBe('Evidencia ficticia para la tarea t2.')
})
