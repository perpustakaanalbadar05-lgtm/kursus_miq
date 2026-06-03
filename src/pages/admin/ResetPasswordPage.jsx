import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { BookMarked, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { Button, Input, Alert, Card } from '@/components/ui'
import { useAuthStore } from '@/store'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword, loading } = useAuthStore()
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionValid, setSessionValid] = useState(false)
  const [checking, setChecking] = useState(true)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  useEffect(() => {
    // Check if user has valid session from password reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setSessionValid(true)
      } else {
        setError('Session tidak valid. Link mungkin sudah kadaluarsa atau belum diklik dari email.')
      }
      setChecking(false)
    }
    checkSession()
  }, [])

  const password = watch('password')

  const onSubmit = async (data) => {
    setError('')
    if (data.password !== data.confirmPassword) {
      setError('Kata sandi tidak cocok')
      return
    }

    const result = await updatePassword(data.password)
    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        navigate('/admin/login')
      }, 2000)
    } else {
      setError(result.error || 'Gagal mengubah kata sandi.')
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-miq-900 via-miq-800 to-miq-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-gold-500" />
          <p className="text-white/70">Memeriksa session...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-miq-900 via-miq-800 to-miq-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-miq-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl" />

        <div className="relative w-full max-w-md">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">Berhasil!</h2>
              <p className="text-white/70 mb-6">
                Kata sandi Anda telah berhasil diubah. Silakan login dengan kata sandi baru Anda.
              </p>
              <p className="text-white/50 text-sm">Halaman akan redirect dalam beberapa detik...</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (!sessionValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-miq-900 via-miq-800 to-miq-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern opacity-10" />
        <div className="relative w-full max-w-md">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="p-8 text-center">
              <Alert type="error" className="mb-4">{error}</Alert>
              <Button
                onClick={() => navigate('/admin/login')}
                variant="gold"
                size="lg"
                className="w-full"
              >
                Kembali ke Login
              </Button>
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gold-500 flex items-center justify-center shadow-lg shadow-gold-500/30 mx-auto mb-6">
            <BookMarked className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Atur Ulang Kata Sandi</h1>
          <p className="text-white/50 text-sm mt-2">Masukkan kata sandi baru Anda</p>
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
                <label className="text-sm font-semibold text-white/80">Kata Sandi Baru</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 transition-all"
                    {...register('password', { 
                      required: 'Kata sandi wajib diisi',
                      minLength: {
                        value: 6,
                        message: 'Kata sandi minimal 6 karakter'
                      }
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-white/80">Konfirmasi Kata Sandi</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 transition-all"
                    {...register('confirmPassword', { 
                      required: 'Konfirmasi kata sandi wajib diisi',
                      validate: (value) => value === password || 'Kata sandi tidak cocok'
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
              </div>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full mt-6"
                disabled={loading}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Mengubah...</> : 'Ubah Kata Sandi'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
