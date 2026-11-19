# Motor de reglas — integrante B

Implementado en la rama `Diego-S`. Todos los exports se importan desde `./domain`
(o `../domain` desde las carpetas de A y C). No usa React, archivos ni red.

## Contrato

`Member`, `Task` y `Absence` conservan los campos del acuerdo. Los estados de tarea
son `pending | active | done`; los de ausencia son `active | cancelled`.
Las fechas son días de calendario válidos `YYYY-MM-DD`, con extremos inclusivos.
`RuleContext` recibe `members`, `tasks`, `absences` y `asOf` explícito.
Para convertir la ausencia única del estado de D: `absences: absence ? [absence] : []`.

`createDemoState()` devuelve copias nuevas de integrantes y tareas, con `absence: null`.
D puede agregar `files: []` a ese resultado. `DEMO_ABSENCE` sirve para registrar la
ausencia de Ana y `DEMO_DATE` fija el día de referencia en `2026-11-19`.
Los IDs son m1 Ana (4 h), m2 Luis (6 h), m3 Sol (4 h), y t1 Boceto (3 h),
t2 Ficha (2 h), t3 Resumen (2 h). Todas requieren archivo y vencen el 20 de noviembre,
dentro de la ausencia de Ana del 19 al 21. `DEMO_EXPECTED` publica las cifras esperadas.

## API y ejemplo de integración para A y D

```ts
import {
  createDemoState, DEMO_ABSENCE, DEMO_DATE, calculateLoads,
  simulateAssignment, proposeCoverage, confirmProposal, rejectProposal,
} from './domain'

const initial = createDemoState()
const loads = calculateLoads(initial.members, initial.tasks)
// Ana: assignedHours=3, ratio=0.75, percentage=75, status='normal'.

const simulation = simulateAssignment(initial.members, initial.tasks, 't2', 'm1')
// simulation.projectedLoads: Ana 5/4, percentage=125, status='overloaded'.
// Cancelar: descartar simulation; initial.tasks sigue intacto.

const context = {
  members: initial.members, tasks: initial.tasks,
  absences: [DEMO_ABSENCE], asOf: DEMO_DATE,
}
let result = proposeCoverage(context, 't1')
// { proposal: { taskId:'t1', currentOwnerId:'m1', candidateId:'m2',
//              currentLoads, projectedLoads }, reason:null }
// Luis pasa a 5/6 (83.333... %); redondear solo al mostrar.

// Rechazar: descartar la propuesta local, conservar las tareas compartidas.
const rejected = rejectProposal() // null

// Editar: pasar el candidato elegido. Se recalculan y validan sus cargas.
result = proposeCoverage(context, 't1', 'm2')
if (result.proposal) {
  const nextTasks = confirmProposal(context, result.proposal)
  // Solo al aceptar, D sustituye tasks por nextTasks en su estado compartido.
  // Solo t1 cambia ownerId; C recibe las tareas actualizadas.
}
```

Las funciones nunca mutan entradas. Simular permite sobrecarga para mostrar sus
efectos. La confirmación de cobertura exige un candidato disponible con capacidad;
revalida el estado actual, por lo que D debe pasar el contexto más reciente.
No se debe cambiar `ownerId` directamente a partir de una propuesta sin revalidarla.
`confirmProposal` devuelve tareas nuevas y no administra archivos ni sus autores.

## Reglas y resultados vacíos

- `calculateLoads`: suma pendientes y activas, incluidas vencidas. Excluye terminadas.
  Devuelve horas, capacidad restante (mínimo cero), proporción y porcentaje.
  Cero horas disponibles produce `no-capacity` y proporción/porcentaje `null`.
  Exactamente 100 % es normal; más de 100 % es sobrecarga.
- `isTaskOverdue(task, asOf)`: vencida si la entrega es anterior a `asOf` y no terminó.
- `getTasksNeedingCoverage(context)`: tareas que vencen durante la ausencia del
  responsable; una vencida pendiente necesita cobertura si el responsable está ausente hoy.
- `getCoverageCandidates(context, taskId)`: excluye al responsable, capacidad cero,
  horas insuficientes y ausencias activas que coincidan entre hoy y la entrega
  (solo hoy para vencidas). Ordena por más horas libres y luego ID para desempatar.
  Con el caso común solo Luis cabe; Sol tiene 2 h libres y t1 requiere 3 h.
- `proposeCoverage`: devuelve `{ proposal: null, reason: string }` si nadie cabe,
  si la tarea no requiere cobertura o si el candidato elegido no es elegible.
  El argumento opcional de candidato sirve para editar sin modificar tareas.
- Entradas inconsistentes (horas negativas/no finitas, IDs duplicados, responsable
  inexistente, fechas inválidas o periodos invertidos) lanzan `Error`.
  Una propuesta obsoleta o no elegible también lanza `Error` al confirmar.

Las horas disponibles representan la capacidad total para el reparto mostrado.
Este MVP no divide horas por día ni prorratea ausencias. No usa el reloj del sistema.

## Verificación

```bash
npm run test -- src/domain/rules.test.ts
npm run check
npm run build
```

Las pruebas cubren el recorrido 3/4 → 5/4 → cancelar, ausencia → proponer Luis
→ rechazar → aceptar con 5/6, capacidad cero, terminadas, vencidas, edición,
falta de candidatos, límites de fechas, propuestas obsoletas e inmutabilidad.
La conexión visual corresponde a A y D; este módulo entrega el contrato y las reglas.
