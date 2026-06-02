import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'

/**
 * Generate bukti pendaftaran PDF
 */
export async function generateBuktiPendaftaran(peserta) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4

  const { width, height } = page.getSize()

  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

  // Background pattern (header)
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width,
    height: 120,
    color: rgb(0.106, 0.263, 0.196), // miq-700
  })

  // Gold accent line
  page.drawRectangle({
    x: 0,
    y: height - 123,
    width,
    height: 3,
    color: rgb(0.831, 0.627, 0.09),
  })

  // Title
  page.drawText('BUKTI PENDAFTARAN', {
    x: width / 2 - 110,
    y: height - 50,
    size: 22,
    font: timesBold,
    color: rgb(1, 1, 1),
  })

  page.drawText('Kursus Madrasah Ilmu Al Quran', {
    x: width / 2 - 130,
    y: height - 75,
    size: 14,
    font: timesRoman,
    color: rgb(0.961, 0.961, 0.9),
  })

  page.drawText('PP Miftahul Ulum Panyeppen', {
    x: width / 2 - 105,
    y: height - 95,
    size: 12,
    font: timesRoman,
    color: rgb(0.831, 0.627, 0.09),
  })

  // Content area
  let y = height - 160
  const leftX = 60
  const labelWidth = 180
  const valueX = leftX + labelWidth

  const fields = [
    ['No. Registrasi', peserta.nomor_registrasi],
    ['Nama Santri', peserta.nama_santri],
    ['Nama Lembaga', peserta.nama_lembaga],
    ['Asal Pesantren', peserta.asal_pesantren],
    ['Nama Penanggung Jawab', peserta.nama_penanggung_jawab],
    ['Nomor HP Penanggung Jawab', peserta.nomor_penanggung_jawab],
    ['Jenis Kursus', peserta.jenis_kursus],
    ['Kamar', peserta.kamar?.nama_kamar || '-'],
    ['Ruangan', peserta.ruangan?.nama_ruangan || '-'],
    ['Gelombang', peserta.gelombang?.nama || '-'],
    ['Tanggal Pendaftaran', new Date(peserta.created_at).toLocaleDateString('id-ID', { dateStyle: 'full' })],
  ]

  for (const [label, value] of fields) {
    page.drawText(label, {
      x: leftX,
      y,
      size: 11,
      font: timesBold,
      color: rgb(0.106, 0.263, 0.196),
    })
    page.drawText(':', { x: valueX - 15, y, size: 11, font: timesRoman, color: rgb(0.2, 0.2, 0.2) })
    page.drawText(String(value || '-'), {
      x: valueX,
      y,
      size: 11,
      font: timesRoman,
      color: rgb(0.1, 0.1, 0.1),
    })
    // divider line
    page.drawLine({
      start: { x: leftX, y: y - 8 },
      end: { x: width - 60, y: y - 8 },
      thickness: 0.5,
      color: rgb(0.88, 0.92, 0.88),
    })
    y -= 30
  }

  // QR Code
  const verifyUrl = `${window.location.origin}/verify/${peserta.nomor_registrasi}`
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 })
  const qrBase64 = qrDataUrl.split(',')[1]
  const qrBytes = Uint8Array.from(atob(qrBase64), c => c.charCodeAt(0))
  const qrImage = await pdfDoc.embedPng(qrBytes)

  page.drawImage(qrImage, {
    x: width - 160,
    y: y - 20,
    width: 100,
    height: 100,
  })

  page.drawText('Scan untuk verifikasi', {
    x: width - 167,
    y: y - 30,
    size: 8,
    font: timesRoman,
    color: rgb(0.5, 0.5, 0.5),
  })

  // WhatsApp link
  if (peserta.gelombang?.whatsapp_group) {
    y -= 40
    page.drawText('Link Grup WhatsApp:', {
      x: leftX,
      y,
      size: 10,
      font: timesBold,
      color: rgb(0.106, 0.263, 0.196),
    })
    page.drawText(peserta.gelombang.whatsapp_group, {
      x: leftX,
      y: y - 16,
      size: 9,
      font: timesRoman,
      color: rgb(0.08, 0.44, 0.78),
    })
  }

  // Footer
  page.drawRectangle({
    x: 0, y: 0, width, height: 50,
    color: rgb(0.106, 0.263, 0.196),
  })
  page.drawText('Madrasah Ilmu Al Quran — PP Miftahul Ulum Panyeppen', {
    x: 80, y: 22, size: 9,
    font: timesRoman,
    color: rgb(0.831, 0.627, 0.09),
  })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

/**
 * Generate sertifikat PDF
 */
export async function generateSertifikat(peserta, template) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([842, 595]) // Landscape A4

  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

  // If template background image exists
  if (template?.background_url) {
    try {
      const res = await fetch(template.background_url)
      const buf = await res.arrayBuffer()
      const ext = template.background_url.toLowerCase()
      const img = ext.endsWith('.png')
        ? await pdfDoc.embedPng(buf)
        : await pdfDoc.embedJpg(buf)
      page.drawImage(img, { x: 0, y: 0, width: 842, height: 595 })
    } catch (e) {
      console.warn('Background image error', e)
    }
  }

  // Apply field configs from template
  if (template?.field_configs) {
    const vars = {
      '{{nomor_sertifikat}}': peserta.sertifikat?.nomor_sertifikat || '',
      '{{nama_santri}}': peserta.nama_santri || '',
      '{{nama_lembaga}}': peserta.nama_lembaga || '',
      '{{asal_pesantren}}': peserta.asal_pesantren || '',
      '{{jenis_kursus}}': peserta.jenis_kursus || '',
      '{{tanggal}}': new Date().toLocaleDateString('id-ID', { dateStyle: 'long' }),
      '{{tahun}}': new Date().getFullYear().toString(),
    }

    for (const cfg of template.field_configs) {
      const text = vars[cfg.variable] || cfg.variable
      const font = cfg.bold ? timesBold : timesRoman
      const colorHex = cfg.color || '#1b4332'
      const r = parseInt(colorHex.slice(1, 3), 16) / 255
      const g = parseInt(colorHex.slice(3, 5), 16) / 255
      const b = parseInt(colorHex.slice(5, 7), 16) / 255

      page.drawText(text, {
        x: cfg.x,
        y: cfg.y,
        size: cfg.fontSize || 16,
        font,
        color: rgb(r, g, b),
      })
    }
  }

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

export function downloadPdf(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
