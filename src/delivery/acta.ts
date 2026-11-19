import { calculateLoads, type Member, type Task } from '../domain'
import { rutasZip, type Entrega } from './zip'

/** Una decisión del equipo ya redactada (cobertura aceptada, ausencia registrada…). */
export type Decision = { hora: string; texto: string; equilibrio: { antes: number; despues: number } }

/** Puntos del equilibrio en el tiempo: el valor antes de la primera decisión y el que dejó cada una. */
export function serieEquilibrio(decisiones: readonly Decision[]) {
  if (decisiones.length === 0) return []
  return [
    { etiqueta: 'Inicio', detalle: 'Antes de la primera decisión', valor: decisiones[0].equilibrio.antes },
    ...decisiones.map((d) => ({ etiqueta: d.hora, detalle: d.texto, valor: d.equilibrio.despues })),
  ]
}

const barra = (valor: number) => '█'.repeat(Math.round(valor / 10)) + '░'.repeat(10 - Math.round(valor / 10))

const celda = (texto: string) => texto.replaceAll('|', '\\|')
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** Acta en Markdown que viaja dentro del ZIP: quién hizo qué, cargas finales y decisiones. */
export function actaEntrega(
  entregas: readonly Entrega[],
  tasks: readonly Task[],
  members: readonly Member[],
  decisiones: readonly Decision[],
  fecha: string,
) {
  const nombre = (id: string) => members.find((m) => m.id === id)?.name ?? id
  const rutas = rutasZip(entregas, tasks, members)
  const archivos = (taskId: string) =>
    entregas
      .map((e, i) => ({ e, nombreZip: rutas[i].path.split('/').pop()! }))
      .filter(({ e }) => e.taskId === taskId)
      .map(({ e, nombreZip }) => `${celda(nombreZip)} (subió ${nombre(e.uploaderId)})`)
  const cargas = calculateLoads(members, tasks)

  return [
    '# Acta de entrega · TeamGuard',
    '',
    `Generada el ${fecha}. Datos de ejemplo.`,
    '',
    '## Tareas',
    '',
    '| Tarea | Responsable | Horas | Archivos |',
    '|---|---|---|---|',
    ...tasks.map((t) => `| ${celda(t.title)} | ${nombre(t.ownerId)} | ${t.estimatedHours} h | ${archivos(t.id).join('<br>') || 'Sin archivo'} |`),
    '',
    '## Aportes por persona',
    '',
    ...members.map((m) => {
      const c = cargas.find((x) => x.memberId === m.id)!
      const subidos = entregas.filter((e) => e.uploaderId === m.id).length
      return `- **${m.name}**: ${c.assignedHours} de ${c.availableHours} h asignadas · ${plural(subidos, 'archivo subido', 'archivos subidos')}`
    }),
    '',
    '## Decisiones del equipo',
    '',
    ...(decisiones.length
      ? decisiones.map((d) => `- ${d.hora} · ${d.texto} · equilibrio ${d.equilibrio.antes} → ${d.equilibrio.despues}`)
      : ['- Sin decisiones registradas.']),
    '',
    ...(decisiones.length
      ? [
          '## Equilibrio en el tiempo',
          '',
          'Porcentaje de las horas abiertas que caben en el tiempo real de su responsable.',
          '',
          '| Momento | Equilibrio | |',
          '|---|---|---|',
          ...serieEquilibrio(decisiones).map((p) => `| ${p.etiqueta === 'Inicio' ? 'Inicio' : `${p.etiqueta} · ${celda(p.detalle)}`} | ${p.valor} | ${barra(p.valor)} |`),
          '',
        ]
      : []),
    'TeamGuard no hace la tarea: protege los acuerdos y reúne el trabajo real del equipo.',
    '',
  ].join('\n')
}
