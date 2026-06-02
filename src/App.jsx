import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'

// Public Pages
import LandingPage from '@/pages/public/LandingPage'
import DaftarPage from '@/pages/public/DaftarPage'
import VerifyPage from '@/pages/public/VerifyPage'

// Admin Pages
import LoginPage from '@/pages/admin/LoginPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import PesertaPage from '@/pages/admin/PesertaPage'
import PembayaranPage from '@/pages/admin/PembayaranPage'
import KamarPage from '@/pages/admin/KamarPage'
import RuanganPage from '@/pages/admin/RuanganPage'
import GelombangPage from '@/pages/admin/GelombangPage'
import SertifikatPage from '@/pages/admin/SertifikatPage'
import PengaturanPage from '@/pages/admin/PengaturanPage'

// Admin Layout
import AdminLayout from '@/components/layout/AdminLayout'

function ProtectedRoute({ children }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/admin/login" replace />
  return children
}

function AdminRoute({ children }) {
  return (
    <ProtectedRoute>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  )
}

function AppInit() {
  const { checkSession } = useAuthStore()
  useEffect(() => { checkSession() }, [])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInit />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/daftar" element={<DaftarPage />} />
        <Route path="/verify/:code" element={<VerifyPage />} />

        {/* Auth */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin Protected */}
        <Route path="/admin" element={<AdminRoute><DashboardPage /></AdminRoute>} />
        <Route path="/admin/peserta" element={<AdminRoute><PesertaPage /></AdminRoute>} />
        <Route path="/admin/pembayaran" element={<AdminRoute><PembayaranPage /></AdminRoute>} />
        <Route path="/admin/kamar" element={<AdminRoute><KamarPage /></AdminRoute>} />
        <Route path="/admin/ruangan" element={<AdminRoute><RuanganPage /></AdminRoute>} />
        <Route path="/admin/gelombang" element={<AdminRoute><GelombangPage /></AdminRoute>} />
        <Route path="/admin/sertifikat" element={<AdminRoute><SertifikatPage /></AdminRoute>} />
        <Route path="/admin/pengaturan" element={<AdminRoute><PengaturanPage /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
