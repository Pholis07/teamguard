import './grafica.css'

type Punto = { etiqueta: string; detalle: string; valor: number }

const ANCHO = 560, ALTO = 132, IZQ = 28, DER = 28, ARRIBA = 22, ABAJO = 26

/** Línea del índice de equilibrio (0–100) a lo largo de las decisiones; una sola serie, sin leyenda. */
export function GraficaEquilibrio({ puntos }: { puntos: readonly Punto[] }) {
  if (puntos.length < 2) return null
  const x = (i: number) => IZQ + (i * (ANCHO - IZQ - DER)) / (puntos.length - 1)
  const y = (v: number) => ARRIBA + ((100 - v) * (ALTO - ARRIBA - ABAJO)) / 100
  const minimo = puntos.reduce((m, p, i) => (p.valor < puntos[m].valor ? i : m), 0)
  // Etiquetas de valor solo en inicio, mínimo y final (no un número en cada punto).
  const rotulados = new Set([0, minimo, puntos.length - 1])
  const resumen = puntos.map((p) => `${p.valor} en ${p.etiqueta === 'Inicio' ? 'el inicio' : `${p.etiqueta} (${p.detalle})`}`).join('; ')

  return (
    <svg className="g-eq" viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label={`Equilibrio en el tiempo: ${resumen}.`}>
      <line className="g-ref" x1={IZQ} x2={ANCHO - DER} y1={y(100)} y2={y(100)} />
      <text className="g-ref-t" x={ANCHO - DER} y={y(100) - 6} textAnchor="end">100 · todo cabe</text>
      <line className="g-base" x1={IZQ} x2={ANCHO - DER} y1={y(0)} y2={y(0)} />
      <polyline className="g-linea" points={puntos.map((p, i) => `${x(i)},${y(p.valor)}`).join(' ')} />
      {puntos.map((p, i) => (
        <g key={i} className="g-punto">
          <title>{`${p.etiqueta} · equilibrio ${p.valor}/100 — ${p.detalle}`}</title>
          <circle className="g-hit" cx={x(i)} cy={y(p.valor)} r={14} />
          <circle className="g-marca" cx={x(i)} cy={y(p.valor)} r={4} />
          {rotulados.has(i) && (
            <text className="g-valor" x={x(i)} y={y(p.valor) + (p.valor > 85 ? 18 : -10)} textAnchor="middle">{p.valor}</text>
          )}
          <text className="g-eje" x={x(i)} y={ALTO - 6} textAnchor="middle">{p.etiqueta}</text>
        </g>
      ))}
    </svg>
  )
}
