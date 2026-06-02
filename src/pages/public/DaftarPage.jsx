import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  BookMarked, ChevronRight, ChevronLeft, Check,
  Download, MessageCircle, Loader2, Upload, Camera, X
} from 'lucide-react'
import { Button, Input, Select, Card, Alert } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { generateNomorRegistrasi, cn } from '@/utils'
import { generateBuktiPendaftaran, downloadPdf } from '@/lib/pdf'

const step1Schema = z.object({
  nama_santri: z.string().min(3, 'Nama minimal 3 karakter'),
  nama_lembaga: z.string().min(3, 'Nama lembaga wajib diisi'),
  asal_pesantren: z.string().min(3, 'Asal pesantren wajib diisi'),
})
const step2Schema = z.object({
  nama_penanggung_jawab: z.string().min(3, 'Nama penanggung jawab wajib diisi'),
  nomor_penanggung_jawab: z.string().min(10, 'Nomor HP minimal 10 digit').max(15),
})
const step3Schema = z.object({
  jenis_kursus: z.enum(['Tartil Pemula', 'Tartil Melanjutkan'], { message: 'Pilih jenis kursus' }),
  gelombang_id: z.string().min(1, 'Pilih gelombang'),
})
const schemas = [step1Schema, step2Schema, step3Schema]

const STEPS = [
  { label: 'Data Santri', desc: 'Informasi dasar' },
  { label: 'Penanggung Jawab', desc: 'Kontak & wali' },
  { label: 'Jenis Kursus', desc: 'Program & gelombang' },
  { label: 'Konfirmasi', desc: 'Review data' },
]

// ── KOMPONEN UPLOAD BUKTI PEMBAYARAN ─────────────────────────────────────────
function UploadBuktiPembayaran({ pesertaId, onSuccess }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { setError('Ukuran file maksimal 5MB'); return }
    setFile(f)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  const handleUpload = async () => {
    if (!file || !pesertaId) return
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `payment-proofs/${pesertaId}-${Date.now()}.${ext}`

      // Upload ke Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('payment-proofs')
        .upload(path, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(path)

      // Update record pembayaran
      await supabase
        .from('pembayaran')
        .update({
          bukti_transfer_url: publicUrl,
          status: 'Menunggu Validasi',
        })
        .eq('peserta_id', pesertaId)

      // Update status peserta
      await supabase
        .from('peserta')
        .update({ status_pembayaran: 'Menunggu Validasi' })
        .eq('id', pesertaId)

      setDone(true)
      onSuccess?.()
    } catch (err) {
      setError('Gagal upload: ' + (err.message || 'Coba lagi'))
    } finally {
      setUploading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
        <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
        <p className="font-semibold text-emerald-800">Bukti pembayaran berhasil diupload!</p>
        <p className="text-emerald-600 text-sm mt-1">Panitia akan memvalidasi dalam 1×24 jam.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-miq-200 rounded-2xl p-6 text-center">
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-xl object-contain" />
            <button
              onClick={() => { setFile(null); setPreview(null) }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div
            className="cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-10 h-10 text-miq-300 mx-auto mb-3" />
            <p className="text-miq-700 font-semibold text-sm">Klik untuk upload bukti transfer</p>
            <p className="text-muted-foreground text-xs mt-1">JPG, PNG, PDF • Maks 5MB</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {file && (
        <Button
          variant="gold"
          size="lg"
          className="w-full"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading
            ? <><Loader2 size={16} className="animate-spin" /> Mengupload...</>
            : <><Upload size={16} /> Upload Bukti Pembayaran</>
          }
        </Button>
      )}
    </div>
  )
}

// ── SUCCESS STATE ─────────────────────────────────────────────────────────────
function SuccessState({ peserta, gelombangList }) {
  const [showUpload, setShowUpload] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const gelombang = gelombangList.find(g => g.id === peserta.gelombang_id)

  const handleDownloadPDF = async () => {
    const bytes = await generateBuktiPendaftaran(peserta)
    downloadPdf(bytes, `bukti-pendaftaran-${peserta.nomor_registrasi}.pdf`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-miq-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-4">
        {/* Card utama */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-miq-100/80 border border-miq-100 overflow-hidden">
          <div className="bg-gradient-to-br from-miq-700 to-miq-500 p-8 text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10" />
            </div>
            <h1 className="font-display text-2xl font-bold">Pendaftaran Berhasil!</h1>
            <p className="text-white/80 text-sm mt-1">Data Anda telah berhasil disimpan</p>
          </div>

          <div className="p-6">
            {/* Info registrasi */}
            <div className="bg-miq-50 rounded-2xl p-4 mb-5 space-y-2.5">
              {[
                ['No. Registrasi', peserta.nomor_registrasi],
                ['Nama Santri', peserta.nama_santri],
                ['Jenis Kursus', peserta.jenis_kursus],
                ['Kamar', peserta.kamar?.nama_kamar || 'Akan ditentukan'],
                ['Ruangan', peserta.ruangan?.nama_ruangan || 'Akan ditentukan'],
                ['Gelombang', gelombang?.nama || peserta.gelombang?.nama || '-'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-semibold text-miq-800">{v}</span>
                </div>
              ))}
            </div>

            {/* Steps pembayaran */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
              <p className="font-semibold text-amber-800 text-sm mb-2">📋 Langkah Selanjutnya:</p>
              <ol className="text-amber-700 text-sm space-y-1 list-decimal list-inside">
                <li>Download bukti pendaftaran PDF di bawah</li>
                <li>Lakukan transfer pembayaran ke rekening panitia</li>
                <li>Upload bukti transfer di bawah ini</li>
                <li>Tunggu konfirmasi validasi dari panitia (1×24 jam)</li>
              </ol>
            </div>

            {/* Tombol-tombol */}
            <div className="space-y-3">
              <Button variant="primary" size="lg" className="w-full" onClick={handleDownloadPDF}>
                <Download size={18} /> Download Bukti Pendaftaran (PDF)
              </Button>

              {!uploadDone && (
                <Button
                  variant={showUpload ? 'secondary' : 'gold'}
                  size="lg"
                  className="w-full"
                  onClick={() => setShowUpload(v => !v)}
                >
                  <Upload size={18} />
                  {showUpload ? 'Tutup Upload' : 'Upload Bukti Pembayaran'}
                </Button>
              )}

              {gelombang?.whatsapp_group && (
                <a href={gelombang.whatsapp_group} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="success" size="lg" className="w-full">
                    <MessageCircle size={18} /> Gabung Grup WhatsApp
                  </Button>
                </a>
              )}
              <Link to="/" className="block">
                <Button variant="ghost" size="lg" className="w-full">Kembali ke Beranda</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Upload section */}
        {showUpload && !uploadDone && (
          <div className="bg-white rounded-3xl shadow-xl border border-miq-100 p-6">
            <h3 className="font-display text-lg font-bold text-miq-800 mb-4">Upload Bukti Transfer</h3>
            <UploadBuktiPembayaran
              pesertaId={peserta.id}
              onSuccess={() => { setUploadDone(true); setShowUpload(false) }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── FORM DAFTAR ───────────────────────────────────────────────────────────────
export default function DaftarPage() {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [gelombangList, setGelombangList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schemas[step] || z.object({})),
    defaultValues: formData,
  })

  useEffect(() => {
    supabase
      .from('gelombang')
      .select('*')
      .eq('status_aktif', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setGelombangList(data || []))
  }, [])

  const onNext = handleSubmit((data) => {
    const merged = { ...formData, ...data }
    setFormData(merged)
    if (step < 3) { setStep(s => s + 1); reset(merged) }
  })

  const onBack = () => { setStep(s => s - 1); reset(formData) }

  const onSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const nomorRegistrasi = generateNomorRegistrasi()

      // ✅ FIX: Auto-assign kamar dengan filter JS bukan supabase.raw()
      const { data: kamarList } = await supabase
        .from('kamar')
        .select('*')
        .eq('gelombang_id', formData.gelombang_id)
        .order('nomor_kamar')

      // Cari kamar yang masih tersedia (terisi < kapasitas)
      const kamar = (kamarList || []).find(k => (k.terisi || 0) < k.kapasitas) || null

      // Auto-assign ruangan berdasarkan jenis kursus
      const { data: ruanganList } = await supabase
        .from('ruangan')
        .select('*')
        .eq('gelombang_id', formData.gelombang_id)
        .eq('jenis_kursus', formData.jenis_kursus)

      const ruangan = ruanganList?.[0] || null

      // Insert peserta
      const { data: peserta, error: pesertaErr } = await supabase
        .from('peserta')
        .insert({
          nomor_registrasi: nomorRegistrasi,
          gelombang_id: formData.gelombang_id,
          nama_santri: formData.nama_santri,
          nama_lembaga: formData.nama_lembaga,
          asal_pesantren: formData.asal_pesantren,
          nama_penanggung_jawab: formData.nama_penanggung_jawab,
          nomor_penanggung_jawab: formData.nomor_penanggung_jawab,
          jenis_kursus: formData.jenis_kursus,
          kamar_id: kamar?.id || null,
          ruangan_id: ruangan?.id || null,
          status_pembayaran: 'Belum Bayar',
        })
        .select('*, kamar(*), ruangan(*), gelombang(*)')
        .single()

      if (pesertaErr) throw pesertaErr

      // Update kamar terisi
      if (kamar) {
        await supabase
          .from('kamar')
          .update({ terisi: (kamar.terisi || 0) + 1 })
          .eq('id', kamar.id)
      }

      // Buat record pembayaran
      await supabase.from('pembayaran').insert({
        peserta_id: peserta.id,
        status: 'Belum Bayar',
      })

      setSuccess(peserta)
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return <SuccessState peserta={success} gelombangList={gelombangList} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-miq-50 via-white to-miq-50/50 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-miq-600 hover:text-miq-700 text-sm font-medium mb-6 transition-colors">
            <ChevronLeft size={16} /> Kembali ke Beranda
          </Link>
          <h1 className="font-display text-3xl font-bold text-miq-800">Formulir Pendaftaran</h1>
          <p className="text-muted-foreground mt-2">Kursus Madrasah Ilmu Al Quran — PP Miftahul Ulum Panyeppen</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  i < step ? 'step-done' : i === step ? 'step-active' : 'step-inactive'
                )}>
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                <span className={cn('text-xs font-medium hidden sm:block', i === step ? 'text-miq-700' : 'text-muted-foreground')}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-2 max-w-16 transition-all', i < step ? 'bg-gold-500' : 'bg-muted')} />
              )}
            </React.Fragment>
          ))}
        </div>

        <Card className="shadow-xl shadow-miq-100/50">
          <div className="p-8">
            <h2 className="font-display text-xl font-bold text-miq-800 mb-1">{STEPS[step].label}</h2>
            <p className="text-muted-foreground text-sm mb-6">{STEPS[step].desc}</p>

            {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

            {step === 0 && (
              <div className="space-y-4">
                <Input label="Nama Santri *" placeholder="Nama lengkap santri" error={errors.nama_santri?.message} {...register('nama_santri')} />
                <Input label="Nama Lembaga *" placeholder="Nama lembaga/yayasan" error={errors.nama_lembaga?.message} {...register('nama_lembaga')} />
                <Input label="Asal Pesantren *" placeholder="Nama pesantren asal" error={errors.asal_pesantren?.message} {...register('asal_pesantren')} />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <Input label="Nama Penanggung Jawab *" placeholder="Nama wali / orang tua" error={errors.nama_penanggung_jawab?.message} {...register('nama_penanggung_jawab')} />
                <Input label="Nomor HP Penanggung Jawab *" placeholder="Contoh: 08123456789" type="tel" error={errors.nomor_penanggung_jawab?.message} {...register('nomor_penanggung_jawab')} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Select label="Jenis Kursus *" error={errors.jenis_kursus?.message} {...register('jenis_kursus')}>
                  <option value="">-- Pilih Jenis Kursus --</option>
                  <option value="Tartil Pemula">Tartil Pemula</option>
                  <option value="Tartil Melanjutkan">Tartil Melanjutkan</option>
                </Select>
                <Select label="Gelombang *" error={errors.gelombang_id?.message} {...register('gelombang_id')}>
                  <option value="">-- Pilih Gelombang --</option>
                  {gelombangList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nama} ({g.tahun}) — Kuota: {g.kuota}
                    </option>
                  ))}
                </Select>
                {gelombangList.length === 0 && (
                  <Alert type="warning">Belum ada gelombang aktif. Silakan hubungi panitia.</Alert>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">Periksa kembali data Anda sebelum submit:</p>
                <div className="bg-miq-50 rounded-2xl p-5 space-y-3">
                  {[
                    ['Nama Santri', formData.nama_santri],
                    ['Nama Lembaga', formData.nama_lembaga],
                    ['Asal Pesantren', formData.asal_pesantren],
                    ['Penanggung Jawab', formData.nama_penanggung_jawab],
                    ['No. HP', formData.nomor_penanggung_jawab],
                    ['Jenis Kursus', formData.jenis_kursus],
                    ['Gelombang', gelombangList.find(g => g.id === formData.gelombang_id)?.nama || '-'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm border-b border-miq-100 pb-2 last:border-0 last:pb-0">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-semibold text-miq-800">{v || '-'}</span>
                    </div>
                  ))}
                </div>
                <Alert type="info">
                  Dengan menekan <strong>Submit</strong>, data akan disimpan dan Anda akan mendapatkan nomor registrasi.
                </Alert>
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              {step > 0 ? (
                <Button variant="secondary" onClick={onBack} disabled={loading}>
                  <ChevronLeft size={16} /> Kembali
                </Button>
              ) : <div />}

              {step < 3 ? (
                <Button variant="primary" onClick={onNext}>
                  Lanjut <ChevronRight size={16} />
                </Button>
              ) : (
                <Button variant="gold" size="lg" onClick={onSubmit} disabled={loading}>
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Memproses...</>
                    : 'Submit Pendaftaran'
                  }
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
