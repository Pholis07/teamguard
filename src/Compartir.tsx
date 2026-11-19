import { useMemo, useRef, useState } from 'react'
import qrcode from 'qrcode-generator'
import './compartir.css'

// shortcut: URL fija de producción en Vercel; si cambia el dominio, actualizarla aquí.
const URL_PUBLICA = 'https://teamguard-seven.vercel.app'

/** QR en SVG, oscuro sobre blanco en ambos temas: los lectores fallan con QR invertidos. */
function Qr({ texto }: { texto: string }) {
  const { n, d } = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(texto)
    qr.make()
    const n = qr.getModuleCount()
    let d = ''
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`
    return { n, d }
  }, [texto])
  return (
    <svg className="qr" viewBox={`-3 -3 ${n + 6} ${n + 6}`} shapeRendering="crispEdges" role="img" aria-label={`Código QR de ${texto}`}>
      <rect x={-3} y={-3} width={n + 6} height={n + 6} fill="#FFFFFF" />
      <path d={d} fill="#0B0F14" />
    </svg>
  )
}

export function Compartir() {
  const dialogo = useRef<HTMLDialogElement>(null)
  const [copia, setCopia] = useState<'' | 'ok' | 'error'>('')

  async function copiar() {
    try {
      await navigator.clipboard.writeText(URL_PUBLICA)
      setCopia('ok')
    } catch {
      // Sin HTTPS (p. ej. la IP de la red local) el portapapeles no está disponible.
      setCopia('error')
    }
  }

  return (
    <>
      <button className="btn btn-s" onClick={() => { setCopia(''); dialogo.current?.showModal() }}>
        Abrir en el celular
      </button>
      <dialog
        ref={dialogo}
        className="panel compartir"
        aria-labelledby="h-compartir"
        onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
      >
        <h2 id="h-compartir">Ábrela en tu celular</h2>
        <p className="fa">Escanea el código con la cámara. Usa datos de ejemplo.</p>
        <Qr texto={URL_PUBLICA} />
        <p className="num compartir-url">{URL_PUBLICA.replace('https://', '')}</p>
        {copia === 'error' && <p className="fa" role="alert">No se pudo copiar; escribe la dirección de arriba.</p>}
        <div className="compartir-acciones">
          <button className="btn btn-s" onClick={copiar}>{copia === 'ok' ? 'Enlace copiado' : 'Copiar enlace'}</button>
          <button className="btn btn-p" onClick={() => dialogo.current?.close()}>Cerrar</button>
        </div>
      </dialog>
    </>
  )
}
