import React, { useEffect, useState } from 'react'
import { Users, CreditCard, BedDouble, BookOpen, Award, Layers, TrendingUp, Clock } from 'lucide-react'
import { StatCard, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { formatDate, getStatusBadgeClass } from '@/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#1b4332', '#40916c', '#d4a017', '#74c69d', '#b7e4c7']

export default function DashboardPage() {
  const [stats, setStats] = useState({
    peserta: 0, valid: 0, kamar: 0, ruangan: 0, sertifikat: 0, gelombang: 0,
  })
  const [recentPeserta, setRecentPeserta] = useState([])
  const [chartData, setChartData] = useState([])
  const [kursusData, setKursusData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [
        { count: peserta },
        { count: valid },
        { count: kamar },
        { count: ruangan },
        { count: sertifikat },
        { count: gelombang },
        { data: recent },
        { data: gelombangList },
      ] = await Promise.all([
        supabase.from('peserta').select('*', { count: 'exact', head: true }),
        supabase.from('peserta').select('*', { count: 'exact', head: true }).eq('status_pembayaran', 'Valid'),
        supabase.from('kamar').select('*', { count: 'exact', head: true }),
        supabase.from('ruangan').select('*', { count: 'exact', head: true }),
        supabase.from('sertifikat').select('*', { count: 'exact', head: true }),
        supabase.from('gelombang').select('*', { count: 'exact', head: true }).eq('status_aktif', true),
        supabase.from('peserta').select('*, gelombang(nama)').order('created_at', { ascending: false }).limit(5),
        supabase.from('gelombang').select('*').order('created_at', { ascending: false }).limit(5),
      ])

      setStats({ peserta: peserta || 0, valid: valid || 0, kamar: kamar || 0, ruangan: ruangan || 0, sertifikat: sertifikat || 0, gelombang: gelombang || 0 })
      setRecentPeserta(recent || [])

      // ✅ FIX: Hitung peserta per gelombang secara terpisah
      const chartPromises = (gelombangList || []).map(async (g) => {
        const { count } = await supabase
          .from('peserta')
          .select('*', { count: 'exact', head: true })
          .eq('gelombang_id', g.id)
        return { name: g.nama?.substring(0, 12) || '', peserta: count || 0 }
      })
      const chartResolved = await Promise.all(chartPromises)
      setChartData(chartResolved.reverse())

      // ✅ FIX: Hitung per jenis kursus tanpa RPC
      const [{ count: pemula }, { count: melanjutkan }] = await Promise.all([
        supabase.from('peserta').select('*', { count: 'exact', head: true }).eq('jenis_kursus', 'Tartil Pemula'),
        supabase.from('peserta').select('*', { count: 'exact', head: true }).eq('jenis_kursus', 'Tartil Melanjutkan'),
      ])
      setKursusData([
        { name: 'Tartil Pemula', value: pemula || 0 },
        { name: 'Tartil Melanjutkan', value: melanjutkan || 0 },
      ])

      setLoading(false)
    }
    fetchData()
  }, [])

  const badgeVariant = (status) => {
    const m = { 'Valid': 'success', 'Menunggu Validasi': 'warning', 'Ditolak': 'danger', 'Belum Bayar': 'unpaid' }
    return m[status] || 'default'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-miq-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-miq-800 to-miq-600 rounded-2xl p-6 text-white ornament-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Selamat Datang! 👋</h2>
            <p className="text-white/70 text-sm mt-1">Ringkasan sistem Kursus MIQ hari ini</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
            <Clock size={16} className="text-gold-400" />
            <span className="text-sm">{formatDate(new Date())}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Peserta" value={stats.peserta} icon={<Users size={22} />} color="green" />
        <StatCard title="Pembayaran Valid" value={stats.valid} icon={<CreditCard size={22} />} color="gold" />
        <StatCard title="Kamar" value={stats.kamar} icon={<BedDouble size={22} />} color="blue" />
        <StatCard title="Ruangan" value={stats.ruangan} icon={<BookOpen size={22} />} color="purple" />
        <StatCard title="Sertifikat" value={stats.sertifikat} icon={<Award size={22} />} color="gold" />
        <StatCard title="Gelombang Aktif" value={stats.gelombang} icon={<Layers size={22} />} color="green" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Peserta per Gelombang</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #dcfce7' }}
                  formatter={(v) => [v, 'Peserta']}
                />
                <Bar dataKey="peserta" fill="#40916c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Jenis Kursus</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={kursusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {kursusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 mt-2">
              {kursusData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="ml-auto font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Registrations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Pendaftar Terbaru</CardTitle>
          <a href="/admin/peserta" className="text-miq-600 hover:text-miq-700 text-sm font-semibold">
            Lihat Semua →
          </a>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground font-semibold text-xs uppercase tracking-wide">No. Registrasi</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-semibold text-xs uppercase tracking-wide">Nama Santri</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-semibold text-xs uppercase tracking-wide">Jenis Kursus</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-semibold text-xs uppercase tracking-wide">Gelombang</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-semibold text-xs uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPeserta.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada pendaftar</td></tr>
                ) : (
                  recentPeserta.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 tr-hover">
                      <td className="py-3 px-2 font-mono text-xs text-miq-700 font-semibold">{p.nomor_registrasi}</td>
                      <td className="py-3 px-2 font-semibold">{p.nama_santri}</td>
                      <td className="py-3 px-2 text-muted-foreground">{p.jenis_kursus}</td>
                      <td className="py-3 px-2 text-muted-foreground">{p.gelombang?.nama || '-'}</td>
                      <td className="py-3 px-2">
                        <Badge variant={badgeVariant(p.status_pembayaran)}>{p.status_pembayaran}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
