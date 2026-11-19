import { createContext, useContext } from 'react'

/* Versiones del producto: solo cambian los textos. La lógica (equilibrio, cobertura, ZIP) es la misma. */
export type Version = 'estudiantes' | 'empresas'
export const VERSIONES: readonly { id: Version; label: string }[] = [
  { id: 'estudiantes', label: 'Estudiantes' },
  { id: 'empresas', label: 'Empresas' },
]

export type Textos = {
  /** Nombre del proyecto de ejemplo y el que se ve en la vista previa de la landing. */
  ejemplo: string
  vistaPrevia: string
  placeholder: string
  /** Vocabulario. */
  integrantes: string
  integrante: string
  integrantesMin: string
  nuevoIntegrante: string
  /** Etiquetas de página que cambian (el resto usa PAGINAS). */
  pagina: { integrantes: string }
  /** App. */
  lema: string
  bienvenida: string
  ayudaCarga: string
  agregaIntegrantes: string
  vacioIntegrantes: string
  vacioTareas: string
  primeroIntegrantes: string
  cargaEquipo: string
  /** Landing. */
  eyebrow: string
  /** Variante corta del eyebrow para pantallas angostas. */
  eyebrowCorto: string
  titulo: { antes: string; capsula: string; despues: string; gris: string }
  /** Qué muestra la vista previa del héroe como protagonista. */
  foco: 'aporte' | 'equilibrio'
  sub: string
  aporte: { t: string; p: string }
  cobertura: { t: string; p: string }
  entrega: { t: string; p: string }
  equilibrio: { t: string; p: string }
  acta: { t: string; p: string }
  eventos: readonly { i: 'ausencia' | 'integrantes' | 'tablero' | 'check' | 'entrega' | 'simular' | 'candado' | 'persona'; t: string; al?: boolean }[]
  lista: readonly (readonly [string, string])[]
  banda: { t: string; p1: string; p2: string }
  listaTitulo: string
  /** Frase corta bajo el título de «Lo que hace TeamGuard». */
  listaSub: string
}

const ESTUDIANTES: Textos = {
  ejemplo: 'Proyecto final (ejemplo)',
  vistaPrevia: 'Proyecto final de Diseño',
  placeholder: 'Proyecto final de Diseño',
  integrantes: 'Integrantes',
  integrante: 'Integrante',
  integrantesMin: 'integrantes',
  nuevoIntegrante: 'Nuevo integrante',
  pagina: { integrantes: 'Integrantes' },
  lema: 'El trabajo es de todos. La responsabilidad también.',
  bienvenida: 'Aquí verás quién carga cuánto trabajo y si alguien se pasa de su disponibilidad. Empieza con tres pasos.',
  ayudaCarga: 'Es la suma de horas de tus tareas abiertas frente a las horas que tienes disponibles. Al 100 % vas justo; arriba de eso hay sobrecarga y conviene repartir distinto.',
  agregaIntegrantes: 'Agrega integrantes',
  vacioIntegrantes: 'Agrega a las personas del equipo y cuántas horas pueden dar hasta la entrega.',
  vacioTareas: 'Crea la primera tarea para ver cómo se reparte la carga del equipo.',
  primeroIntegrantes: 'Para crear tareas primero agrega a quienes las harán.',
  cargaEquipo: 'Carga del equipo',
  eyebrow: 'Hecho para equipos de proyecto escolar',
  eyebrowCorto: 'Para proyectos escolares',
  titulo: { antes: 'Que', capsula: 'nadie', despues: 'cargue', gris: 'con todo el proyecto.' },
  foco: 'aporte',
  sub: 'Ve cuánto aporta cada integrante, recibe avisos de sobrecarga, cubre ausencias con una propuesta y entrega un ZIP. Siempre decide una persona.',
  aporte: { t: 'Ve quién hace cuánto', p: 'La parte de cada integrante, a la vista. Si alguien se ausenta, el reparto cambia y el equilibrio te lo dice.' },
  cobertura: { t: 'Si alguien se enferma', p: 'Si un compañero falta, ves una propuesta de reparto, antes y después, para aprobarla o cambiarla.' },
  entrega: { t: 'Fechas y ZIP para el profesor', p: 'Cada tarea tiene su fecha de entrega y los archivos de cada integrante se reúnen en un solo ZIP, tal como se subieron.' },
  equilibrio: { t: '', p: '' },
  acta: { t: '', p: '' },
  eventos: [
    { i: 'ausencia', t: 'Ana se enferma', al: true },
    { i: 'integrantes', t: 'Luis cubre Boceto' },
    { i: 'tablero', t: 'Equilibrio 57 → 100' },
    { i: 'check', t: 'Sol entregó Resumen' },
    { i: 'entrega', t: 'ZIP listo para el profesor' },
    { i: 'simular', t: 'Simulación sin riesgo' },
    { i: 'candado', t: 'El motivo de una ausencia no se guarda' },
    { i: 'persona', t: 'Decide una persona' },
  ],
  lista: [
    ['Quién hace cuánto.', ' Cada integrante ve cuántas horas tiene asignadas frente a las que tiene disponibles, y su parte del trabajo.'],
    ['Si alguien se enferma.', ' TeamGuard propone quién cubre; la decisión es de una persona del equipo.'],
    ['Fechas claras.', ' Cada tarea tiene su fecha y se ve cuáles están vencidas.'],
    ['ZIP para el profesor.', ' La entrega reúne lo que cada integrante subió, sin cambiarlo.'],
  ],
  banda: {
    t: 'Nadie se queda con todo el trabajo.',
    p1: 'Un sistema puede detectar que alguien va a rebasar su carga y sugerir cómo repartirla. Lo que no debe hacer es decidirlo solo. Por eso cada propuesta de TeamGuard espera la aprobación de una persona del equipo.',
    p2: 'El motivo de una ausencia nunca se guarda; todo vive en esta pestaña.',
  },
  listaTitulo: 'Lo que hace TeamGuard',
  listaSub: 'TeamGuard calcula, propone y deja el registro. La decisión siempre la toma una persona.',
}

const EMPRESAS: Textos = {
  ejemplo: 'Campaña Q4 (ejemplo)',
  vistaPrevia: 'Campaña Q4',
  placeholder: 'Lanzamiento campaña Q4',
  integrantes: 'Colaboradores',
  integrante: 'Colaborador',
  integrantesMin: 'colaboradores',
  nuevoIntegrante: 'Nuevo colaborador',
  pagina: { integrantes: 'Colaboradores' },
  lema: 'El trabajo es de todos. La responsabilidad también.',
  bienvenida: 'Aquí verás quién carga cuánto trabajo y si algún colaborador rebasa su disponibilidad. Empieza con tres pasos.',
  ayudaCarga: 'Es la suma de horas de las tareas abiertas de cada colaborador frente a las horas que tiene disponibles. Al 100 % va justo; arriba de eso hay sobrecarga y conviene repartir distinto.',
  agregaIntegrantes: 'Agrega colaboradores',
  vacioIntegrantes: 'Agrega a los colaboradores del equipo y cuántas horas pueden dar hasta el entregable.',
  vacioTareas: 'Crea la primera tarea para ver cómo se reparte la carga del equipo.',
  primeroIntegrantes: 'Para crear tareas primero agrega a los colaboradores que las harán.',
  cargaEquipo: 'Carga del equipo',
  eyebrow: 'Hecho para equipos de trabajo',
  eyebrowCorto: 'Para equipos de trabajo',
  titulo: { antes: 'Reparte según la', capsula: 'capacidad', despues: 'real', gris: 'de cada colaborador.' },
  foco: 'equilibrio',
  sub: 'Compara las horas asignadas con el tiempo real de cada colaborador, avisa antes de una sobrecarga y propone quién cubre. Aprueba el responsable.',
  aporte: { t: '', p: '' },
  cobertura: { t: 'Cobertura con aprobación', p: 'Si un colaborador falta, el responsable del área ve una propuesta de reparto, antes y después, para aprobarla o cambiarla.' },
  entrega: { t: 'Entregable en un ZIP', p: 'Los archivos de cada colaborador se reúnen en un solo paquete, tal como se subieron.' },
  equilibrio: { t: 'Índice de equilibrio', p: 'Cuántas de las horas asignadas caben en el tiempo real de cada responsable, en una sola cifra. Cae cuando alguien se ausenta y se recupera al cubrir.' },
  acta: { t: 'Bitácora y acta', p: 'Cada cambio de responsable queda con su hora y con el equilibrio de antes y después, y viaja en el acta del ZIP.' },
  eventos: [
    { i: 'ausencia', t: 'Ana se ausenta', al: true },
    { i: 'integrantes', t: 'Luis cubre Boceto' },
    { i: 'tablero', t: 'Equilibrio 57 → 100' },
    { i: 'check', t: 'Sol entregó Resumen' },
    { i: 'entrega', t: 'Acta con la bitácora' },
    { i: 'simular', t: 'Simulación sin riesgo' },
    { i: 'candado', t: 'El motivo de una ausencia no se guarda' },
    { i: 'persona', t: 'Aprueba el responsable' },
  ],
  lista: [
    ['Capacidad real.', ' El equilibrio compara las horas asignadas con el tiempo disponible de cada colaborador.'],
    ['Simulación sin riesgo.', ' Prueba un cambio de tareas y revisa su efecto antes de aplicarlo.'],
    ['Cobertura con aprobación.', ' Si alguien falta, TeamGuard propone quién cubre; la decisión es del responsable del área.'],
    ['Bitácora y acta.', ' Cada cambio de responsable queda registrado y el entregable reúne los archivos originales en un ZIP.'],
  ],
  banda: {
    t: 'Nadie se queda con todo el trabajo.',
    p1: 'Un sistema puede detectar que alguien va a rebasar su carga y sugerir cómo repartirla. Lo que no debe hacer es decidirlo solo. Por eso cada propuesta de TeamGuard espera la aprobación de una persona, el responsable del área.',
    p2: 'El motivo de una ausencia nunca se guarda; todo vive en esta pestaña.',
  },
  listaTitulo: 'Lo que hace TeamGuard',
  listaSub: 'TeamGuard calcula, propone y deja el registro. La decisión siempre la toma una persona.',
}

export const TEXTOS: Record<Version, Textos> = { estudiantes: ESTUDIANTES, empresas: EMPRESAS }

/** Acento sugerido mientras la persona no elija uno. */
export const ACENTO_SUGERIDO = { estudiantes: 'violeta', empresas: 'azul' } as const

export const VersionContext = createContext<Version>('estudiantes')
export const useVersion = () => useContext(VersionContext)
export const useTextos = (): Textos => TEXTOS[useContext(VersionContext)]

/** Rutas de la landing por hash: #/estudiantes y #/empresas. */
export const versionDeHash = (hash: string): Version | null => (hash === '#/estudiantes' ? 'estudiantes' : hash === '#/empresas' ? 'empresas' : null)
export const irAVersion = (v: Version) => {
  window.location.hash = `/${v}`
}

const CLAVE_VERSION = 'tg-version'
export function versionGuardada(): Version {
  try {
    const v = localStorage.getItem(CLAVE_VERSION)
    return v === 'empresas' ? 'empresas' : 'estudiantes'
  } catch {
    return 'estudiantes'
  }
}
export function guardarVersion(v: Version) {
  document.documentElement.dataset.version = v
  try {
    localStorage.setItem(CLAVE_VERSION, v)
  } catch {
    // Sin almacenamiento: la versión solo dura esta sesión.
  }
}
