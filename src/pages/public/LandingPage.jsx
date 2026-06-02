import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookMarked, Menu, X, Phone, Mail, MapPin, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/utils'

// ── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={cn(
      'fixed top-0 inset-x-0 z-50 transition-all duration-300',
      scrolled ? 'bg-miq-800/95 backdrop-blur-md shadow-lg shadow-miq-900/30' : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center shadow-lg">
              <BookMarked className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-white text-sm leading-tight block">MIQ Kursus</span>
              <span className="text-gold-400 text-xs">PP Miftahul Ulum</span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {['#profil', '#keunggulan', '#alur', '#faq', '#kontak'].map((href, i) => (
              <a
                key={href}
                href={href}
                className="text-white/75 hover:text-white text-sm font-medium transition-colors"
              >
                {['Profil', 'Keunggulan', 'Alur Daftar', 'FAQ', 'Kontak'][i]}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/cek-status">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                Cek Status
              </Button>
            </Link>
            <Link to="/daftar">
              <Button variant="gold" size="sm">Daftar Sekarang</Button>
            </Link>
            <Link to="/admin/login">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                Admin
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-white/80 hover:bg-white/10"
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-miq-800/98 backdrop-blur-md border-t border-white/10 px-4 py-4 space-y-2">
          {['Profil', 'Keunggulan', 'Alur Daftar', 'FAQ', 'Kontak'].map((label, i) => (
            <a
              key={i}
              href={['#profil', '#keunggulan', '#alur', '#faq', '#kontak'][i]}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-white/75 hover:text-white text-sm font-medium"
            >
              {label}
            </a>
          ))}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <Link to="/daftar" onClick={() => setMobileOpen(false)}>
              <Button variant="gold" size="md" className="w-full">Daftar Sekarang</Button>
            </Link>
            <Link to="/cek-status" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" size="md" className="w-full text-white border-white/30 hover:bg-white/10">
                Cek Status Pendaftaran
              </Button>
            </Link>
            <Link to="/admin/login" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full text-white/60 hover:text-white hover:bg-white/10">
                Admin Login
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ── HERO ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-miq-800">
      {/* Background layers */}
      <div className="absolute inset-0 bg-islamic-pattern opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-miq-900/80 via-miq-800/60 to-miq-900/90" />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-miq-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold-500/15 rounded-full blur-3xl" />

      <div className="relative max-w-5xl mx-auto px-4 text-center py-32">
        {/* Arabic calligraphy decoration */}
        <div className="mb-6">
          <span className="inline-block bg-gold-500/20 border border-gold-500/40 text-gold-400 text-sm font-semibold px-5 py-2 rounded-full tracking-wider">
            ﷽ بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
          </span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Kursus Madrasah
          <br />
          <span className="gold-shimmer">Ilmu Al Quran</span>
        </h1>

        <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
          Program pembelajaran Al Quran terstruktur di bawah bimbingan para ahli
          di <span className="text-gold-400 font-semibold">Pondok Pesantren Miftahul Ulum Panyeppen</span>
        </p>

        <p className="text-miq-300 text-sm italic mb-10">
          "Sebaik-baik kalian adalah yang mempelajari Al Quran dan mengajarkannya." — HR. Bukhari
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/daftar">
            <Button variant="gold" size="xl" className="group w-full sm:w-auto">
              Daftar Sekarang
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/cek-status">
            <Button size="xl" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20">
              Cek Status Pendaftaran
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-xl mx-auto">
          {[
            { value: '2 Kursus', label: 'Jenis Program' },
            { value: '100+', label: 'Peserta/Gelombang' },
            { value: '100%', label: 'Digital & Modern' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-2xl font-bold text-gold-400">{s.value}</p>
              <p className="text-white/60 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
        <span className="text-xs">Scroll</span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </div>
    </section>
  )
}

// ── PROFIL PROGRAM ────────────────────────────────────────────────────────────
function ProfilSection() {
  return (
    <section id="profil" className="py-24 bg-gradient-to-b from-miq-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <span className="inline-block bg-miq-100 text-miq-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Tentang Program
            </span>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-miq-800 mb-6 leading-tight">
              Madrasah Ilmu <span className="text-miq-500">Al Quran</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Program Kursus Madrasah Ilmu Al Quran merupakan program intensif yang dirancang untuk
              meningkatkan kemampuan membaca Al Quran secara tartil dan benar sesuai kaidah tajwid,
              di bawah bimbingan para pengajar berpengalaman.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Program ini berlangsung beberapa hari dengan metode pembelajaran yang terarah, terstruktur,
              dan menggunakan sistem administrasi modern sehingga memudahkan peserta dan panitia dalam
              setiap proses kegiatan.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Tartil Pemula', desc: 'Untuk pemula yang ingin belajar dasar-dasar tilawah' },
                { label: 'Tartil Melanjutkan', desc: 'Untuk yang sudah bisa membaca dan ingin meningkatkan kualitas' },
              ].map((k) => (
                <div key={k.label} className="bg-miq-50 rounded-2xl p-4 border border-miq-100">
                  <p className="font-semibold text-miq-700 text-sm mb-1">{k.label}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{k.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visual card */}
          <div className="relative">
            <div className="bg-miq-800 rounded-3xl p-8 text-white shadow-2xl shadow-miq-800/30 ornament-border">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gold-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookMarked className="w-10 h-10 text-gold-400" />
                </div>
                <h3 className="font-display text-2xl font-bold">PP Miftahul Ulum</h3>
                <p className="text-white/60 text-sm mt-1">Panyeppen, Madura</p>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Program', value: 'Kursus MIQ' },
                  { label: 'Jenis Kursus', value: 'Tartil Pemula & Melanjutkan' },
                  { label: 'Sistem', value: 'Digital & Otomatis' },
                  { label: 'Sertifikat', value: 'Resmi & Terverifikasi' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                    <span className="text-white/60 text-sm">{item.label}</span>
                    <span className="text-gold-400 text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Decorative */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gold-500/20 rounded-2xl blur-lg" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-miq-400/20 rounded-2xl blur-lg" />
          </div>
        </div>
      </div>
    </section>
  )
}

// ── KEUNGGULAN ────────────────────────────────────────────────────────────────
function KeunggulanSection() {
  const items = [
    {
      icon: '📖',
      title: 'Pembelajaran Terarah',
      desc: 'Kurikulum terstruktur dengan metode yang terbukti efektif meningkatkan kemampuan tilawah.',
    },
    {
      icon: '👨‍🏫',
      title: 'Pembimbing Berpengalaman',
      desc: 'Diasuh oleh para pengajar bersanad yang berpengalaman di bidang ilmu Al Quran.',
    },
    {
      icon: '💻',
      title: 'Administrasi Modern',
      desc: 'Sistem digital untuk pendaftaran, pembayaran, kamar, dan sertifikat secara otomatis.',
    },
    {
      icon: '🎓',
      title: 'Sertifikat Resmi',
      desc: 'Mendapatkan sertifikat resmi berQR code yang dapat diverifikasi kapan saja.',
    },
  ]

  return (
    <section id="keunggulan" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block bg-gold-100 text-gold-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Mengapa MIQ Kursus?
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-miq-800 mb-4">
            Keunggulan Program
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Dirancang untuk memberikan pengalaman belajar Al Quran yang terbaik dan paling efektif.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="group bg-white rounded-3xl p-8 border border-miq-100 shadow-sm hover:shadow-xl hover:shadow-miq-100/80 hover:-translate-y-2 transition-all duration-300"
            >
              <div className="text-5xl mb-6">{item.icon}</div>
              <h3 className="font-display text-xl font-bold text-miq-800 mb-3">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              <div className="mt-6 w-12 h-1 bg-gradient-to-r from-miq-500 to-gold-500 rounded-full group-hover:w-full transition-all duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── ALUR PENDAFTARAN ─────────────────────────────────────────────────────────
function AlurSection() {
  const steps = [
    { no: '01', label: 'Daftar', desc: 'Isi formulir pendaftaran online dengan data lengkap', icon: '📝' },
    { no: '02', label: 'Pembayaran', desc: 'Lakukan pembayaran dan upload bukti transfer', icon: '💳' },
    { no: '03', label: 'Validasi', desc: 'Admin memvalidasi pembayaran dalam 1×24 jam', icon: '✅' },
    { no: '04', label: 'Penempatan', desc: 'Sistem otomatis menentukan kamar dan ruangan', icon: '🏠' },
    { no: '05', label: 'Kursus', desc: 'Ikuti program kursus sesuai jadwal yang ditentukan', icon: '📚' },
    { no: '06', label: 'Sertifikat', desc: 'Dapatkan sertifikat resmi setelah menyelesaikan kursus', icon: '🎓' },
  ]

  return (
    <section id="alur" className="py-24 bg-gradient-to-br from-miq-800 to-miq-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-islamic-pattern opacity-10" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block bg-gold-500/20 border border-gold-500/30 text-gold-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Proses Pendaftaran
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
            Alur Pendaftaran
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Proses pendaftaran yang mudah dan cepat, semua dilakukan secara digital.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500/30 to-gold-600/20 border border-gold-500/30 flex items-center justify-center text-2xl">
                    {step.icon}
                  </div>
                </div>
                <div>
                  <span className="text-gold-400 text-xs font-bold tracking-widest">LANGKAH {step.no}</span>
                  <h3 className="font-display text-xl font-bold text-white mt-1 mb-2">{step.label}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
              {/* Connector */}
              {i < steps.length - 1 && i % 3 !== 2 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gold-500/30" />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/daftar">
            <Button variant="gold" size="xl">
              Mulai Daftar Sekarang <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null)

  const faqs = [
    {
      q: 'Siapa yang bisa mendaftar program Kursus MIQ?',
      a: 'Program ini terbuka untuk seluruh santri dari berbagai pondok pesantren yang ingin meningkatkan kemampuan membaca Al Quran secara tartil dan benar.',
    },
    {
      q: 'Apa perbedaan Tartil Pemula dan Tartil Melanjutkan?',
      a: 'Tartil Pemula ditujukan untuk peserta yang baru belajar dasar-dasar membaca Al Quran. Tartil Melanjutkan untuk peserta yang sudah bisa membaca Al Quran dan ingin meningkatkan kualitas tilawah sesuai kaidah tajwid.',
    },
    {
      q: 'Bagaimana proses pembayaran?',
      a: 'Setelah mendaftar, peserta melakukan transfer ke rekening yang ditentukan kemudian mengupload bukti transfer melalui sistem. Admin akan memvalidasi dalam 1×24 jam.',
    },
    {
      q: 'Apakah kamar dan ruangan ditentukan otomatis?',
      a: 'Ya, sistem secara otomatis akan mengalokasikan kamar dan ruangan berdasarkan urutan pendaftaran dan jenis kursus yang dipilih.',
    },
    {
      q: 'Bagaimana cara mendapatkan sertifikat?',
      a: 'Sertifikat akan diterbitkan setelah peserta menyelesaikan program kursus. Sertifikat dapat diunduh secara digital dalam format PDF dan dilengkapi dengan QR code untuk verifikasi.',
    },
    {
      q: 'Bagaimana cara bergabung ke grup WhatsApp?',
      a: 'Link grup WhatsApp akan diberikan setelah pendaftaran berhasil divalidasi, baik melalui halaman konfirmasi maupun dalam bukti pendaftaran PDF.',
    },
  ]

  return (
    <section id="faq" className="py-24 bg-miq-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block bg-miq-100 text-miq-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            FAQ
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-miq-800 mb-4">
            Pertanyaan Umum
          </h2>
          <p className="text-muted-foreground text-lg">
            Temukan jawaban atas pertanyaan yang sering ditanyakan.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-miq-100 overflow-hidden shadow-sm">
              <button
                className="w-full flex items-center justify-between p-6 text-left hover:bg-miq-50/50 transition-colors"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span className="font-semibold text-miq-800 pr-4">{faq.q}</span>
                <ChevronDown className={cn('w-5 h-5 text-miq-500 flex-shrink-0 transition-transform', openIdx === i && 'rotate-180')} />
              </button>
              {openIdx === i && (
                <div className="px-6 pb-6">
                  <p className="text-muted-foreground text-sm leading-relaxed border-t border-miq-100 pt-4">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── KONTAK ────────────────────────────────────────────────────────────────────
function KontakSection() {
  return (
    <section id="kontak" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-miq-800 mb-4">Hubungi Kami</h2>
          <p className="text-muted-foreground text-lg">Butuh informasi lebih lanjut? Jangan ragu untuk menghubungi kami.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            {
              icon: <Phone className="w-6 h-6" />,
              label: 'WhatsApp',
              value: '+62 812-XXXX-XXXX',
              href: 'https://wa.me/62812XXXXXXXX',
              color: 'from-emerald-500 to-emerald-600',
            },
            {
              icon: <Mail className="w-6 h-6" />,
              label: 'Email',
              value: 'miq@miftahululum.ac.id',
              href: 'mailto:miq@miftahululum.ac.id',
              color: 'from-blue-500 to-blue-600',
            },
            {
              icon: <MapPin className="w-6 h-6" />,
              label: 'Alamat',
              value: 'PP Miftahul Ulum Panyeppen, Madura',
              href: '#',
              color: 'from-miq-600 to-miq-700',
            },
          ].map((item, i) => (
            <a
              key={i}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white border border-miq-100 rounded-3xl p-8 text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 shadow-sm"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <p className="font-semibold text-miq-700 mb-1">{item.label}</p>
              <p className="text-muted-foreground text-sm">{item.value}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FOOTER ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-miq-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white">MIQ Kursus</p>
              <p className="text-white/50 text-xs">PP Miftahul Ulum Panyeppen</p>
            </div>
          </div>
          <p className="text-white/40 text-sm text-center">
            © {new Date().getFullYear()} Madrasah Ilmu Al Quran — Pondok Pesantren Miftahul Ulum Panyeppen. All rights reserved.
          </p>
          <Link to="/admin/login" className="text-white/40 hover:text-white/70 text-sm transition-colors">
            Admin Panel →
          </Link>
        </div>
      </div>
    </footer>
  )
}

// ── LANDING PAGE EXPORT ───────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="font-body">
      <Navbar />
      <HeroSection />
      <ProfilSection />
      <KeunggulanSection />
      <AlurSection />
      <FAQSection />
      <KontakSection />
      <Footer />
    </div>
  )
}
