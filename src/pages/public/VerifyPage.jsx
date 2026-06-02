import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { BookMarked, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { formatDate } from '@/utils'

export default function VerifyPage() {
  const { code } = useParams()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [type, setType] = useState('registration') // 'registration' | 'certificate'

  useEffect(() => {
    const verify = async () => {
      // Try certificate first
      const { data: cert } = await supabase
        .from('sertifikat')
        .select(`*, peserta(nama_santri, nama_lembaga, jenis_kursus, gelombang(nama))`)
        .eq('verification_code', code)
        .single()

      if (cert) {
        setType('certificate')
        setResult(cert)
        setLoading(false)
        return
      }

      // Try registration
      const { data: peserta } = await supabase
        .from('peserta')
        .select(`*, kamar(*), ruangan(*), gelombang(*)`)
        .eq('nomor_registrasi', code)
        .single()

      if (peserta) {
        setType('registration')
        setResult(peserta)
      }

      setLoading(false)
    }
    verify()
  }, [code])

  return (
    <div className="min-h-screen bg-gradient-to-br from-miq-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-miq-700 flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-miq-800">MIQ Kursus</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-miq-800 mt-6 mb-2">Verifikasi Dokumen</h1>
          <p className="text-muted-foreground text-sm">Kode: <span className="font-mono font-semibold text-miq-700">{code}</span></p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-miq-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-miq-500" />
            </div>
          ) : result ? (
            <div>
              {/* Status */}
              <div className="bg-gradient-to-br from-miq-700 to-miq-500 p-8 text-white text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
                <h2 className="font-display text-xl font-bold">
                  {type === 'certificate' ? '✓ Sertifikat Valid' : '✓ Pendaftaran Valid'}
                </h2>
                <p className="text-white/70 text-sm mt-1">
                  {type === 'certificate' ? 'Sertifikat ini asli dan terverifikasi' : 'Peserta ini terdaftar secara resmi'}
                </p>
              </div>

              {/* Detail */}
              <div className="p-8 space-y-3">
                {type === 'certificate' ? (
                  <>
                    {[
                      ['No. Sertifikat', result.nomor_sertifikat],
                      ['Nama Peserta', result.peserta?.nama_santri],
                      ['Nama Lembaga', result.peserta?.nama_lembaga],
                      ['Jenis Kursus', result.peserta?.jenis_kursus],
                      ['Gelombang', result.peserta?.gelombang?.nama],
                      ['Tanggal Terbit', formatDate(result.issued_at || result.created_at)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm border-b border-muted pb-2 last:border-0">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-semibold text-miq-800">{v || '-'}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      ['No. Registrasi', result.nomor_registrasi],
                      ['Nama Santri', result.nama_santri],
                      ['Jenis Kursus', result.jenis_kursus],
                      ['Kamar', result.kamar?.nama_kamar || '-'],
                      ['Ruangan', result.ruangan?.nama_ruangan || '-'],
                      ['Gelombang', result.gelombang?.nama || '-'],
                      ['Status', result.status_pembayaran],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm border-b border-muted pb-2 last:border-0">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-semibold text-miq-800">{v || '-'}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold text-miq-800 mb-2">Tidak Ditemukan</h2>
              <p className="text-muted-foreground text-sm">Kode verifikasi tidak valid atau dokumen tidak terdaftar dalam sistem.</p>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-muted-foreground hover:text-miq-700 text-sm transition-colors">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
