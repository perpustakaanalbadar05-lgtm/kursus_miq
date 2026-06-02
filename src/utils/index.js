import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function generateNomorRegistrasi() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 9000) + 1000
  return `MIQ-${year}${month}${day}-${random}`
}

export function generateNomorSertifikat(year, sequence) {
  return `MIQ/${year}/${String(sequence).padStart(4, '0')}`
}

export function generateVerificationCode() {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase()
}

export function getStatusBadgeClass(status) {
  const map = {
    'Belum Bayar': 'badge-unpaid',
    'Menunggu Validasi': 'badge-pending',
    'Valid': 'badge-valid',
    'Ditolak': 'badge-rejected',
  }
  return map[status] || 'badge-unpaid'
}

export function exportToCSV(data, filename) {
  if (!data.length) return
  const keys = Object.keys(data[0])
  const csv = [
    keys.join(','),
    ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
