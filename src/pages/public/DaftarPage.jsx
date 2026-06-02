import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  BookMarked, ChevronRight, ChevronLeft, Check,
  Download, MessageCircle, Loader2, Upload, X, Plus, Trash2, Users
} from 'lucide-react'
import { Button, Input, Select, Card, Alert } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { generateNomorRegistrasi, cn } from '@/utils'
import { generateBuktiPendaftaran, downloadPdf } from '@/lib/pdf'

const step0Schema = z.object({
  nama_lembaga: z.string().min(3, 'Nama lembaga wajib diisi'),
  asal_pesantren: z.string().min(3, 'Asal pesantren wajib diisi'),
  nama_penanggung_jawab: z.string().min(3, 'Nama penanggung jawab wajib diisi'),
  nomor_penanggung_jawab: z.string().min(10, 'Nomor HP minimal 10 digit').max(15, 'Nomor HP terlalu panjang'),
})

const step1Schema = z.object({
  santri_list: z.array(z.object({
    nama_santri: z.string().min(3, 'Nama santri wajib diisi'),
    jenis_kursus: z.string().min(1, { message: 'Pilih jenis kursus' }),
  })).min(1, 'Minimal 1 santri'),
})

const step2Schema = z.object({
  gelombang_id: z.string().min(1, 'Pilih gelombang'),
})

const schemas = [step0Schema, step1Schema, step2Schema, z.object({})]

const STEPS = [
  { label: 'Penanggung Jawab', desc: 'Kontak & Lembaga' },
  { label: 'Data Santri', desc: 'Daftar peserta kursus' },
  { label: 'Gelombang', desc: 'Pilihan gelombang' },
  { label: 'Konfirmasi', desc: 'Review & Submit' },
]

// ── KOMPONEN UPLOAD BUKTI PEMBAYARAN ─────────────────────────────────────────
function UploadBuktiPembayaran({ pesertaIds, onSuccess }) {
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
    if (!file || !pesertaIds || pesertaIds.length === 0) return
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `payment-proofs/${pesertaIds[0]}-${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('payment-proofs')
        .upload(path, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(path)

      // Update record pembayaran untuk SEMUA peserta di batch ini
      await supabase
        .from('pembayaran')
        .update({
          bukti_transfer_url: publicUrl,
          status: 'Menunggu Validasi',
        })
        .in('peserta_id', pesertaIds)

      // Update status peserta untuk SEMUA peserta di batch ini
      await supabase
        .from('peserta')
        .update({ status_pembayaran: 'Menunggu Validasi' })
        .in('id', pesertaIds)

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
          <div className="relative inline-block">
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

// ── SUCCESS STATE (MULTIPLE SANTRI) ───────────────────────────────────────────
function SuccessState({ pesertaList, gelombangList }) {
  const [showUpload, setShowUpload] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const gelombang = gelombangList.find(g => g.id === pesertaList[0]?.gelombang_id)

  const handleDownloadPDF = async () => {
    const bytes = await generateBuktiPendaftaran(pesertaList)
    const filename = pesertaList.length > 1 
      ? `bukti-pendaftaran-kolektif-${pesertaList[0].nomor_registrasi}.pdf`
      : `bukti-pendaftaran-${pesertaList[0].nomor_registrasi}.pdf`
    downloadPdf(bytes, filename)
  }

  const pesertaIds = pesertaList.map(p => p.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-miq-50 to-white flex items-center justify-center p-4 py-12">
      <div className="max-w-xl w-full space-y-4">
        {/* Card utama */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-miq-100/80 border border-miq-100 overflow-hidden">
          <div className="bg-gradient-to-br from-miq-700 to-miq-500 p-8 text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10" />
            </div>
            <h1 className="font-display text-2xl font-bold">Pendaftaran Berhasil!</h1>
            <p className="text-white/80 text-sm mt-1">{pesertaList.length} santri berhasil didaftarkan</p>
          </div>

          <div className="p-6">
            <div className="bg-miq-50 rounded-2xl p-5 mb-5 space-y-4">
              <p className="font-semibold text-miq-800 border-b border-miq-100 pb-2">
                Detail Pendaftaran
              </p>
              
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {pesertaList.map((p, idx) => (
                  <div key={p.id} className="bg-white p-3 rounded-xl border border-miq-100 shadow-sm text-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-miq-800">{idx + 1}. {p.nama_santri}</span>
                      <span className="font-mono text-xs bg-miq-100 text-miq-700 px-2 py-1 rounded-md">{p.nomor_registrasi}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted-foreground mt-2">
                      <p>Kursus: <span className="font-semibold text-foreground">{p.jenis_kursus}</span></p>
                      <p>Gelombang: <span className="font-semibold text-foreground">{gelombang?.nama || '-'}</span></p>
                      <p>Kamar: <span className="font-semibold text-foreground">{p.kamar?.nama_kamar || 'Akan ditentukan'}</span></p>
                      <p>Ruangan: <span className="font-semibold text-foreground">{p.ruangan?.nama_ruangan || 'Akan ditentukan'}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps pembayaran */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
              <p className="font-semibold text-amber-800 text-sm mb-2">📋 Langkah Selanjutnya:</p>
              <ol className="text-amber-700 text-sm space-y-1 list-decimal list-inside">
                <li>Download bukti pendaftaran PDF (semua peserta)</li>
                <li>Lakukan transfer pembayaran total ke rekening panitia</li>
                <li>Upload bukti transfer (satu foto untuk seluruh pendaftaran ini)</li>
                <li>Tunggu konfirmasi validasi dari panitia (1×24 jam)</li>
              </ol>
            </div>

            {/* Tombol-tombol */}
            <div className="space-y-3">
              <Button variant="primary" size="lg" className="w-full" onClick={handleDownloadPDF}>
                <Download size={18} /> Download Bukti Pendaftaran PDF ({pesertaList.length})
              </Button>

              {!uploadDone && (
                <Button
                  variant={showUpload ? 'secondary' : 'gold'}
                  size="lg"
                  className="w-full"
                  onClick={() => setShowUpload(v => !v)}
                >
                  <Upload size={18} />
                  {showUpload ? 'Tutup Upload' : 'Upload Bukti Pembayaran Total'}
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
            <h3 className="font-display text-lg font-bold text-miq-800 mb-2">Upload Bukti Transfer</h3>
            <p className="text-sm text-muted-foreground mb-4">Satu bukti transfer bisa digunakan untuk memvalidasi {pesertaList.length} santri sekaligus.</p>
            <UploadBuktiPembayaran
              pesertaIds={pesertaIds}
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
  const [formData, setFormData] = useState({
    santri_list: [{ nama_santri: '', jenis_kursus: '' }]
  })
  const [gelombangList, setGelombangList] = useState([])
  const [jenisKursusList, setJenisKursusList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successList, setSuccessList] = useState(null)

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm({
    resolver: zodResolver(schemas[step] || z.object({})),
    defaultValues: formData,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "santri_list",
  })

  useEffect(() => {
    supabase
      .from('gelombang')
      .select('*')
      .eq('status_aktif', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setGelombangList(data || []))

    supabase
      .from('jenis_kursus')
      .select('*')
      .then(({ data }) => setJenisKursusList(data || []))
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
      const createdPeserta = []
      
      // Ambil kamar & ruangan per gelombang untuk mempercepat auto-assign
      const { data: kamarList } = await supabase
        .from('kamar')
        .select('*')
        .eq('gelombang_id', formData.gelombang_id)
        .order('nomor_kamar')

      const { data: ruanganList } = await supabase
        .from('ruangan')
        .select('*')
        .eq('gelombang_id', formData.gelombang_id)

      // Tracking terisi local to avoid multiple select queries
      const kamarUsage = [...(kamarList || [])]

      // Loop over each santri
      for (const santri of formData.santri_list) {
        const nomorRegistrasi = generateNomorRegistrasi()

        // Assign kamar yang terisi < kapasitas
        let assignedKamar = kamarUsage.find(k => (k.terisi || 0) < k.kapasitas) || null
        
        // Assign ruangan berdasarkan jenis_kursus
        let assignedRuangan = (ruanganList || []).find(r => r.jenis_kursus === santri.jenis_kursus) || null

        // Insert peserta
        const { data: peserta, error: pesertaErr } = await supabase
          .from('peserta')
          .insert({
            nomor_registrasi: nomorRegistrasi,
            gelombang_id: formData.gelombang_id,
            nama_santri: santri.nama_santri,
            jenis_kursus: santri.jenis_kursus,
            nama_lembaga: formData.nama_lembaga,
            asal_pesantren: formData.asal_pesantren,
            nama_penanggung_jawab: formData.nama_penanggung_jawab,
            nomor_penanggung_jawab: formData.nomor_penanggung_jawab,
            kamar_id: assignedKamar?.id || null,
            ruangan_id: assignedRuangan?.id || null,
            status_pembayaran: 'Belum Bayar',
          })
          .select('*, kamar(*), ruangan(*), gelombang(*)')
          .single()

        if (pesertaErr) throw pesertaErr

        createdPeserta.push(peserta)

        // Update kamar terisi in DB and locally
        if (assignedKamar) {
          assignedKamar.terisi = (assignedKamar.terisi || 0) + 1
          await supabase.from('kamar').update({ terisi: assignedKamar.terisi }).eq('id', assignedKamar.id)
        }

        // Buat record pembayaran
        await supabase.from('pembayaran').insert({
          peserta_id: peserta.id,
          status: 'Belum Bayar',
        })
      }

      setSuccessList(createdPeserta)
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (successList) {
    return <SuccessState pesertaList={successList} gelombangList={gelombangList} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-miq-50 via-white to-miq-50/50 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-miq-600 hover:text-miq-700 text-sm font-medium mb-6 transition-colors">
            <ChevronLeft size={16} /> Kembali ke Beranda
          </Link>
          <h1 className="font-display text-3xl font-bold text-miq-800">Formulir Pendaftaran</h1>
          <p className="text-muted-foreground mt-2">Daftarkan santri secara perorangan maupun kelompok (kolektif).</p>
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
                <Input label="Nama Penanggung Jawab *" placeholder="Nama wali / koordinator" error={errors.nama_penanggung_jawab?.message} {...register('nama_penanggung_jawab')} />
                <Input label="Nomor HP Penanggung Jawab *" placeholder="Contoh: 08123456789" type="tel" error={errors.nomor_penanggung_jawab?.message} {...register('nomor_penanggung_jawab')} />
                <div className="border-t border-dashed border-border pt-4">
                  <Input label="Nama Lembaga / Yayasan *" placeholder="Contoh: PP Miftahul Ulum" error={errors.nama_lembaga?.message} {...register('nama_lembaga')} className="mb-4" />
                  <Input label="Asal Pesantren / Daerah *" placeholder="Contoh: Panyeppen, Madura" error={errors.asal_pesantren?.message} {...register('asal_pesantren')} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-xl border border-blue-200">
                  <p>Anda dapat mendaftarkan lebih dari satu santri sekaligus. Klik <strong>Tambah Santri</strong> untuk mendaftarkan santri lainnya.</p>
                </div>
                
                {fields.map((field, index) => (
                  <div key={field.id} className="relative bg-miq-50 rounded-2xl p-5 border border-miq-100">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-miq-800 flex items-center gap-2">
                        <Users size={16} /> Santri #{index + 1}
                      </h4>
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      <Input 
                        label="Nama Santri *" 
                        placeholder="Nama lengkap santri" 
                        error={errors.santri_list?.[index]?.nama_santri?.message} 
                        {...register(`santri_list.${index}.nama_santri`)} 
                      />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-miq-900">Jenis Kursus *</label>
                        <select
                          {...register(`santri_list.${index}.jenis_kursus`)}
                          className={cn(
                            "w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-miq-500/50",
                            errors.santri_list?.[index]?.jenis_kursus ? 'border-red-400' : 'border-border'
                          )}
                        >
                          <option value="">-- Pilih Jenis Kursus --</option>
                          {jenisKursusList.map(jk => (
                            <option key={jk.id} value={jk.nama}>{jk.nama} (Rp {jk.biaya.toLocaleString('id-ID')})</option>
                          ))}
                        </select>
                        {errors.santri_list?.[index]?.jenis_kursus && (
                          <p className="text-red-500 text-xs">{errors.santri_list[index].jenis_kursus.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {errors.santri_list && !Array.isArray(errors.santri_list) && (
                  <p className="text-red-500 text-sm">{errors.santri_list.message}</p>
                )}

                <Button type="button" variant="outline" className="w-full border-dashed border-2 hover:bg-miq-50" onClick={() => append({ nama_santri: '', jenis_kursus: '' })}>
                  <Plus size={16} className="mr-2" /> Tambah Santri Lainnya
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-2">Pilih gelombang kursus untuk {formData.santri_list?.length || 1} santri yang didaftarkan.</p>
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
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Periksa kembali data Anda sebelum submit:</p>
                
                <div className="bg-white border border-border rounded-2xl overflow-hidden">
                  <div className="bg-muted px-4 py-2 font-semibold text-sm">Data Penanggung Jawab</div>
                  <div className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Nama:</span> <span className="font-medium">{formData.nama_penanggung_jawab}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">No. HP:</span> <span className="font-medium">{formData.nomor_penanggung_jawab}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Lembaga:</span> <span className="font-medium">{formData.nama_lembaga}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Pesantren:</span> <span className="font-medium">{formData.asal_pesantren}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Gelombang:</span> <span className="font-medium">{gelombangList.find(g => g.id === formData.gelombang_id)?.nama || '-'}</span></div>
                  </div>
                </div>

                <div className="bg-miq-50 border border-miq-100 rounded-2xl overflow-hidden">
                  <div className="bg-miq-100/50 px-4 py-2 font-semibold text-sm text-miq-800">
                    Daftar Santri ({formData.santri_list.length} Orang)
                  </div>
                  <div className="divide-y divide-miq-100/50">
                    {formData.santri_list.map((santri, idx) => (
                      <div key={idx} className="p-3 px-4 flex justify-between text-sm items-center">
                        <span className="font-semibold text-miq-800">{idx + 1}. {santri.nama_santri}</span>
                        <span className="text-xs bg-white border border-miq-100 px-2 py-1 rounded text-muted-foreground">{santri.jenis_kursus}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Alert type="info">
                  Dengan menekan <strong>Submit</strong>, data akan disimpan dan Anda akan mendapatkan nomor registrasi masing-masing.
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
