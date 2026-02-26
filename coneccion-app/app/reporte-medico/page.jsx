'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Download, Share2 } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Helpers ────────────────────────────────────────────────────────────────
const avg = arr => {
  const v = arr.filter(x => x != null)
  return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : null
}

const edad = dob => {
  const d = new Date(dob), n = new Date()
  let y = n.getFullYear() - d.getFullYear()
  if (n.getMonth() - d.getMonth() < 0 || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) y--
  return y
}

const fmtDate = iso => {
  const [y, mo, d] = iso.split('-')
  return `${d}/${mo}/${y}`
}

const nivelLabel = v => {
  if (v == null) return '—'
  if (v >= 4.5) return 'Muy alto'
  if (v >= 3.5) return 'Alto'
  if (v >= 2.5) return 'Moderado'
  if (v >= 1.5) return 'Bajo'
  return 'Muy bajo'
}

// ── Sub-componentes ────────────────────────────────────────────────────────
function MiniBar({ value, max = 5, color = '#3b82f6' }) {
  const pct = value ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full" />
      </div>
      <span className="text-xs text-slate-400 w-6 text-right">{value ?? '—'}</span>
    </div>
  )
}

function Badge({ color, label }) {
  const colors = {
    blue:   'bg-blue-100 text-blue-700',
    green:  'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    gray:   'bg-slate-100 text-slate-600',
  }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[color] || colors.gray}`}>{label}</span>
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="flex-1 h-px bg-slate-100 block" />
        {title}
        <span className="flex-1 h-px bg-slate-100 block" />
      </h3>
      {children}
    </div>
  )
}

// ── Componente del reporte generado ────────────────────────────────────────
function Reporte({ nino, equipo, registros, periodo }) {
  const totalReg = registros.length
  const porTipo = { escuela: 0, terapia: 0, casa: 0 }
  registros.forEach(r => { if (porTipo[r.tipo_registro] !== undefined) porTipo[r.tipo_registro]++ })

  const get = (r, path) => path.split('.').reduce((o, k) => o?.[k], r.metricas)

  const promedios = {
    reg_inicio:   avg(registros.map(r => get(r, 'regulacion.inicio'))),
    reg_fin:      avg(registros.map(r => get(r, 'regulacion.fin'))),
    comunicacion: avg(registros.map(r => avg([get(r, 'comunicacion.iniciativa'), get(r, 'comunicacion.claridad')]))),
    social:       avg(registros.map(r => avg([get(r, 'social.interaccion'), get(r, 'social.turnos')]))),
    academico:    avg(registros.map(r => avg([get(r, 'academico.atencion'), get(r, 'academico.persistencia')]))),
    motora:       avg(registros.map(r => avg([get(r, 'motora.fina'), get(r, 'motora.gruesa')]))),
    autonomia:    avg(registros.map(r => avg([get(r, 'autonomia.higiene'), get(r, 'autonomia.alimentacion')]))),
    conducta:     avg(registros.map(r => get(r, 'conducta.frecuencia_disruptiva'))),
    apoyo:        avg(registros.map(r => get(r, 'nivel_apoyo_general'))),
  }

  const notasRele = registros.filter(r => r.notas).slice(0, 4)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-5 text-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-primary-200 text-xs font-medium uppercase tracking-wider mb-1">Reporte Clínico de Seguimiento</p>
            <h1 className="text-2xl font-bold">{nino.nombre} {nino.apellido}</h1>
            <p className="text-primary-100 text-sm mt-0.5">{edad(nino.fecha_nacimiento)} años · {nino.diagnostico}</p>
          </div>
          <div className="text-right text-primary-100 text-xs">
            <p>Generado el</p>
            <p className="font-semibold text-white">{fmtDate(today)}</p>
            <p className="mt-1">Período</p>
            <p className="font-semibold text-white">Últimos {periodo} días</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <Section title="Datos del paciente">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-0.5">Fecha de nacimiento</p>
              <p className="font-medium text-slate-700">{fmtDate(nino.fecha_nacimiento)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-0.5">Diagnóstico</p>
              <p className="font-medium text-slate-700">{nino.diagnostico || '—'}</p>
            </div>
            {nino.notas_adicionales && (
              <div className="col-span-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-amber-700 text-xs font-medium mb-0.5">Consideraciones importantes</p>
                <p className="text-amber-900 text-sm">{nino.notas_adicionales}</p>
              </div>
            )}
          </div>
        </Section>

        <Section title="Resumen del período">
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-blue-600">{totalReg}</p>
              <p className="text-slate-500 text-xs mt-0.5">Registros totales</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-green-600">{porTipo.terapia}</p>
              <p className="text-slate-500 text-xs mt-0.5">Sesiones terapia</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-purple-600">{porTipo.escuela + porTipo.casa}</p>
              <p className="text-slate-500 text-xs mt-0.5">Registros cotidianos</p>
            </div>
          </div>
        </Section>

        <Section title="Áreas de desarrollo (promedios)">
          <div className="space-y-3">
            {[
              { label: 'Regulación emocional — inicio del día', val: promedios.reg_inicio,  color: '#3b82f6' },
              { label: 'Regulación emocional — cierre del día', val: promedios.reg_fin,      color: '#22c55e' },
              { label: 'Comunicación y lenguaje',               val: promedios.comunicacion, color: '#8b5cf6' },
              { label: 'Habilidades sociales',                  val: promedios.social,        color: '#f59e0b' },
              { label: 'Desempeño académico',                   val: promedios.academico,     color: '#06b6d4' },
              { label: 'Motricidad (fina y gruesa)',            val: promedios.motora,        color: '#ec4899' },
              { label: 'Autonomía',                             val: promedios.autonomia,     color: '#10b981' },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{label}</span>
                  <Badge color="gray" label={nivelLabel(val)} />
                </div>
                <MiniBar value={val} color={color} />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">Escala 1–5 · Promedio sobre {totalReg} registros</p>
        </Section>

        <Section title="Conducta y nivel de apoyo">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="border border-slate-100 rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-1">Frecuencia de conductas disruptivas</p>
              <p className="font-bold text-lg text-slate-700">{promedios.conducta ?? '—'}<span className="text-xs text-slate-400 font-normal"> /3</span></p>
              <p className="text-xs text-slate-500">
                {promedios.conducta == null ? '—' :
                 promedios.conducta <= 0.5 ? 'Sin conductas registradas' :
                 promedios.conducta <= 1.5 ? 'Conductas ocasionales' : 'Conductas frecuentes'}
              </p>
            </div>
            <div className="border border-slate-100 rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-1">Nivel de apoyo requerido</p>
              <p className="font-bold text-lg text-slate-700">{promedios.apoyo ?? '—'}<span className="text-xs text-slate-400 font-normal"> /4</span></p>
              <p className="text-xs text-slate-500">
                {promedios.apoyo == null ? '—' :
                 promedios.apoyo <= 1 ? 'Mayormente independiente' :
                 promedios.apoyo <= 2.5 ? 'Apoyo verbal ocasional' : 'Apoyo físico frecuente'}
              </p>
            </div>
          </div>
        </Section>

        <Section title="Equipo terapéutico">
          <div className="space-y-2">
            {equipo.map((m, i) => {
              const rolLabel = { padre: 'Padre/Madre', maestra_sombra: 'Maestra Sombra', terapeuta: 'Terapeuta' }[m.rol] || m.rol
              const nombre = m.perfiles?.nombre_completo || '—'
              return (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {nombre.charAt(0)}
                  </div>
                  <span className="font-medium text-slate-700">{nombre}</span>
                  <span className="text-slate-400 text-xs">{rolLabel}</span>
                </div>
              )
            })}
          </div>
        </Section>

        {notasRele.length > 0 && (
          <Section title="Observaciones del equipo">
            <div className="space-y-2">
              {notasRele.map((r, i) => (
                <div key={i} className="border-l-2 border-primary-200 pl-3 py-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-slate-400">{fmtDate(r.fecha)}</span>
                    <Badge color={r.tipo_registro === 'terapia' ? 'purple' : r.tipo_registro === 'casa' ? 'green' : 'blue'} label={r.tipo_registro} />
                  </div>
                  <p className="text-sm text-slate-600">{r.notas}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
          <p>Reporte generado por <strong className="text-slate-500">Pulso Azul</strong> · Plataforma de seguimiento terapéutico</p>
          <p className="mt-0.5">Este documento es de uso clínico y está basado en registros del equipo terapéutico</p>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────
export default function ReporteMedicoPage() {
  const supabase = createClient()

  const [ninos, setNinos]               = useState([])
  const [ninoId, setNinoId]             = useState('')
  const [periodo, setPeriodo]           = useState('30')
  const [loading, setLoading]           = useState(false)
  const [loadingNinos, setLoadingNinos] = useState(true)
  const [reporte, setReporte]           = useState(null)
  const [error, setError]               = useState(null)

  const descargarPDF = async () => {
    if (!reporte) return
    const { nino, equipo, registros } = reporte
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()
    const azul = [2, 132, 199]
    const gris = [100, 116, 139]
    const negro = [30, 41, 59]

    // Cargar logo como base64
    let logoBase64 = null
    try {
      const res = await fetch('/pulsoAzulLogo.png')
      const blob = await res.blob()
      logoBase64 = await new Promise(resolve => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(blob)
      })
    } catch { /* si falla, se omite el logo */ }

    // Header
    doc.setFillColor(...azul)
    doc.rect(0, 0, W, 42, 'F')

    // Logo en el header (esquina derecha)
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', W - 58, 2, 44, 44, undefined, 'FAST')
    }

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text('REPORTE CLÍNICO DE SEGUIMIENTO', 14, 10)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(`${nino.nombre} ${nino.apellido}`, 14, 21)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`${edad(nino.fecha_nacimiento)} años  ·  ${nino.diagnostico || '—'}`, 14, 29)
    doc.text(`Generado: ${fmtDate(new Date().toISOString().split('T')[0])}  ·  Período: últimos ${periodo} días`, 14, 36)

    let y = 50

    // Datos del paciente
    doc.setTextColor(...negro)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('DATOS DEL PACIENTE', 14, y)
    y += 5
    doc.setDrawColor(226, 232, 240)
    doc.line(14, y, W - 14, y)
    y += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...gris)
    doc.text('Fecha de nacimiento:', 14, y)
    doc.setTextColor(...negro)
    doc.text(fmtDate(nino.fecha_nacimiento), 55, y)
    if (nino.notas_adicionales) {
      y += 5
      doc.setTextColor(...gris)
      doc.text('Consideraciones:', 14, y)
      doc.setTextColor(...negro)
      const lines = doc.splitTextToSize(nino.notas_adicionales, W - 70)
      doc.text(lines, 55, y)
      y += lines.length * 4.5
    }
    y += 8

    // Resumen del período
    const porTipo = { escuela: 0, terapia: 0, casa: 0 }
    registros.forEach(r => { if (porTipo[r.tipo_registro] !== undefined) porTipo[r.tipo_registro]++ })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...negro)
    doc.text('RESUMEN DEL PERÍODO', 14, y)
    y += 5
    doc.setDrawColor(226, 232, 240)
    doc.line(14, y, W - 14, y)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [['Total registros', 'Sesiones de terapia', 'Registros cotidianos']],
      body: [[registros.length, porTipo.terapia, porTipo.escuela + porTipo.casa]],
      styles: { fontSize: 10, halign: 'center', cellPadding: 3 },
      headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 8

    // Áreas de desarrollo
    const get = (r, path) => path.split('.').reduce((o, k) => o?.[k], r.metricas)
    const promedios = {
      'Regulación emocional — inicio': avg(registros.map(r => get(r, 'regulacion.inicio'))),
      'Regulación emocional — cierre': avg(registros.map(r => get(r, 'regulacion.fin'))),
      'Comunicación y lenguaje':       avg(registros.map(r => avg([get(r, 'comunicacion.iniciativa'), get(r, 'comunicacion.claridad')]))),
      'Habilidades sociales':          avg(registros.map(r => avg([get(r, 'social.interaccion'), get(r, 'social.turnos')]))),
      'Desempeño académico':           avg(registros.map(r => avg([get(r, 'academico.atencion'), get(r, 'academico.persistencia')]))),
      'Motricidad':                    avg(registros.map(r => avg([get(r, 'motora.fina'), get(r, 'motora.gruesa')]))),
      'Autonomía':                     avg(registros.map(r => avg([get(r, 'autonomia.higiene'), get(r, 'autonomia.alimentacion')]))),
      'Conducta disruptiva (frec.)':   avg(registros.map(r => get(r, 'conducta.frecuencia_disruptiva'))),
      'Nivel de apoyo requerido':      avg(registros.map(r => get(r, 'nivel_apoyo_general'))),
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...negro)
    doc.text('ÁREAS DE DESARROLLO', 14, y)
    y += 5
    doc.setDrawColor(226, 232, 240)
    doc.line(14, y, W - 14, y)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [['Área', 'Promedio', 'Escala', 'Nivel']],
      body: Object.entries(promedios).map(([area, val]) => {
        const escala = area.includes('apoyo') ? '0–4' : area.includes('Conducta') ? '0–3' : '1–5'
        return [area, val ?? '—', escala, nivelLabel(val)]
      }),
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 8

    // Equipo terapéutico
    if (equipo.length > 0) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...negro)
      doc.text('EQUIPO TERAPÉUTICO', 14, y)
      y += 5
      doc.setDrawColor(226, 232, 240)
      doc.line(14, y, W - 14, y)
      y += 3

      const rolLabel = r => ({ padre: 'Padre/Madre', maestra_sombra: 'Maestra Sombra', terapeuta: 'Terapeuta' }[r] || r)
      autoTable(doc, {
        startY: y,
        head: [['Nombre', 'Rol']],
        body: equipo.map(m => [m.perfiles?.nombre_completo || '—', rolLabel(m.rol)]),
        styles: { fontSize: 9, cellPadding: 2.5 },
        headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 14, right: 14 },
      })
      y = doc.lastAutoTable.finalY + 8
    }

    // Observaciones
    const notasRele = registros.filter(r => r.notas).slice(0, 5)
    if (notasRele.length > 0) {
      if (y > 220) { doc.addPage(); y = 20 }
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...negro)
      doc.text('OBSERVACIONES DEL EQUIPO', 14, y)
      y += 5
      doc.setDrawColor(226, 232, 240)
      doc.line(14, y, W - 14, y)
      y += 3

      autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Contexto', 'Observación']],
        body: notasRele.map(r => [fmtDate(r.fecha), r.tipo_registro, r.notas]),
        styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
        headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 22 }, 2: { cellWidth: 'auto' } },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 14, right: 14 },
      })
    }

    // Footer en cada página
    const pages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i)
      doc.setDrawColor(226, 232, 240)
      doc.line(14, 284, W - 14, 284)
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 14, 284, 22, 22, undefined, 'FAST')
      }
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.text('Plataforma de seguimiento terapéutico', logoBase64 ? 38 : 14, 290)
      doc.setTextColor(2, 132, 199)
      doc.textWithLink('www.PulsoAzul.com', logoBase64 ? 38 : 14, 295, { url: 'https://www.PulsoAzul.com' })
      doc.setTextColor(148, 163, 184)
      doc.text(`Página ${i} de ${pages}`, W - 14, 293, { align: 'right' })
    }

    const nombreArchivo = `reporte-${nino.nombre.toLowerCase()}-${nino.apellido.toLowerCase()}.pdf`
    doc.save(nombreArchivo)
  }

  const compartirPDF = async () => {
    if (!reporte) return
    const { nino, equipo, registros } = reporte

    // Reutilizamos toda la lógica de generación — función interna
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()
    const azul = [2, 132, 199]
    const gris = [100, 116, 139]
    const negro = [30, 41, 59]

    let logoBase64 = null
    try {
      const res = await fetch('/pulsoAzulLogo.png')
      const blob = await res.blob()
      logoBase64 = await new Promise(resolve => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(blob)
      })
    } catch { /* se omite logo si falla */ }

    doc.setFillColor(...azul)
    doc.rect(0, 0, W, 42, 'F')
    if (logoBase64) doc.addImage(logoBase64, 'PNG', W - 58, 2, 44, 44, undefined, 'FAST')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text('REPORTE CLÍNICO DE SEGUIMIENTO', 14, 10)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(`${nino.nombre} ${nino.apellido}`, 14, 21)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`${edad(nino.fecha_nacimiento)} años  ·  ${nino.diagnostico || '—'}`, 14, 29)
    doc.text(`Generado: ${fmtDate(new Date().toISOString().split('T')[0])}  ·  Período: últimos ${periodo} días`, 14, 36)

    let y = 50
    const porTipo = { escuela: 0, terapia: 0, casa: 0 }
    registros.forEach(r => { if (porTipo[r.tipo_registro] !== undefined) porTipo[r.tipo_registro]++ })

    doc.setTextColor(...negro); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text('DATOS DEL PACIENTE', 14, y); y += 5
    doc.setDrawColor(226, 232, 240); doc.line(14, y, W - 14, y); y += 5
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.setTextColor(...gris); doc.text('Fecha de nacimiento:', 14, y)
    doc.setTextColor(...negro); doc.text(fmtDate(nino.fecha_nacimiento), 55, y)
    if (nino.notas_adicionales) {
      y += 5
      doc.setTextColor(...gris); doc.text('Consideraciones:', 14, y)
      doc.setTextColor(...negro)
      const lines = doc.splitTextToSize(nino.notas_adicionales, W - 70)
      doc.text(lines, 55, y); y += lines.length * 4.5
    }
    y += 8

    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
    doc.text('RESUMEN DEL PERÍODO', 14, y); y += 5
    doc.setDrawColor(226, 232, 240); doc.line(14, y, W - 14, y); y += 3
    autoTable(doc, {
      startY: y,
      head: [['Total registros', 'Sesiones de terapia', 'Registros cotidianos']],
      body: [[registros.length, porTipo.terapia, porTipo.escuela + porTipo.casa]],
      styles: { fontSize: 10, halign: 'center', cellPadding: 3 },
      headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 8

    const get = (r, path) => path.split('.').reduce((o, k) => o?.[k], r.metricas)
    const promedios = {
      'Regulación emocional — inicio': avg(registros.map(r => get(r, 'regulacion.inicio'))),
      'Regulación emocional — cierre': avg(registros.map(r => get(r, 'regulacion.fin'))),
      'Comunicación y lenguaje':       avg(registros.map(r => avg([get(r, 'comunicacion.iniciativa'), get(r, 'comunicacion.claridad')]))),
      'Habilidades sociales':          avg(registros.map(r => avg([get(r, 'social.interaccion'), get(r, 'social.turnos')]))),
      'Desempeño académico':           avg(registros.map(r => avg([get(r, 'academico.atencion'), get(r, 'academico.persistencia')]))),
      'Motricidad':                    avg(registros.map(r => avg([get(r, 'motora.fina'), get(r, 'motora.gruesa')]))),
      'Autonomía':                     avg(registros.map(r => avg([get(r, 'autonomia.higiene'), get(r, 'autonomia.alimentacion')]))),
      'Conducta disruptiva (frec.)':   avg(registros.map(r => get(r, 'conducta.frecuencia_disruptiva'))),
      'Nivel de apoyo requerido':      avg(registros.map(r => get(r, 'nivel_apoyo_general'))),
    }

    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
    doc.text('ÁREAS DE DESARROLLO', 14, y); y += 5
    doc.setDrawColor(226, 232, 240); doc.line(14, y, W - 14, y); y += 3
    autoTable(doc, {
      startY: y,
      head: [['Área', 'Promedio', 'Escala', 'Nivel']],
      body: Object.entries(promedios).map(([area, val]) => {
        const escala = area.includes('apoyo') ? '0–4' : area.includes('Conducta') ? '0–3' : '1–5'
        return [area, val ?? '—', escala, nivelLabel(val)]
      }),
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 8

    if (equipo.length > 0) {
      const rolLabel = r => ({ padre: 'Padre/Madre', maestra_sombra: 'Maestra Sombra', terapeuta: 'Terapeuta' }[r] || r)
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
      doc.text('EQUIPO TERAPÉUTICO', 14, y); y += 5
      doc.setDrawColor(226, 232, 240); doc.line(14, y, W - 14, y); y += 3
      autoTable(doc, {
        startY: y,
        head: [['Nombre', 'Rol']],
        body: equipo.map(m => [m.perfiles?.nombre_completo || '—', rolLabel(m.rol)]),
        styles: { fontSize: 9, cellPadding: 2.5 },
        headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 14, right: 14 },
      })
      y = doc.lastAutoTable.finalY + 8
    }

    const notasRele = registros.filter(r => r.notas).slice(0, 5)
    if (notasRele.length > 0) {
      if (y > 220) { doc.addPage(); y = 20 }
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
      doc.text('OBSERVACIONES DEL EQUIPO', 14, y); y += 5
      doc.setDrawColor(226, 232, 240); doc.line(14, y, W - 14, y); y += 3
      autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Contexto', 'Observación']],
        body: notasRele.map(r => [fmtDate(r.fecha), r.tipo_registro, r.notas]),
        styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
        headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 22 }, 2: { cellWidth: 'auto' } },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 14, right: 14 },
      })
    }

    const pages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i)
      doc.setDrawColor(226, 232, 240); doc.line(14, 284, W - 14, 284)
      if (logoBase64) doc.addImage(logoBase64, 'PNG', 14, 284, 22, 22, undefined, 'FAST')
      doc.setFontSize(7); doc.setTextColor(148, 163, 184)
      doc.text('Plataforma de seguimiento terapéutico', logoBase64 ? 38 : 14, 290)
      doc.setTextColor(2, 132, 199)
      doc.textWithLink('www.PulsoAzul.com', logoBase64 ? 38 : 14, 295, { url: 'https://www.PulsoAzul.com' })
      doc.setTextColor(148, 163, 184)
      doc.text(`Página ${i} de ${pages}`, W - 14, 293, { align: 'right' })
    }

    const nombreArchivo = `reporte-${nino.nombre.toLowerCase()}-${nino.apellido.toLowerCase()}.pdf`
    const pdfBlob = doc.output('blob')
    const pdfFile = new File([pdfBlob], nombreArchivo, { type: 'application/pdf' })

    // Intentar Web Share API con archivo
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          title: `Reporte de ${nino.nombre} ${nino.apellido}`,
          text: `Reporte clínico de seguimiento de ${nino.nombre} generado por Pulso Azul.`,
          files: [pdfFile],
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Si falla por razón distinta a que el usuario canceló, descargamos
          doc.save(nombreArchivo)
        }
      }
    } else {
      // Fallback: descarga directa
      doc.save(nombreArchivo)
    }
  }

  useEffect(() => {
    async function cargarNinos() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('ninos')
        .select('id, nombre, apellido, fecha_nacimiento, diagnostico, notas_adicionales, padre_id')
        .order('nombre')

      const { data: equipoData } = await supabase
        .from('equipo_terapeutico')
        .select('nino_id, ninos(id, nombre, apellido, fecha_nacimiento, diagnostico, notas_adicionales)')
        .eq('usuario_id', user.id)

      const ninosEquipo = equipoData?.map(e => e.ninos).filter(Boolean) || []
      const todosNinos = [...(data || []), ...ninosEquipo]
      const unicos = Array.from(new Map(todosNinos.map(n => [n.id, n])).values())
      setNinos(unicos)
      if (unicos.length > 0) setNinoId(unicos[0].id)
      setLoadingNinos(false)
    }
    cargarNinos()
  }, [])

  async function generarReporte() {
    if (!ninoId) return
    setLoading(true)
    setError(null)

    try {
      const desde = new Date()
      desde.setDate(desde.getDate() - parseInt(periodo))
      const desdeISO = desde.toISOString().split('T')[0]

      const { data: nino } = await supabase
        .from('ninos')
        .select('*')
        .eq('id', ninoId)
        .single()

      const { data: equipoRaw } = await supabase
        .from('equipo_terapeutico')
        .select('usuario_id, rol')
        .eq('nino_id', ninoId)

      const equipoIds = (equipoRaw || []).map(m => m.usuario_id)
      const { data: perfilesEquipo } = equipoIds.length
        ? await supabase.from('perfiles').select('id, nombre_completo').in('id', equipoIds)
        : { data: [] }

      const equipo = (equipoRaw || []).map(m => ({
        ...m,
        perfiles: perfilesEquipo?.find(p => p.id === m.usuario_id) ?? null,
      }))

      const { data: registros } = await supabase
        .from('registros_diarios')
        .select('fecha, tipo_registro, estado_animo, notas, metricas')
        .eq('nino_id', ninoId)
        .gte('fecha', desdeISO)
        .order('fecha', { ascending: false })

      setReporte({ nino, equipo: equipo || [], registros: registros || [] })
    } catch (err) {
      setError('Ocurrió un error al generar el reporte. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Reporte para Médicos</h1>
            <p className="text-sm text-slate-500">Genera un resumen clínico para compartir con el médico</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Niño</label>
              {loadingNinos ? (
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              ) : (
                <select
                  value={ninoId}
                  onChange={e => { setNinoId(e.target.value); setReporte(null) }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                >
                  {ninos.map(n => (
                    <option key={n.id} value={n.id}>{n.nombre} {n.apellido}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Período</label>
              <select
                value={periodo}
                onChange={e => { setPeriodo(e.target.value); setReporte(null) }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
              >
                <option value="7">Últimos 7 días</option>
                <option value="15">Últimos 15 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="60">Últimos 60 días</option>
                <option value="90">Últimos 3 meses</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            onClick={generarReporte}
            disabled={loading || !ninoId || loadingNinos}
            className="mt-4 w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400
                       text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generar reporte
              </>
            )}
          </button>
        </div>

        {reporte && (
          <>
            <div className="flex justify-end gap-2 mb-3">
              <button
                onClick={compartirPDF}
                className="text-sm bg-white border border-slate-200 hover:bg-slate-50 text-slate-700
                                 px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                <Share2 className="w-4 h-4" />
                Compartir
              </button>
              <button
                onClick={descargarPDF}
                className="text-sm bg-primary-600 hover:bg-primary-700 text-white
                           px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </button>
            </div>

            <Reporte
              nino={reporte.nino}
              equipo={reporte.equipo}
              registros={reporte.registros}
              periodo={periodo}
            />
          </>
        )}

      </div>
    </div>
  )
}