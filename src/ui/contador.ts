import { useEffect, useRef, useState } from 'react'

/** Número que cuenta hasta `meta` con requestAnimationFrame; con movimiento reducido salta directo. */
export function useContador(meta: number, ms = 900) {
  const quieto = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [v, setV] = useState(quieto ? meta : 0)
  const actual = useRef(quieto ? meta : 0)
  useEffect(() => {
    if (quieto) { actual.current = meta; return }
    const desde = actual.current
    if (desde === meta) return
    const t0 = performance.now()
    let id = 0
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      actual.current = desde + (meta - desde) * (1 - Math.pow(1 - p, 3))
      setV(Math.round(actual.current))
      if (p < 1) id = requestAnimationFrame(paso)
    }
    id = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(id)
  }, [meta, ms, quieto])
  return quieto ? meta : v
}
