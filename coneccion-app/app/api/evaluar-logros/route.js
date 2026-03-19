import { createClient } from '@/lib/supabase/server'
import { LOGROS } from '@/lib/logros-definicion'

/**
 * POST /api/evaluar-logros
 * Evalúa todos los logros del usuario autenticado y otorga los nuevos.
 * Returns { logrosNuevos: [...] } con los logros recién desbloqueados.
 */
export async function POST(req) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

  const userId = user.id

  // ── Obtener perfil para saber el rol ──────────────────────────────────────
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol_principal')
    .eq('id', userId)
    .maybeSingle()

  const rol = perfil?.rol_principal || 'padre'

  // ── Logros que ya tiene el usuario ────────────────────────────────────────
  const { data: logrosExistentes } = await supabase
    .from('logros_usuario')
    .select('logro_id')
    .eq('usuario_id', userId)

  const yaObtenidos = new Set((logrosExistentes || []).map(l => l.logro_id))

  // ── Filtrar logros aplicables a este rol que aún no tiene ─────────────────
  const logrosEvaluar = LOGROS.filter(l => l.rol === rol && !yaObtenidos.has(l.id))
  if (logrosEvaluar.length === 0) return Response.json({ logrosNuevos: [] })

  // ── Recopilar estadísticas del usuario ────────────────────────────────────
  const stats = await obtenerEstadisticas(supabase, userId, rol)

  // ── Evaluar cada logro ───────────────────────────────────────────────────
  const logrosNuevosIds = []
  for (const logro of logrosEvaluar) {
    if (evaluarCriterio(logro.criterio, stats)) {
      logrosNuevosIds.push(logro.id)
    }
  }

  if (logrosNuevosIds.length === 0) return Response.json({ logrosNuevos: [] })

  // ── Insertar logros nuevos ────────────────────────────────────────────────
  await supabase.from('logros_usuario').insert(
    logrosNuevosIds.map(id => ({ usuario_id: userId, logro_id: id }))
  )

  const logrosNuevos = LOGROS.filter(l => logrosNuevosIds.includes(l.id))
  return Response.json({ logrosNuevos })
}

// ─────────────────────────────────────────────────────────────────────────────
// Obtener todas las estadísticas necesarias para la evaluación
// ─────────────────────────────────────────────────────────────────────────────

async function obtenerEstadisticas(supabase, userId, rol) {
  const tipoRegistro = { terapeuta: 'terapia', maestra_sombra: 'escuela', padre: 'casa' }[rol]

  // Todos los registros del usuario (del tipo correspondiente a su rol)
  const { data: registros } = await supabase
    .from('registros_diarios')
    .select('id, fecha, tipo_registro, notas, logros, desafios, metricas, nino_id, created_at')
    .eq('creado_por', userId)
    .order('fecha', { ascending: true })

  const registrosPropios = registros || []
  const registrosTipo = registrosPropios.filter(r => r.tipo_registro === tipoRegistro)

  // Reacciones dadas por el usuario
  const { data: reacciones } = await supabase
    .from('registro_reacciones')
    .select('id')
    .eq('usuario_id', userId)

  // Mensajes enviados (para padres)
  const { data: mensajes } = await supabase
    .from('mensajes')
    .select('id')
    .eq('autor_id', userId)

  // Metas (para padres)
  const { data: metas } = await supabase
    .from('metas')
    .select('id, estado, creado_por')
    .eq('creado_por', userId)

  // Equipo terapéutico (para padres)
  const { data: ninosPadre } = rol === 'padre'
    ? await supabase.from('ninos').select('id').eq('padre_id', userId)
    : { data: [] }

  let equipoCompleto = false
  let miembrosEquipo = 0

  if (rol === 'padre' && ninosPadre?.length > 0) {
    const ninoId = ninosPadre[0].id
    const { data: equipo } = await supabase
      .from('equipo_terapeutico')
      .select('rol')
      .eq('nino_id', ninoId)
      .neq('usuario_id', userId)

    miembrosEquipo = (equipo || []).length
    const roles = (equipo || []).map(e => e.rol)
    equipoCompleto = roles.includes('terapeuta') && roles.includes('maestra_sombra')
  }

  // Alertas (para terapeutas)
  const { data: alertas } = await supabase
    .from('mensajes')
    .select('id')
    .eq('autor_id', userId)
    .eq('tipo', 'alerta')

  // Niños distintos con registros del tipo propio
  const ninosDistintos = [...new Set(registrosTipo.map(r => r.nino_id))].length

  // Racha máxima de registros del tipo propio (por fecha)
  const rachaMax = calcularRachaMaxima(registrosTipo)

  // Semanas consecutivas con mínimo N registros del tipo propio
  // Calculado en tiempo de evaluación de criterio para mayor flexibilidad

  // Meses distintos con al menos 1 registro del tipo propio
  const mesesActivos = contarMesesDistintos(registrosTipo)

  // Registros con notas del tipo propio (notas > 100 chars)
  const registrosConNotas = registrosTipo.filter(
    r => r.notas && r.notas.length >= 50
  ).length

  // Registros con métricas completas del tipo propio
  const registrosMetricasCompletas = registrosTipo.filter(r => {
    const m = r.metricas || {}
    return (
      m.regulacion?.inicio != null &&
      m.regulacion?.fin != null &&
      m.nivel_apoyo_general != null &&
      m.comunicacion?.iniciativa != null &&
      m.social?.interaccion != null
    )
  }).length

  // Registros tempranos (antes de las 9am)
  const registrosTemprano = registrosTipo.filter(r => {
    const h = new Date(r.created_at).getHours()
    return h < 9
  }).length

  return {
    registrosTipo,
    totalRegistrosTipo: registrosTipo.length,
    totalReacciones: (reacciones || []).length,
    totalMensajes: (mensajes || []).length,
    totalAlertas: (alertas || []).length,
    totalMetas: (metas || []).length,
    totalMetasLogradas: (metas || []).filter(m => m.estado === 'lograda').length,
    miembrosEquipo,
    equipoCompleto,
    ninosDistintos,
    rachaMax,
    mesesActivos,
    registrosConNotas,
    registrosMetricasCompletas,
    registrosTemprano,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluar un criterio dado las estadísticas
// ─────────────────────────────────────────────────────────────────────────────

function evaluarCriterio(criterio, stats) {
  switch (criterio.tipo) {
    case 'total_registros':
      return stats.totalRegistrosTipo >= criterio.minimo

    case 'racha_registros':
      return stats.rachaMax >= criterio.minimo

    case 'semanas_consecutivas':
      return calcularSemanasConsecutivas(stats.registrosTipo, criterio.sesiones_por_semana) >= criterio.semanas

    case 'meses_activos':
      return stats.mesesActivos >= criterio.minimo

    case 'total_reacciones':
      return stats.totalReacciones >= criterio.minimo

    case 'total_mensajes':
      return stats.totalMensajes >= criterio.minimo

    case 'alertas_enviadas':
      return stats.totalAlertas >= criterio.minimo

    case 'ninos_distintos':
      return stats.ninosDistintos >= criterio.minimo

    case 'miembros_equipo':
      return stats.miembrosEquipo >= criterio.minimo

    case 'equipo_completo':
      return stats.equipoCompleto

    case 'total_metas_creadas':
      return stats.totalMetas >= criterio.minimo

    case 'total_metas_logradas':
      return stats.totalMetasLogradas >= criterio.minimo

    case 'registros_con_notas':
      return stats.registrosConNotas >= criterio.minimo

    case 'registros_metricas_completas':
      return stats.registrosMetricasCompletas >= criterio.minimo

    case 'registros_temprano':
      return stats.registrosTemprano >= criterio.minimo

    default:
      return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Racha máxima de registros consecutivos (sin más de 7 días de brecha entre ellos) */
function calcularRachaMaxima(registros) {
  if (!registros.length) return 0
  // Ordenar por fecha, eliminar duplicados de fecha
  const fechas = [...new Set(registros.map(r => r.fecha))].sort()
  let maxRacha = 1, racha = 1
  for (let i = 1; i < fechas.length; i++) {
    const prev = new Date(fechas[i - 1])
    const curr = new Date(fechas[i])
    const diff = (curr - prev) / (1000 * 60 * 60 * 24)
    if (diff <= 7) { // tolerancia de 1 semana entre registros
      racha++
      maxRacha = Math.max(maxRacha, racha)
    } else {
      racha = 1
    }
  }
  return maxRacha
}

/** Número de semanas ISO consecutivas (máximo) donde hay >= minSesiones registros */
function calcularSemanasConsecutivas(registros, minSesiones) {
  if (!registros.length) return 0

  // Agrupar por semana ISO (año-semana)
  const porSemana = {}
  for (const r of registros) {
    const key = getISOWeekKey(new Date(r.fecha))
    porSemana[key] = (porSemana[key] || 0) + 1
  }

  // Semanas que cumplen el mínimo, ordenadas cronológicamente
  const semanasCalificadas = Object.keys(porSemana)
    .filter(k => porSemana[k] >= minSesiones)
    .sort()

  if (!semanasCalificadas.length) return 0

  let maxRacha = 1, racha = 1
  for (let i = 1; i < semanasCalificadas.length; i++) {
    if (sonSemanasConsecutivas(semanasCalificadas[i - 1], semanasCalificadas[i])) {
      racha++
      maxRacha = Math.max(maxRacha, racha)
    } else {
      racha = 1
    }
  }
  return maxRacha
}

/** Retorna "YYYY-WW" de una fecha */
function getISOWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-${String(week).padStart(2, '0')}`
}

/** Verifica si dos claves "YYYY-WW" son semanas consecutivas */
function sonSemanasConsecutivas(a, b) {
  const [ay, aw] = a.split('-').map(Number)
  const [by, bw] = b.split('-').map(Number)
  if (ay === by) return bw === aw + 1
  if (by === ay + 1) {
    // Primera semana del año siguiente puede ser semana 1
    const semanasEnAy = semanasEnAno(ay)
    return aw === semanasEnAy && bw === 1
  }
  return false
}

/** Número de semanas ISO en un año */
function semanasEnAno(year) {
  const d = new Date(year, 11, 31)
  const week = getISOWeekKey(d)
  const w = parseInt(week.split('-')[1])
  return w === 1 ? 52 : w
}

/** Meses distintos con al menos 1 registro */
function contarMesesDistintos(registros) {
  const meses = new Set(registros.map(r => r.fecha.substring(0, 7))) // "YYYY-MM"
  return meses.size
}
