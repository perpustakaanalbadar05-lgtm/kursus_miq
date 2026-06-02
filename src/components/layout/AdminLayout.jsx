import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/utils'
import { useAuthStore, useAppStore } from '@/store'
import {
  LayoutDashboard, Users, CreditCard, BedDouble, BookOpen,
  Layers, Award, Settings, LogOut, Menu, X, ChevronDown,
  Bell, Search, BookMarked
} from 'lucide-react'

const navItems = [
  {
    label: 'Dashboard', icon: LayoutDashboard, href: '/admin',
  },
  {
    label: 'Peserta', icon: Users, href: '/admin/peserta',
  },
  {
    label: 'Pembayaran', icon: CreditCard, href: '/admin/pembayaran',
  },
  {
    label: 'Kamar', icon: BedDouble, href: '/admin/kamar',
  },
  {
    label: 'Ruangan', icon: BookOpen, href: '/admin/ruangan',
  },
  {
    label: 'Gelombang', icon: Layers, href: '/admin/gelombang',
  },
  {
    label: 'Sertifikat', icon: Award, href: '/admin/sertifikat',
  },
  {
    label: 'Pengaturan', icon: Settings, href: '/admin/pengaturan',
  },
]

export default function AdminLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center shadow-lg">
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display text-white font-bold text-sm leading-tight">MIQ Kursus</p>
            <p className="text-white/50 text-xs">PP Miftahul Ulum</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.href ||
            (item.href !== '/admin' && location.pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                active
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
              <span>{item.label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Profile */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-miq-400 to-gold-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {profile?.nama?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{profile?.nama || 'Admin'}</p>
            <p className="text-white/50 text-xs capitalize">{profile?.role || 'admin'}</p>
          </div>
          <button onClick={handleLogout} title="Logout" className="text-white/40 hover:text-red-400 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col w-64 bg-miq-800 transition-all duration-300 flex-shrink-0',
        !sidebarOpen && 'w-0 overflow-hidden'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-miq-800 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-card border-b border-border px-4 lg:px-6 py-3.5 flex items-center gap-4 flex-shrink-0 shadow-sm">
          <button
            onClick={() => { toggleSidebar(); setMobileOpen(v => !v) }}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb title */}
          <div className="flex-1">
            <h1 className="font-display text-lg font-semibold text-foreground">
              {navItems.find(n => n.href === location.pathname || (n.href !== '/admin' && location.pathname.startsWith(n.href)))?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-miq-500 to-gold-500 flex items-center justify-center text-white font-bold text-sm">
              {profile?.nama?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
