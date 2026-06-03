import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { BookMarked, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button, Input, Alert, Card } from '@/components/ui'
import { useAuthStore } from '@/store'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading } = useAuthStore()
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setError('')
    const result = await login(data.email, data.password)
    if (result.success) {
      navigate('/admin')
    } else {
      setError(result.error || 'Email atau password salah.')
    }
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
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gold-500 flex items-center justify-center shadow-lg shadow-gold-500/30">
              <BookMarked className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-white/50 text-sm mt-2">MIQ Kursus — PP Miftahul Ulum Panyeppen</p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="p-8">
            <h2 className="font-display text-xl font-semibold text-white mb-6">Masuk ke Dashboard</h2>

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
                  {...register('email', { required: 'Email wajib diisi' })}
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-white/80">Password</label>
                  <Link to="/admin/forgot-password" className="text-xs text-gold-400 hover:text-gold-300 transition-colors">
                    Lupa password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 transition-all"
                    {...register('password', { required: 'Password wajib diisi' })}
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

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full mt-2"
                disabled={loading}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Masuk...</> : 'Masuk'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/" className="text-white/40 hover:text-white/70 text-sm transition-colors">
                ← Kembali ke Beranda
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
