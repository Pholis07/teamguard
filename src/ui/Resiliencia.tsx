import { useMemo, useState } from 'react'
import type { RuleContext } from '../domain'
import { Etiqueta, Icono } from './bloques'
import { horas, miembroPorId, plural } from './formato'
import { Avatar } from './IntegrantesVista'
import { resiliencia } from './resiliencia'

/** «¿Y si alguien falta?»: descubre quién es imprescindible antes de que pase. Solo calcula. */
export function Resiliencia({ contexto }: { contexto: RuleContext }) {
  const [visible, setVisible] = useState(false)
  const filas = useMemo(() => (visible ? resiliencia(contexto) : []), [visible, contexto])
  const { members } = contexto
  const nombre = (id: string) => miembroPorId(members, id)?.name ?? id
  const fragiles = filas.filter((f) => f.imposibles.length > 0)

  return (
    <section className="n-bd" aria-labelledby="h-resiliencia">
      <h2 id="h-resiliencia" className="n-bd-tit">Prueba de resiliencia</h2>
      {!visible ? (
        <div className="p-acciones">
          <button type="button" className="btn btn-s" onClick={() => setVisible(true)}>
            <Icono nombre="escudo" />¿Y si alguien falta?
          </button>
        </div>
      ) : (
        <div aria-live="polite">
          <p className="p-estado">
            {fragiles.length === 0 ? 'Tu equipo aguanta la ausencia de cualquiera.' : `Punto frágil: ${fragiles.map((f) => nombre(f.memberId)).join(' y ')}.`}{' '}
            <span className="fa">Simulamos que cada quien falta desde hoy hasta la última entrega. Nada cambia.</span>
          </p>
          <ul className="r-lista">
            {[...filas].sort((a, b) => a.sinCobertura - b.sinCobertura).map((f) => (
              <li key={f.memberId} className="r-fila">
                <span className="p-persona">
                  <Avatar nombre={nombre(f.memberId)} indice={members.findIndex((m) => m.id === f.memberId)} />
                  <span>Si falta <b>{nombre(f.memberId)}</b></span>
                </span>
                {!f.afectaTareas ? (
                  <span className="fa">No afecta: no tiene tareas abiertas en esas fechas.</span>
                ) : (
                  <span className="r-detalle">
                    <span className="num">Equilibrio {f.sinCobertura} → {f.conCobertura}</span>
                    {f.cubre.length > 0 && <span className="fa">{f.cubre.map((c) => `${nombre(c.quien)} cubre ${c.tarea}`).join(' · ')}</span>}
                    {f.imposibles.length > 0
                      ? <Etiqueta color="rojo">Nadie puede cubrir {f.imposibles.map((t) => `${t.title} (${horas(t.estimatedHours)} h)`).join(', ')}</Etiqueta>
                      : <Etiqueta color="verde">Se cubre {plural(f.cubre.length, 'su tarea', 'sus tareas')}</Etiqueta>}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
