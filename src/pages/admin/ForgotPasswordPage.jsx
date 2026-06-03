import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { BookMarked, ArrowLeft, Loader2, Mail } from 'lucide-react'
import { Button, Input, Alert, Card } from '@/components/ui'
import { useAuthStore } from '@/store'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { resetPassword, loading } = useAuthStore()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors }, getValues } = useForm()

  const onSubmit = async (data) => {
    setError('')
    const result = await resetPassword(data.email)
    if (result.success) {
      setSubmitted(true)
    } else {
      setError(result.error || 'Gagal mengirim email reset.')
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-miq-900 via-miq-800 to-miq-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-miq-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl" />

        <div className="relative w-full max-w-md">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">Email Terkirim</h2>
              <p className="text-white/70 mb-6">
                Kami telah mengirimkan link reset password ke <span className="text-gold-400 font-semibold">{getValues('email')}</span>
              </p>
              <p className="text-white/50 text-sm mb-6">
                Silakan cek email Anda dan klik link untuk mengatur ulang kata sandi. Link berlaku selama 24 jam.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/admin/login')}
                  variant="gold"
                  size="lg"
                  className="w-full"
                >
                  Kembali ke Login
                </Button>
                <button
                  onClick={() => setSubmitted(false)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-all"
                >
                  Coba Email Lain
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-miq-900 via-miq-800 to-miq-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Bg pattern */}
      <div className="absolute inset-0 bg-islamic-pattern opacity-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-miq-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/admin/login" className="inline-flex items-center gap-3 mb-6 text-white/50 hover:text-white/70 transition-colors text-sm">
            <ArrowLeft size={16} />
            Kembali
          </Link>
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gold-500 flex items-center justify-center shadow-lg shadow-gold-500/30">
              <BookMarked className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="font-display text-2xl font-bold text-white">Lupa Kata Sandi?</h1>
          <p className="text-white/50 text-sm mt-2">Masukkan email untuk menerima link reset</p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="p-8">
            {error && (
              <div className="mb-4">
                <Alert type="error">{error}</Alert>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-white/80">Email</label>
                <input
                  type="email"
                  placeholder="admin@miq.com"
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 transition-all"
                  {...register('email', { 
                    required: 'Email wajib diisi',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email tidak valid'
                    }
                  })}
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full mt-6"
                disabled={loading}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Mengirim...</> : 'Kirim Link Reset'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
