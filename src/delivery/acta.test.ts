import JSZip from 'jszip'
import { expect, test } from 'vitest'
import { DEMO_MEMBERS, DEMO_TASKS } from '../domain'
import { actaEntrega } from './acta'
import { armarZip, NOMBRE_ACTA } from './zip'

const reasignadas = DEMO_TASKS.map((t) => (t.id === 't1' ? { ...t, ownerId: 'm2' } : t))
const entregas = [
  { taskId: 't1', uploaderId: 'm1', file: new File(['a'], 'boceto|v1.png') },
  { taskId: 't3', uploaderId: 'm3', file: new File(['b'], 'resumen.txt') },
]
const decisiones = [{ hora: '10:42', texto: 'Boceto pasó de Ana a Luis (cobertura aceptada)' }]

test('el acta dice quién es responsable, quién subió cada archivo y qué se decidió', () => {
  const acta = actaEntrega(entregas, reasignadas, DEMO_MEMBERS, decisiones, '19 de noviembre de 2026')
  expect(acta).toContain('| Boceto | Luis | 3 h | boceto\\|v1.png (subió Ana) |')
  expect(acta).toContain('| Ficha | Luis | 2 h | Sin archivo |')
  expect(acta).toContain('- **Luis**: 5 de 6 h asignadas · 0 archivos subidos')
  expect(acta).toContain('- **Ana**: 0 de 4 h asignadas · 1 archivo subido')
  expect(acta).toContain('- 10:42 · Boceto pasó de Ana a Luis (cobertura aceptada)')
})

test('sin decisiones el acta lo dice; el ZIP lleva el acta en la raíz', async () => {
  const acta = actaEntrega(entregas, DEMO_TASKS, DEMO_MEMBERS, [], 'hoy')
  expect(acta).toContain('- Sin decisiones registradas.')
  const zip = await JSZip.loadAsync(await armarZip(entregas, DEMO_TASKS, DEMO_MEMBERS, acta).generateAsync({ type: 'uint8array' }))
  expect(await zip.file(NOMBRE_ACTA)!.async('string')).toBe(acta)
})
