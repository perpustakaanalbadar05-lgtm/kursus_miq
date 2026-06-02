import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { BookMarked, Search, Loader2, Upload, X, Check, Clock, AlertCircle, MessageCircle, Download } from 'lucide-react'
import { Button, Input, Alert, Badge } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils'
import { generateBuktiPendaftaran, downloadPdf } from '@/lib/pdf'

const STATUS_CONFIG = {
  'Belum Bayar':        { icon: Clock,        color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200',   label: 'Belum Bayar' },
  'Menunggu Validasi':  { icon: Clock,        color: 'text-amber-500',  bg: 'bg-amber-50 border-amber-200', label: 'Menunggu Validasi' },
  'Valid':              { icon: Check,        color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200', label: 'Pembayaran Valid' },
  'Ditolak':            { icon: AlertCircle, color: 'text-red-500',    bg: 'bg-red-50 border-red-200',      label: 'Pembayaran Ditolak' },
}

function UploadBukti({ pesertaId, onSuccess }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { setError('File max 5MB'); return }
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `payment-proofs/${pesertaId}-${Date.now()}.${ext}`
      const { error: err } = await supabase.storage.from('payment-proofs').upload(path, file, { upsert: true })
      if (err) throw err
      const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(path)
      await supabase.from('pembayaran').update({ bukti_transfer_url: publicUrl, status: 'Menunggu Validasi' }).eq('peserta_id', pesertaId)
      await supabase.from('peserta').update({ status_pembayaran: 'Menunggu Validasi' }).eq('id', pesertaId)
      onSuccess?.()
    } catch (e) {
      setError('Gagal upload: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed border-miq-200 rounded-2xl p-6 text-center cursor-pointer hover:border-miq-400 hover:bg-miq-50 transition-all"
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-xl object-contain" />
            <button onClick={e => { e.stopPropagation(); setFile(null); setPreview(null) }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
              <X size={12} />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-miq-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-miq-700">Klik untuk pilih file</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, PDF • Max 5MB</p>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
      {error && <Alert type="error">{error}</Alert>}
      {file && (
        <Button variant="gold" size="lg" className="w-full" onClick={handleUpload} disabled={uploading}>
          {uploading ? <><Loader2 size={16} className="animate-spin" /> Mengupload...</> : <><Upload size={16} /> Upload Sekarang</>}
        </Button>
      )}
    </div>
  )
}

export default function CekStatusPage() {
  const [nomorReg, setNomorReg] = useState('')
  const [loading, setLoading] = useState(false)
  const [peserta, setPeserta] = useState(null)
  const [pembayaran, setPembayaran] = useState(null)
  const [error, setError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const handleCek = async () => {
    if (!nomorReg.trim()) { setError('Masukkan nomor registrasi'); return }
    setLoading(true)
    setError('')
    setPeserta(null)

    const { data, error: err } = await supabase
      .from('peserta')
      .select('*, kamar(*), ruangan(*), gelombang(*)')
      .eq('nomor_registrasi', nomorReg.trim().toUpperCase())
      .single()

    if (err || !data) {
      setError('Nomor registrasi tidak ditemukan. Periksa kembali nomor Anda.')
      setLoading(false)
      return
    }

    setPeserta(data)

    // Ambil data pembayaran
    const { data: pay } = await supabase
      .from('pembayaran')
      .select('*')
      .eq('peserta_id', data.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    setPembayaran(pay || null)
    setLoading(false)
  }

  const handleDownloadPDF = async () => {
    const bytes = await generateBuktiPendaftaran(peserta)
    downloadPdf(bytes, `bukti-pendaftaran-${peserta.nomor_registrasi}.pdf`)
  }

  const handleUploadSuccess = () => {
    setUploadSuccess(true)
    setShowUpload(false)
    setPeserta(prev => ({ ...prev, status_pembayaran: 'Menunggu Validasi' }))
  }

  const statusKey = peserta?.status_pembayaran || 'Belum Bayar'
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG['Belum Bayar']
  const StatusIcon = statusCfg.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-miq-50 to-white pt-8 pb-16 px-4">
      {/* Header */}
      <div className="max-w-xl mx-auto text-center mb-10">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-miq-700 flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-miq-800">MIQ Kursus</span>
        </Link>
        <h1 className="font-display text-3xl font-bold text-miq-800 mt-4">Cek Status Pendaftaran</h1>
        <p className="text-muted-foreground mt-2">Masukkan nomor registrasi Anda untuk melihat status pembayaran dan informasi kursus.</p>
      </div>

      {/* Search Box */}
      <div className="max-w-xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow-lg border border-miq-100 p-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={nomorReg}
              onChange={e => setNomorReg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCek()}
              placeholder="Contoh: MIQ-20260601-1234"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-miq-500/50 font-mono"
            />
            <Button variant="primary" onClick={handleCek} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </Button>
          </div>
          {error && <div className="mt-3"><Alert type="error">{error}</Alert></div>}
        </div>

        {/* Result */}
        {peserta && (
          <div className="space-y-4">
            {/* Status Card */}
            <div className={`rounded-2xl border p-5 ${statusCfg.bg}`}>
              <div className="flex items-center gap-3">
                <StatusIcon className={`w-8 h-8 ${statusCfg.color}`} />
                <div>
                  <p className="font-semibold text-foreground">Status Pembayaran</p>
                  <p className={`text-lg font-bold ${statusCfg.color}`}>{statusCfg.label}</p>
                </div>
              </div>
              {statusKey === 'Ditolak' && pembayaran?.catatan && (
                <p className="mt-3 text-sm text-red-700 bg-red-100 rounded-xl px-3 py-2">
                  <strong>Catatan admin:</strong> {pembayaran.catatan}
                </p>
              )}
              {uploadSuccess && (
                <p className="mt-3 text-sm text-emerald-700 font-semibold">
                  ✓ Bukti pembayaran telah diupload. Menunggu validasi admin.
                </p>
              )}
            </div>

            {/* Detail Data */}
            <div className="bg-white rounded-2xl border border-miq-100 shadow-sm overflow-hidden">
              <div className="bg-miq-700 px-5 py-3">
                <p className="text-white/70 text-xs">Nomor Registrasi</p>
                <p className="text-white font-mono font-bold text-lg">{peserta.nomor_registrasi}</p>
              </div>
              <div className="p-5 space-y-3">
                {[
                  ['Nama Santri', peserta.nama_santri],
                  ['Nama Lembaga', peserta.nama_lembaga],
                  ['Asal Pesantren', peserta.asal_pesantren],
                  ['Penanggung Jawab', peserta.nama_penanggung_jawab],
                  ['No. HP PJ', peserta.nomor_penanggung_jawab],
                  ['Jenis Kursus', peserta.jenis_kursus],
                  ['Kamar', peserta.kamar?.nama_kamar || 'Akan ditentukan'],
                  ['Ruangan', peserta.ruangan?.nama_ruangan || 'Akan ditentukan'],
                  ['Gelombang', peserta.gelombang?.nama || '-'],
                  ['Tanggal Daftar', formatDate(peserta.created_at)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm border-b border-muted pb-2 last:border-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-semibold text-right max-w-[60%]">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Aksi */}
            <div className="space-y-3">
              <Button variant="primary" size="lg" className="w-full" onClick={handleDownloadPDF}>
                <Download size={18} /> Download Bukti Pendaftaran PDF
              </Button>

              {/* Upload jika belum bayar atau ditolak */}
              {(statusKey === 'Belum Bayar' || statusKey === 'Ditolak') && !uploadSuccess && (
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full"
                  onClick={() => setShowUpload(v => !v)}
                >
                  <Upload size={18} />
                  {showUpload ? 'Tutup' : statusKey === 'Ditolak' ? 'Upload Ulang Bukti Transfer' : 'Upload Bukti Transfer'}
                </Button>
              )}

              {peserta.gelombang?.whatsapp_group && (
                <a href={peserta.gelombang.whatsapp_group} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="success" size="lg" className="w-full">
                    <MessageCircle size={18} /> Gabung Grup WhatsApp
                  </Button>
                </a>
              )}
            </div>

            {/* Upload Area */}
            {showUpload && !uploadSuccess && (
              <div className="bg-white rounded-2xl border border-miq-100 shadow-sm p-5">
                <h3 className="font-display text-lg font-bold text-miq-800 mb-4">Upload Bukti Transfer</h3>
                <UploadBukti pesertaId={peserta.id} onSuccess={handleUploadSuccess} />
              </div>
            )}
          </div>
        )}

        <div className="text-center">
          <Link to="/" className="text-muted-foreground hover:text-miq-700 text-sm transition-colors">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
