import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookMarked, ChevronRight, ChevronLeft, Check, Download, MessageCircle, Loader2 } from 'lucide-react'
import { Button, Input, Select, Card, Alert } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { generateNomorRegistrasi } from '@/utils'
import { generateBuktiPendaftaran, downloadPdf } from '@/lib/pdf'
import { cn } from '@/utils'

// Zod schemas per step
const step1Schema = z.object({
  nama_santri: z.string().min(3, 'Nama minimal 3 karakter'),
  nama_lembaga: z.string().min(3, 'Nama lembaga wajib diisi'),
  asal_pesantren: z.string().min(3, 'Asal pesantren wajib diisi'),
})

const step2Schema = z.object({
  nama_penanggung_jawab: z.string().min(3, 'Nama penanggung jawab wajib diisi'),
  nomor_penanggung_jawab: z.string().min(10, 'Nomor HP minimal 10 digit').max(15, 'Nomor HP terlalu panjang'),
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

export default function DaftarPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [gelombangList, setGelombangList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null) // peserta data on success

  const { register, handleSubmit, formState: { errors }, reset, getValues } = useForm({
    resolver: zodResolver(schemas[step] || z.object({})),
    defaultValues: formData,
  })

  useEffect(() => {
    // Fetch active gelombang
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
    if (step < 3) {
      setStep(s => s + 1)
      reset(merged)
    }
  })

  const onBack = () => {
    setStep(s => s - 1)
    reset(formData)
  }

  const onSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const nomorRegistrasi = generateNomorRegistrasi()

      // Get gelombang detail
      const gelombang = gelombangList.find(g => g.id === formData.gelombang_id)

      // Auto-assign kamar
      const { data: kamar } = await supabase
        .from('kamar')
        .select('*')
        .eq('gelombang_id', formData.gelombang_id)
        .lt('terisi', supabase.raw('kapasitas'))
        .order('nomor_kamar')
        .limit(1)
        .single()

      // Auto-assign ruangan
      const { data: ruangan } = await supabase
        .from('ruangan')
        .select('*')
        .eq('gelombang_id', formData.gelombang_id)
        .eq('jenis_kursus', formData.jenis_kursus)
        .limit(1)
        .single()

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
        .select(`*, kamar(*), ruangan(*), gelombang(*)`)
        .single()

      if (pesertaErr) throw pesertaErr

      // Update kamar terisi
      if (kamar) {
        await supabase.from('kamar').update({ terisi: (kamar.terisi || 0) + 1 }).eq('id', kamar.id)
      }

      // Insert pembayaran record
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

  const handleDownloadPDF = async () => {
    const bytes = await generateBuktiPendaftaran(success)
    downloadPdf(bytes, `bukti-pendaftaran-${success.nomor_registrasi}.pdf`)
  }

  // ── SUCCESS STATE ─────────────────────────────────────────────────────────
  if (success) {
    const gelombang = gelombangList.find(g => g.id === success.gelombang_id)
    return (
      <div className="min-h-screen bg-gradient-to-br from-miq-50 to-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-3xl shadow-2xl shadow-miq-100/80 border border-miq-100 overflow-hidden">
            <div className="bg-gradient-to-br from-miq-700 to-miq-500 p-8 text-center text-white">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10" />
              </div>
              <h1 className="font-display text-2xl font-bold">Pendaftaran Berhasil!</h1>
              <p className="text-white/80 text-sm mt-2">Data Anda telah berhasil disimpan</p>
            </div>

            <div className="p-8">
              <div className="bg-miq-50 rounded-2xl p-4 mb-6 space-y-3">
                {[
                  ['No. Registrasi', success.nomor_registrasi],
                  ['Nama Santri', success.nama_santri],
                  ['Jenis Kursus', success.jenis_kursus],
                  ['Kamar', success.kamar?.nama_kamar || '-'],
                  ['Ruangan', success.ruangan?.nama_ruangan || '-'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-semibold text-miq-800">{v}</span>
                  </div>
                ))}
              </div>

              <Alert type="warning">
                <strong>Langkah selanjutnya:</strong> Lakukan pembayaran dan hubungi panitia untuk konfirmasi.
              </Alert>

              <div className="mt-6 space-y-3">
                <Button variant="primary" size="lg" className="w-full" onClick={handleDownloadPDF}>
                  <Download size={18} /> Download Bukti Pendaftaran (PDF)
                </Button>
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
        </div>
      </div>
    )
  }

  // ── FORM STATE ────────────────────────────────────────────────────────────
  const selectedGelombang = gelombangList.find(g => g.id === formData.gelombang_id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-miq-50 via-white to-miq-50/50 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
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

        {/* Form Card */}
        <Card className="shadow-xl shadow-miq-100/50">
          <div className="p-8">
            <h2 className="font-display text-xl font-bold text-miq-800 mb-1">{STEPS[step].label}</h2>
            <p className="text-muted-foreground text-sm mb-6">{STEPS[step].desc}</p>

            {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

            {/* Step 0: Data Santri */}
            {step === 0 && (
              <div className="space-y-4">
                <Input label="Nama Santri *" placeholder="Nama lengkap santri" error={errors.nama_santri?.message} {...register('nama_santri')} />
                <Input label="Nama Lembaga *" placeholder="Nama lembaga/yayasan" error={errors.nama_lembaga?.message} {...register('nama_lembaga')} />
                <Input label="Asal Pesantren *" placeholder="Nama pesantren asal" error={errors.asal_pesantren?.message} {...register('asal_pesantren')} />
              </div>
            )}

            {/* Step 1: Penanggung Jawab */}
            {step === 1 && (
              <div className="space-y-4">
                <Input label="Nama Penanggung Jawab *" placeholder="Nama wali / orang tua" error={errors.nama_penanggung_jawab?.message} {...register('nama_penanggung_jawab')} />
                <Input label="Nomor HP Penanggung Jawab *" placeholder="Contoh: 08123456789" type="tel" error={errors.nomor_penanggung_jawab?.message} {...register('nomor_penanggung_jawab')} />
              </div>
            )}

            {/* Step 2: Jenis Kursus */}
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

            {/* Step 3: Konfirmasi */}
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

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              {step > 0 ? (
                <Button variant="secondary" onClick={onBack} disabled={loading}>
                  <ChevronLeft size={16} /> Kembali
                </Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button variant="primary" onClick={onNext}>
                  Lanjut <ChevronRight size={16} />
                </Button>
              ) : (
                <Button variant="gold" size="lg" onClick={onSubmit} disabled={loading}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Memproses...</> : 'Submit Pendaftaran'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
