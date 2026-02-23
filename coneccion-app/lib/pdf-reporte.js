import jsPDF from 'jspdf'
import 'jspdf-autotable'

/**
 * Genera y descarga el PDF del reporte semanal
 * @param {object} opts
 * @param {string} opts.nombreNino
 * @param {object} opts.kpis         - KPIs del periodo (regulacion, comunicacion, etc.)
 * @param {Array}  opts.datos        - datosFiltrados del periodo
 * @param {Array}  opts.serieAgrupada
 * @param {string} opts.analisisIA   - Texto del análisis IA (opcional)
 * @param {string} opts.periodoLabel - "última semana", "último mes", etc.
 */
export function descargarReportePDF({ nombreNino, kpis, datos, serieAgrupada, analisisIA, periodoLabel }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const AZUL  = [79, 70, 229]   // indigo-600
  const GRIS  = [100, 116, 139] // slate-500
  const VERDE = [34, 197, 94]
  const ROJO  = [239, 68, 68]

  const fmt = v => (v !== null && v !== undefined ? v.toFixed(2) : '—')
  const tendStr = t => (t > 0 ? '↑ mejorando' : t < 0 ? '↓ bajando' : '→ estable')

  // ── Encabezado ────────────────────────────────────────────────────────────
  doc.setFillColor(...AZUL)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Reporte de Progreso', 14, 13)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`${nombreNino}  ·  ${periodoLabel}`, 14, 21)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}`, 196, 21, { align: 'right' })

  // ── KPIs ──────────────────────────────────────────────────────────────────
  doc.setTextColor(...AZUL)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Métricas del periodo', 14, 38)

  const kpiRows = [
    ['Regulación emocional',  fmt(kpis.regulacion?.val),  tendStr(kpis.regulacion?.tend)],
    ['Comunicación',          fmt(kpis.comunicacion?.val), tendStr(kpis.comunicacion?.tend)],
    ['Habilidades sociales',  fmt(kpis.social?.val),       tendStr(kpis.social?.tend)],
    ['Académico / cognitivo', fmt(kpis.academico?.val),    tendStr(kpis.academico?.tend)],
    ['Habilidades motoras',   fmt(kpis.motora?.val),       tendStr(kpis.motora?.tend)],
    ['Autonomía',             fmt(kpis.autonomia?.val),    tendStr(kpis.autonomia?.tend)],
  ]

  doc.autoTable({
    startY: 42,
    head: [['Área', 'Promedio (1–5)', 'Tendencia']],
    body: kpiRows,
    headStyles: { fillColor: AZUL, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      1: { halign: 'center' },
      2: {
        halign: 'center',
        fontStyle: 'italic',
      },
    },
    didParseCell(data) {
      if (data.column.index === 2 && data.section === 'body') {
        const v = data.cell.raw
        if (v.startsWith('↑')) data.cell.styles.textColor = VERDE
        else if (v.startsWith('↓')) data.cell.styles.textColor = ROJO
        else data.cell.styles.textColor = GRIS
      }
    },
  })

  // ── Conducta ─────────────────────────────────────────────────────────────
  const y1 = doc.lastAutoTable.finalY + 8
  doc.setTextColor(...AZUL)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Conducta', 14, y1)

  const conductaTotal = datos.filter(d => d.conducta_freq > 0).length
  const pct = datos.length ? Math.round((conductaTotal / datos.length) * 100) : 0
  const conductaAvg = datos.length
    ? (datos.reduce((s, d) => s + (d.conducta_freq ?? 0), 0) / datos.length).toFixed(2)
    : '—'

  doc.autoTable({
    startY: y1 + 4,
    head: [['Indicador', 'Valor']],
    body: [
      ['Días con conductas disruptivas', `${conductaTotal} de ${datos.length} (${pct}%)`],
      ['Frecuencia promedio', `${conductaAvg} (0=nunca, 3=frecuente)`],
    ],
    headStyles: { fillColor: AZUL, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
  })

  // ── Evolución semanal ─────────────────────────────────────────────────────
  if (serieAgrupada?.length) {
    const y2 = doc.lastAutoTable.finalY + 8
    doc.setTextColor(...AZUL)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Evolución por periodo', 14, y2)

    doc.autoTable({
      startY: y2 + 4,
      head: [['Periodo', 'Regulación', 'Comunicación', 'Social', 'Académico', 'Conducta']],
      body: serieAgrupada.map(s => [
        s.label,
        fmt(s.regulacion_fin),
        fmt(s.comunicacion),
        fmt(s.social),
        fmt(s.academico),
        fmt(s.conducta_freq),
      ]),
      headStyles: { fillColor: AZUL, textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
    })
  }

  // ── Análisis IA ───────────────────────────────────────────────────────────
  if (analisisIA?.trim()) {
    const y3 = doc.lastAutoTable.finalY + 8
    // Nueva página si queda poco espacio
    if (y3 > 240) doc.addPage()
    const yAI = y3 > 240 ? 14 : y3

    doc.setTextColor(...AZUL)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Análisis IA', 14, yAI)

    doc.setTextColor(30, 30, 30)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(analisisIA, 182)
    doc.text(lines, 14, yAI + 6)
  }

  // ── Pie de página ─────────────────────────────────────────────────────────
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(...GRIS)
    doc.text(`Conección App · ${nombreNino} · Página ${i} de ${total}`, 105, 292, { align: 'center' })
  }

  const fecha = new Date().toISOString().split('T')[0]
  doc.save(`reporte-${nombreNino.replace(/\s+/g, '-').toLowerCase()}-${fecha}.pdf`)
}