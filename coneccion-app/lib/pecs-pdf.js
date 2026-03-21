import jsPDF from 'jspdf'

// ── Colores por categoría (RGB) ────────────────────────────────────────────
export const CATEGORY_COLORS = {
  alimentacion: [59, 130, 246],   // azul
  tiempo_libre: [34, 197, 94],    // verde
  educativo:    [239, 68, 68],    // rojo
  autonomia:    [168, 85, 247],   // morado
  social:       [234, 179, 8],    // amarillo
  atributos:    [71, 85, 105],    // gris oscuro
  custom:       [156, 163, 175],  // gris claro
}

// ── Tamaños de papel (mm) ──────────────────────────────────────────────────
const PAPER_FORMATS = {
  carta:    [215.9, 279.4],
  oficio:   [215.9, 355.6],
  tabloide: [279.4, 431.8],
}

// ── Tamaños de pictograma (mm) ─────────────────────────────────────────────
const PICTO_SIZES = {
  '3x3':   { w: 30, h: 30 },
  '3x4':   { w: 30, h: 40 },
  '5x5':   { w: 50, h: 50 },
  '8x10':  { w: 80, h: 100 },
  '8x8.5': { w: 80, h: 85 },
}

const MARGIN = 10
const LABEL_HEIGHT = 8
const GAP = 3

/**
 * Descarga una imagen como base64 a través del proxy interno.
 * Solo funciona en el cliente (browser).
 */
export async function imageUrlToBase64(imageUrl) {
  const proxyUrl = `/api/pecs/image?url=${encodeURIComponent(imageUrl)}`
  const res = await fetch(proxyUrl)
  if (!res.ok) return null
  const blob = await res.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(blob)
  })
}

/**
 * Genera y descarga un PDF con los pictogramas seleccionados.
 * @param {object}  opts
 * @param {Array}   opts.pictograms  - [{ id, label, category, base64, imageUrl }]
 * @param {string}  opts.paperSize   - 'carta' | 'oficio' | 'tabloide'
 * @param {string}  opts.pictoSize   - '3x3' | '3x4' | '5x5' | '8x10' | '8x8.5'
 * @param {boolean} opts.showBorder  - Mostrar borde de color por categoría
 * @param {boolean} opts.showLabel   - Mostrar etiqueta de texto
 * @param {string}  opts.fileName    - Nombre base del archivo
 */
export function generarPECSPDF({
  pictograms,
  paperSize = 'carta',
  pictoSize = '5x5',
  showBorder = true,
  showLabel = true,
  fileName = 'pecs',
}) {
  const [pageW, pageH] = PAPER_FORMATS[paperSize] || PAPER_FORMATS.carta
  const size = PICTO_SIZES[pictoSize] || PICTO_SIZES['5x5']
  const cellH = size.h + (showLabel ? LABEL_HEIGHT : 0)

  const doc = new jsPDF({
    orientation: pageW > pageH ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageW, pageH],
  })

  const usableW = pageW - MARGIN * 2
  const cols = Math.max(1, Math.floor((usableW + GAP) / (size.w + GAP)))

  let col = 0
  let x = MARGIN
  let y = MARGIN

  pictograms.forEach((picto) => {
    // Salto de página
    if (y + cellH > pageH - MARGIN) {
      doc.addPage()
      col = 0
      x = MARGIN
      y = MARGIN
    }

    // Borde de categoría
    if (showBorder) {
      const color = CATEGORY_COLORS[picto.category] || CATEGORY_COLORS.custom
      doc.setDrawColor(...color)
      doc.setLineWidth(1)
      doc.rect(x, y, size.w, size.h)
    }

    // Imagen
    if (picto.base64) {
      try {
        // Detectar formato desde el data URI
        const format = picto.base64.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
        doc.addImage(picto.base64, format, x + 1, y + 1, size.w - 2, size.h - 2)
      } catch {
        // Placeholder gris si la imagen falla
        doc.setFillColor(240, 240, 240)
        doc.rect(x + 1, y + 1, size.w - 2, size.h - 2, 'F')
      }
    } else {
      doc.setFillColor(240, 240, 240)
      doc.rect(x + 1, y + 1, size.w - 2, size.h - 2, 'F')
    }

    // Etiqueta
    if (showLabel) {
      const fontSize = Math.max(6, Math.min(10, size.w / 5))
      doc.setFontSize(fontSize)
      doc.setTextColor(30, 30, 30)
      doc.setFont('helvetica', 'bold')
      const lines = doc.splitTextToSize(picto.label || '', size.w - 2)
      doc.text(lines[0], x + size.w / 2, y + size.h + LABEL_HEIGHT - 2, { align: 'center' })
    }

    // Avanzar posición
    col++
    if (col >= cols) {
      col = 0
      x = MARGIN
      y += cellH + GAP
    } else {
      x += size.w + GAP
    }
  })

  const fecha = new Date().toISOString().split('T')[0]
  doc.save(`${fileName}-${fecha}.pdf`)
}
