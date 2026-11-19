import { useTextos } from './version'
import { useEffect, useId, useRef, useState, type Dispatch, type FocusEvent, type KeyboardEvent } from 'react'
import type { Absence, Member, Task } from '../domain'
import type { Entrega } from '../delivery/zip'
import { aporte } from './aporte'
import { GraficaAporte } from './GraficaAporte'
import type { Accion } from './estado'
import { Ayuda } from './ayuda'
import { useAvisos } from './avisos'
import { BarraCarga, BaseDeDatos, Callout, Icono, Pagina, Propiedades } from './bloques'
import { horas, horasValidas, nombreValido, plural } from './formato'
import './datos.css'

type Props = { members: readonly Member[]; tasks: readonly Task[]; files: readonly Entrega[]; dispatch: Dispatch<Accion>; /** Para devolver la ausencia al deshacer un borrado. */ absence?: Absence | null }

/** Lee horas escritas por una persona («4», «2,5»). Vacío o texto no numérico da NaN. */
const leerHoras = (s: string) => (s.trim() === '' ? NaN : Number(s.trim().replace(',', '.')))

const MAX_HORAS = 100

const iniciales = (nombre: string) => (nombre.trim()[0] ?? '?').toUpperCase()

/** Avatar de inicial; el color depende del orden del integrante. */
export function Avatar({ nombre, indice }: { nombre: string; indice: number }) {
  return <span className={`av av-s av${(indice % 3) + 1}`} aria-hidden="true">{iniciales(nombre)}</span>
}

/** Marca de «guardado»: un check que aparece ~900 ms tras guardar un cambio en línea. */
// oxlint-disable-next-line react/only-export-components -- el hook y su marca van juntos a propósito
export function useGuardado() {
  const [visto, setVisto] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const marcar = () => {
    setVisto(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisto(false), 900)
  }
  return [visto, marcar] as const
}
export function Guardado({ visto }: { visto: boolean }) {
  return visto ? <span className="dt-ok" role="img" aria-label="Guardado"><Icono nombre="check" tam={13} /></span> : null
}

/**
 * Celda de texto editable en línea. Guarda al perder el foco o con Enter; Escape cancela y vuelve al valor guardado.
 * `validar` devuelve un mensaje si el valor no sirve: el texto escrito se conserva, la celda queda marcada
 * (aria-invalid) y el mensaje se enlaza con aria-describedby hasta que se corrija o se cancele.
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
  const [visto, marcar] = useGuardado()
  const cancelado = useRef(false)
  const idError = useId()

  const confirmar = () => {
    if (cancelado.current) { cancelado.current = false; return }
    if (texto === null) return
    const v = texto.trim()
    if (v === valor) { setTexto(null); setError(null); return }
    const msg = validar(v)
    if (msg) { setError(msg); return }
    setTexto(null)
    setError(null)
    onGuardar(v)
    marcar()
  }
  const alTecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const msg = validar((texto ?? valor).trim())
      if (msg && (texto ?? valor).trim() !== valor) setError(msg)
      else e.currentTarget.blur()
    }
    if (e.key === 'Escape') { cancelado.current = true; setTexto(null); setError(null); e.currentTarget.blur() }
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
        aria-describedby={error ? idError : undefined}
        autoFocus={autoFocus}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => { setTexto(e.target.value); if (error) setError(validar(e.target.value.trim())) }}
        onBlur={confirmar}
        onKeyDown={alTecla}
      />
      <Guardado visto={visto} />
      {error && <p className="dt-error" id={idError} role="alert">{error}</p>}
    </div>
  )
}

type Borrador = { nombre: string; horas: string }
type ErroresBorrador = { nombre?: string; horas?: string }

export function IntegrantesVista({ members, tasks, files, dispatch, absence }: Props) {
  const t = useTextos()
  const { avisar } = useAvisos()
  const [borrador, setBorrador] = useState<Borrador | null>(null)
  const [errores, setErrores] = useState<ErroresBorrador>({})

  const totalHoras = members.reduce((s, m) => s + m.availableHours, 0)
  const msgNombre = (v: string) => (nombreValido(v) ? null : 'Escribe un nombre; no puede quedar vacío.')
  const msgHoras = (v: string) => {
    const h = leerHoras(v)
    return horasValidas(h) && h <= MAX_HORAS ? null : `Escribe horas disponibles entre 0 y ${MAX_HORAS} (por ejemplo 4).`
  }

  const cerrarBorrador = () => { setBorrador(null); setErrores({}) }
  const confirmarBorrador = (explicito = false) => {
    if (!borrador) return
    if (!explicito && !borrador.nombre.trim() && !borrador.horas.trim()) { cerrarBorrador(); return }
    const e: ErroresBorrador = { nombre: msgNombre(borrador.nombre) ?? undefined, horas: msgHoras(borrador.horas) ?? undefined }
    if (e.nombre || e.horas) { setErrores(e); return }
    dispatch({ type: 'addMember', name: borrador.nombre.trim(), availableHours: leerHoras(borrador.horas) })
    avisar({ texto: `Se agregó a ${borrador.nombre.trim()}.` })
    cerrarBorrador()
  }
  const alSalirDeFila = (e: FocusEvent<HTMLTableRowElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) confirmarBorrador()
  }
  const alTeclaBorrador = (e: KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); confirmarBorrador(true) }
    if (e.key === 'Escape') cerrarBorrador()
  }
  const eliminar = (m: Member, indice: number) => {
    dispatch({ type: 'removeMember', id: m.id })
    avisar({
      texto: `Se eliminó a ${m.name}.`,
      deshacer: () => dispatch({ type: 'restoreMember', member: m, index: indice, absence: absence?.memberId === m.id ? absence : null }),
    })
  }

  return (
    <Pagina
      icono="integrantes"
      titulo={t.integrantes}
      propiedades={<Propiedades items={[
        { icono: 'personas', etiqueta: t.integrantes, valor: <span className="num">{members.length}</span> },
        { icono: 'reloj', etiqueta: 'Horas disponibles', valor: <span className="num">{horas(totalHoras)} h en total</span> },
      ]} />}
    >
      {members.length === 0 && !borrador && (
        <Callout icono="info">{t.vacioIntegrantes}</Callout>
      )}
      {members.length > 0 && tasks.length > 0 && (
        <section className="n-bd">
          <h2 className="n-bd-tit">Quién aporta cuánto</h2>
          <p className="n-bd-sub">% de las horas del equipo</p>
          <GraficaAporte compacta datos={aporte(members, tasks, files)} />
        </section>
      )}
      <BaseDeDatos
        subtitulo="Carga: % de su tiempo disponible"
        columnas={[
          { icono: 'texto', nombre: 'Nombre' },
          { icono: 'numero', nombre: 'Horas disponibles', ancho: '172px', ayuda: <Ayuda tema="las horas disponibles">Las horas que esta persona puede dedicar al proyecto. Con ellas TeamGuard calcula su carga y si alguien se pasa.</Ayuda> },
          { icono: 'numero', nombre: 'Tareas', ancho: '84px' },
          { icono: 'estado', nombre: 'Carga', ancho: '290px' },
        ]}
        textoNueva={t.nuevoIntegrante}
        onNueva={() => { if (!borrador) setBorrador({ nombre: '', horas: '' }) }}
      >
        {members.map((m, i) => {
          const suyas = tasks.filter((t) => t.ownerId === m.id)
          const abiertas = suyas.filter((t) => t.status !== 'done').reduce((s, t) => s + t.estimatedHours, 0)
          const bloqueado = suyas.length > 0
          return (
            <tr key={m.id} className="dt-fila dt-f-integrante">
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
              <td data-et="Horas disponibles">
                <CeldaTexto
                  numerica
                  valor={horas(m.availableHours)}
                  etiqueta={`Horas de ${m.name}`}
                  validar={msgHoras}
                  onGuardar={(v) => dispatch({ type: 'updateMember', id: m.id, cambios: { availableHours: leerHoras(v) } })}
                />
              </td>
              <td className="num dt-cuenta" data-et="Tareas">{suyas.length}<span className="sr-only"> {plural(suyas.length, 'tarea', 'tareas')}</span></td>
              <td data-et="Carga">
                <div className="dt-carga">
                  <BarraCarga asignadas={abiertas} disponibles={m.availableHours} />
                  <button
                    type="button"
                    className="btn btn-t dt-borrar"
                    aria-label={bloqueado ? `${m.name} tiene ${suyas.length} ${plural(suyas.length, 'tarea', 'tareas')}: reasígnalas primero para eliminarlo` : `Eliminar a ${m.name}`}
                    title={bloqueado ? `Tiene ${suyas.length} ${plural(suyas.length, 'tarea', 'tareas')}: reasígnalas primero` : `Eliminar a ${m.name}`}
                    disabled={bloqueado}
                    onClick={() => eliminar(m, i)}
                  >
                    <Icono nombre="basura" tam={15} />
                  </button>
                  {bloqueado && <span className="dt-motivo" aria-hidden="true">Tiene {suyas.length} {plural(suyas.length, 'tarea', 'tareas')}</span>}
                </div>
              </td>
            </tr>
          )
        })}
        {borrador && (
          <tr className="dt-fila dt-f-integrante dt-borrador" onBlur={alSalirDeFila}>
            <td>
              <div className="dt-nombre">
                <Avatar nombre={borrador.nombre || '?'} indice={members.length} />
                <input
                  className="cel"
                  type="text"
                  autoFocus
                  placeholder="Nombre"
                  aria-label={`Nombre del ${t.integrante.toLowerCase()} nuevo`}
                  aria-invalid={errores.nombre ? true : undefined}
                  aria-describedby={errores.nombre ? 'borrador-nombre-error' : undefined}
                  value={borrador.nombre}
                  onChange={(e) => { setBorrador({ ...borrador, nombre: e.target.value }); setErrores((x) => ({ ...x, nombre: undefined })) }}
                  onKeyDown={alTeclaBorrador}
                />
              </div>
            </td>
            <td data-et="Horas disponibles">
              <input
                className="cel num"
                type="text"
                inputMode="decimal"
                placeholder="Horas"
                aria-label={`Horas del ${t.integrante.toLowerCase()} nuevo`}
                aria-invalid={errores.horas ? true : undefined}
                aria-describedby={errores.horas ? 'borrador-horas-error' : undefined}
                value={borrador.horas}
                onChange={(e) => { setBorrador({ ...borrador, horas: e.target.value }); setErrores((x) => ({ ...x, horas: undefined })) }}
                onKeyDown={alTeclaBorrador}
              />
            </td>
            <td className="num dt-cuenta" data-et="Tareas">0</td>
            <td data-et="Carga">
              <div className="dt-acciones">
                <button type="button" className="btn btn-p" onClick={() => confirmarBorrador(true)}>Agregar</button>
                <button type="button" className="btn btn-s" onClick={cerrarBorrador}>Cancelar</button>
              </div>
              {(errores.nombre || errores.horas) && (
                <div role="alert">
                  {errores.nombre && <p className="dt-error dt-error-fila" id="borrador-nombre-error">{errores.nombre}</p>}
                  {errores.horas && <p className="dt-error dt-error-fila" id="borrador-horas-error">{errores.horas}</p>}
                </div>
              )}
            </td>
          </tr>
        )}
      </BaseDeDatos>
    </Pagina>
  )
}
