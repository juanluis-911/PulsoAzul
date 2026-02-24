import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utilidad para combinar clases de Tailwind
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Formatear fecha en español
export function formatearFecha(fecha) {
  const [year, month, day] = fecha.split('-')
  return new Date(year, month - 1, day).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Formatear fecha corta
export function formatearFechaCorta(fecha) {
  return new Date(fecha).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// Obtener saludo según hora del día
export function obtenerSaludo() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// Mapeo de estados de ánimo a emojis y colores
export const ESTADOS_ANIMO = {
  muy_bien: {
    label: 'Muy bien',
    emoji: '😊',
    color: 'text-green-600 bg-green-50',
    bgColor: 'bg-green-100',
  },
  bien: {
    label: 'Bien',
    emoji: '🙂',
    color: 'text-blue-600 bg-blue-50',
    bgColor: 'bg-blue-100',
  },
  regular: {
    label: 'Regular',
    emoji: '😐',
    color: 'text-yellow-600 bg-yellow-50',
    bgColor: 'bg-yellow-100',
  },
  dificil: {
    label: 'Difícil',
    emoji: '😕',
    color: 'text-orange-600 bg-orange-50',
    bgColor: 'bg-orange-100',
  },
  muy_dificil: {
    label: 'Muy difícil',
    emoji: '😢',
    color: 'text-red-600 bg-red-50',
    bgColor: 'bg-red-100',
  },
}

// Mapeo de roles
export const ROLES = {
  padre: {
    label: 'Padre/Madre',
    color: 'text-purple-600 bg-purple-50',
  },
  maestra_sombra: {
    label: 'Maestra Sombra',
    color: 'text-blue-600 bg-blue-50',
  },
  terapeuta: {
    label: 'Terapeuta',
    color: 'text-green-600 bg-green-50',
  },
}

// Calcular edad a partir de fecha de nacimiento
export function calcularEdad(fechaNacimiento) {
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }
  
  return edad
}

// Validar email
export function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}
