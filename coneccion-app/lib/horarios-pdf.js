import jsPDF from 'jspdf'
import { CATEGORY_COLORS, imageUrlToBase64 } from './pecs-pdf'

// ── Tamaños de papel (mm) ──────────────────────────────────────────────────
const PAPER_FORMATS = {
  carta:    [215.9, 279.4],
  oficio:   [215.9, 355.6],
  tabloide: [279.4, 431.8],
}

// ── Tamaños de pictograma (mm) ─────────────────────────────────────────────
const PICTO_SIZES = {
  '3x3': { w: 30, h: 30 },
  '5x5': { w: 50, h: 50 },
  '8x8': { w: 80, h: 80 },
}

const MARGIN = 12
const GAP = 4
const LABEL_H = 7
const TIME_COL_W = 20  // Columna de hora en layout lista

/**
 * Genera y descarga un PDF con el horario visual.
 *
 * @param {object}  opts
 * @param {Array}   opts.actividades  - [{ label, category, hora, base64 }]
 * @param {string}  opts.nombre       - Nombre del horario (título en el PDF)
 * @param {string}  opts.layout       - 'lista' | 'tira'
 * @param {string}  opts.paperSize    - 'carta' | 'oficio' | 'tabloide'
 * @param {string}  opts.pictoSize    - '3x3' | '5x5' | '8x8'
 * @param {boolean} opts.showLabel    - Mostrar etiqueta bajo cada pictograma
 * @param {boolean} opts.mostrarHoras - Incluir columna/fila de horas
 */
export function generarHorarioPDF({
  actividades,
  nombre = 'Horario Visual',
  layout = 'lista',
  paperSize = 'carta',
  pictoSize = '5x5',
  showLabel = true,
  mostrarHoras = false,
}) {
  const size = PICTO_SIZES[pictoSize] || PICTO_SIZES['5x5']
  const cellH = size.h + (showLabel ? LABEL_H : 0)

  const isLandscape = layout === 'tira'
  let [pageW, pageH] = PAPER_FORMATS[paperSize] || PAPER_FORMATS.carta
  if (isLandscape) [pageW, pageH] = [pageH, pageW]

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageW, pageH],
  })

  // ── Título ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 30, 30)
  doc.text(nombre, MARGIN, MARGIN + 6)

  const startY = MARGIN + 14

  if (layout === 'lista') {
    // ── Layout LISTA VERTICAL ─────────────────────────────────────────────
    const timeColW = mostrarHoras ? TIME_COL_W : 0
    let y = startY

    actividades.forEach((act, i) => {
      // Salto de página
      if (y + cellH > pageH - MARGIN) {
        doc.addPage()
        y = MARGIN
      }

      // Número de orden
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text(String(i + 1), MARGIN + 2, y + size.h / 2 + 2)

      const x = MARGIN + 8 + timeColW

      // Hora (si corresponde)
      if (mostrarHoras && act.hora) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 200)
        doc.text(act.hora, MARGIN + 8, y + size.h / 2 + 2)
      }

      // Borde de categoría
      const color = CATEGORY_COLORS[act.category] || CATEGORY_COLORS.custom
      doc.setDrawColor(...color)
      doc.setLineWidth(1.2)
      doc.rect(x, y, size.w, size.h)

      // Imagen
      if (act.base64) {
        try {
          const format = act.base64.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
          doc.addImage(act.base64, format, x + 1, y + 1, size.w - 2, size.h - 2)
        } catch {
          doc.setFillColor(240, 240, 240)
          doc.rect(x + 1, y + 1, size.w - 2, size.h - 2, 'F')
        }
      } else {
        doc.setFillColor(240, 240, 240)
        doc.rect(x + 1, y + 1, size.w - 2, size.h - 2, 'F')
      }

      // Etiqueta
      if (showLabel) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(Math.max(6, Math.min(10, size.w / 5)))
        doc.setTextColor(30, 30, 30)
        const lines = doc.splitTextToSize(act.label || '', size.w - 2)
        doc.text(lines[0], x + size.w / 2, y + size.h + LABEL_H - 2, { align: 'center' })
      }

      y += cellH + GAP
    })

  } else {
    // ── Layout TIRA HORIZONTAL ─────────────────────────────────────────────
    const usableW = pageW - MARGIN * 2
    const cols = Math.max(1, Math.floor((usableW + GAP) / (size.w + GAP)))

    let col = 0
    let x = MARGIN
    let y = startY

    actividades.forEach((act, i) => {
      if (y + cellH > pageH - MARGIN) {
        doc.addPage()
        col = 0
        x = MARGIN
        y = MARGIN
      }

      // Número de orden (pequeño, arriba izquierda de la celda)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text(String(i + 1), x + 1, y + 4)

      // Borde de categoría
      const color = CATEGORY_COLORS[act.category] || CATEGORY_COLORS.custom
      doc.setDrawColor(...color)
      doc.setLineWidth(1.2)
      doc.rect(x, y, size.w, size.h)

      // Imagen
      if (act.base64) {
        try {
          const format = act.base64.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
          doc.addImage(act.base64, format, x + 1, y + 1, size.w - 2, size.h - 2)
        } catch {
          doc.setFillColor(240, 240, 240)
          doc.rect(x + 1, y + 1, size.w - 2, size.h - 2, 'F')
        }
      } else {
        doc.setFillColor(240, 240, 240)
        doc.rect(x + 1, y + 1, size.w - 2, size.h - 2, 'F')
      }

      // Etiqueta
      if (showLabel) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(Math.max(6, Math.min(10, size.w / 5)))
        doc.setTextColor(30, 30, 30)
        const lines = doc.splitTextToSize(act.label || '', size.w - 2)
        doc.text(lines[0], x + size.w / 2, y + size.h + LABEL_H - 2, { align: 'center' })
      }

      // Hora debajo del label (solo tira)
      if (mostrarHoras && act.hora) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(80, 80, 200)
        doc.text(act.hora, x + size.w / 2, y + size.h + LABEL_H + 3, { align: 'center' })
      }

      // Avanzar posición
      col++
      if (col >= cols) {
        col = 0
        x = MARGIN
        y += cellH + GAP + (mostrarHoras ? 5 : 0)
      } else {
        x += size.w + GAP
      }
    })
  }

  const fecha = new Date().toISOString().split('T')[0]
  doc.save(`horario-visual-${fecha}.pdf`)
}

export { imageUrlToBase64 }
