import { useState, type Dispatch, type FocusEvent, type KeyboardEvent } from 'react'
import type { Member, Task } from '../domain'
import type { Accion } from './estado'
import { BarraCarga, BaseDeDatos, Callout, Icono, Pagina, Propiedades } from './bloques'
import { horas, horasValidas, nombreValido, plural } from './formato'
import './datos.css'

type Props = { members: readonly Member[]; tasks: readonly Task[]; dispatch: Dispatch<Accion> }

/** Lee horas escritas por una persona («4», «2,5»). Vacío o texto no numérico da NaN. */
const leerHoras = (s: string) => (s.trim() === '' ? NaN : Number(s.trim().replace(',', '.')))

const iniciales = (nombre: string) => (nombre.trim()[0] ?? '?').toUpperCase()

/** Avatar de inicial; el color depende del orden del integrante. */
export function Avatar({ nombre, indice }: { nombre: string; indice: number }) {
  return <span className={`av av-s av${(indice % 3) + 1}`} aria-hidden="true">{iniciales(nombre)}</span>
}

/**
 * Celda de texto editable en línea. Guarda al perder el foco o con Enter; Escape revierte.
 * `validar` devuelve un mensaje si el valor no sirve: entonces se revierte y se muestra con role=alert.
 */
export function CeldaTexto({ valor, etiqueta, onGuardar, validar, numerica, autoFocus, entradaRef }: {
  valor: string
  etiqueta: string
  onGuardar: (v: string) => void
  validar: (v: string) => string | null
  numerica?: boolean
  autoFocus?: boolean
  entradaRef?: (el: HTMLInputElement | null) => void
}) {
  const [texto, setTexto] = useState<string | null>(null) // null = sin edición
  const [error, setError] = useState<string | null>(null)

  const confirmar = () => {
    if (texto === null) return
    const v = texto.trim()
    if (v === valor) { setTexto(null); return }
    const msg = validar(v)
    setTexto(null)
    if (msg) { setError(msg); return }
    setError(null)
    onGuardar(v)
  }
  const alTecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.currentTarget.blur() }
    if (e.key === 'Escape') { setTexto(null); setError(null); e.currentTarget.blur() }
  }
  return (
    <div className="dt-celda">
      <input
        ref={entradaRef}
        className={numerica ? 'cel num' : 'cel'}
        type="text"
        inputMode={numerica ? 'decimal' : undefined}
        value={texto ?? valor}
        aria-label={etiqueta}
        aria-invalid={error ? true : undefined}
        autoFocus={autoFocus}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => { setTexto(e.target.value); setError(null) }}
        onBlur={confirmar}
        onKeyDown={alTecla}
      />
      {error && <p className="dt-error" role="alert">{error}</p>}
    </div>
  )
}

type Borrador = { nombre: string; horas: string }

export function IntegrantesVista({ members, tasks, dispatch }: Props) {
  const [borrador, setBorrador] = useState<Borrador | null>(null)
  const [errorBorrador, setErrorBorrador] = useState<string | null>(null)

  const totalHoras = members.reduce((s, m) => s + m.availableHours, 0)
  const msgNombre = (v: string) => (nombreValido(v) ? null : 'Escribe un nombre.')
  const msgHoras = (v: string) => (horasValidas(leerHoras(v)) ? null : 'Escribe las horas como un número, por ejemplo 4.')

  const confirmarBorrador = () => {
    if (!borrador) return
    if (!borrador.nombre.trim() && !borrador.horas.trim()) { setBorrador(null); setErrorBorrador(null); return }
    const msg = msgNombre(borrador.nombre) ?? msgHoras(borrador.horas)
    if (msg) { setErrorBorrador(msg); return }
    dispatch({ type: 'addMember', name: borrador.nombre.trim(), availableHours: leerHoras(borrador.horas) })
    setBorrador(null)
    setErrorBorrador(null)
  }
  const alSalirDeFila = (e: FocusEvent<HTMLTableRowElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) confirmarBorrador()
  }
  const alTeclaBorrador = (e: KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); confirmarBorrador() }
    if (e.key === 'Escape') { setBorrador(null); setErrorBorrador(null) }
  }

  return (
    <Pagina
      icono="👥"
      titulo="Integrantes"
      propiedades={<Propiedades items={[
        { icono: 'personas', etiqueta: 'Integrantes', valor: <span className="num">{members.length}</span> },
        { icono: 'reloj', etiqueta: 'Horas disponibles', valor: <span className="num">{horas(totalHoras)} h en total</span> },
      ]} />}
    >
      {members.length === 0 && !borrador && (
        <Callout icono="💡">Agrega a las personas del equipo y cuántas horas pueden dar hasta la entrega.</Callout>
      )}
      <BaseDeDatos
        columnas={[
          { icono: 'texto', nombre: 'Nombre' },
          { icono: 'numero', nombre: 'Horas disponibles', ancho: '172px' },
          { icono: 'numero', nombre: 'Tareas', ancho: '84px' },
          { icono: 'estado', nombre: 'Carga', ancho: '290px' },
        ]}
        textoNueva="Nuevo integrante"
        onNueva={() => { if (!borrador) setBorrador({ nombre: '', horas: '' }) }}
      >
        {members.map((m, i) => {
          const suyas = tasks.filter((t) => t.ownerId === m.id)
          const abiertas = suyas.filter((t) => t.status !== 'done').reduce((s, t) => s + t.estimatedHours, 0)
          const bloqueado = suyas.length > 0
          return (
            <tr key={m.id} className="dt-fila">
              <td>
                <div className="dt-nombre">
                  <Avatar nombre={m.name} indice={i} />
                  <CeldaTexto
                    valor={m.name}
                    etiqueta={`Nombre de ${m.name}`}
                    validar={msgNombre}
                    onGuardar={(v) => dispatch({ type: 'updateMember', id: m.id, cambios: { name: v } })}
                  />
                </div>
              </td>
              <td>
                <CeldaTexto
                  numerica
                  valor={horas(m.availableHours)}
                  etiqueta={`Horas de ${m.name}`}
                  validar={msgHoras}
                  onGuardar={(v) => dispatch({ type: 'updateMember', id: m.id, cambios: { availableHours: leerHoras(v) } })}
                />
              </td>
              <td className="num dt-cuenta">{suyas.length}<span className="sr-only"> {plural(suyas.length, 'tarea', 'tareas')}</span></td>
              <td>
                <div className="dt-carga">
                  <BarraCarga asignadas={abiertas} disponibles={m.availableHours} />
                  <button
                    type="button"
                    className="btn btn-t dt-borrar"
                    aria-label={`Eliminar a ${m.name}`}
                    title={bloqueado ? 'Primero reasigna sus tareas' : `Eliminar a ${m.name}`}
                    disabled={bloqueado}
                    onClick={() => dispatch({ type: 'removeMember', id: m.id })}
                  >
                    <Icono nombre="basura" tam={15} />
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
        {borrador && (
          <tr className="dt-fila dt-borrador" onBlur={alSalirDeFila}>
            <td>
              <div className="dt-nombre">
                <Avatar nombre={borrador.nombre || '?'} indice={members.length} />
                <input
                  className="cel"
                  type="text"
                  autoFocus
                  placeholder="Nombre"
                  aria-label="Nombre del nuevo integrante"
                  value={borrador.nombre}
                  onChange={(e) => { setBorrador({ ...borrador, nombre: e.target.value }); setErrorBorrador(null) }}
                  onKeyDown={alTeclaBorrador}
                />
              </div>
            </td>
            <td>
              <input
                className="cel num"
                type="text"
                inputMode="decimal"
                placeholder="Horas"
                aria-label="Horas del nuevo integrante"
                value={borrador.horas}
                onChange={(e) => { setBorrador({ ...borrador, horas: e.target.value }); setErrorBorrador(null) }}
                onKeyDown={alTeclaBorrador}
              />
            </td>
            <td className="num dt-cuenta">0</td>
            <td>
              {errorBorrador
                ? <p className="dt-error" role="alert">{errorBorrador}</p>
                : <span className="dt-pista">Enter para guardar</span>}
            </td>
          </tr>
        )}
      </BaseDeDatos>
    </Pagina>
  )
}
