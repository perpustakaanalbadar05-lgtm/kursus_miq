import React, { useEffect, useState, useCallback } from 'react'
import { Check, X, Eye, CreditCard, Upload, Loader2 } from 'lucide-react'
import { Button, Badge, Select, Modal, Alert, EmptyState, Spinner, Card, CardContent } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils'
import { useAuthStore } from '@/store'

const badgeVariant = (s) => ({ 'Valid': 'success', 'Menunggu Validasi': 'warning', 'Ditolak': 'danger', 'Belum Bayar': 'unpaid' }[s] || 'default')

export default function PembayaranPage() {
  const { profile } = useAuthStore()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('Menunggu Validasi')
  const [selected, setSelected] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [catatan, setCatatan] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('pembayaran')
      .select('*, peserta(*, gelombang(nama))')
      .order('created_at', { ascending: false })

    if (filterStatus) query = query.eq('status', filterStatus)

    const { data: rows } = await query
    setData(rows || [])
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { fetchData() }, [fetchData])

  const handleApprove = async (pembayaranId, pesertaId) => {
    setActionLoading(true)
    await Promise.all([
      supabase.from('pembayaran').update({ status: 'Valid', catatan, validated_by: profile?.id, validated_at: new Date().toISOString() }).eq('id', pembayaranId),
      supabase.from('peserta').update({ status_pembayaran: 'Valid' }).eq('id', pesertaId),
    ])
    setSelected(null)
    setActionLoading(false)
    fetchData()
  }

  const handleReject = async (pembayaranId, pesertaId) => {
    setActionLoading(true)
    await Promise.all([
      supabase.from('pembayaran').update({ status: 'Ditolak', catatan, validated_by: profile?.id, validated_at: new Date().toISOString() }).eq('id', pembayaranId),
      supabase.from('peserta').update({ status_pembayaran: 'Ditolak' }).eq('id', pesertaId),
    ])
    setSelected(null)
    setActionLoading(false)
    fetchData()
  }

  // Count pending
  const pendingCount = data.filter(d => d.status === 'Menunggu Validasi').length

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Pembayaran</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {filterStatus === 'Menunggu Validasi' && pendingCount > 0
              ? <span className="text-amber-600 font-semibold">{pendingCount} pembayaran menunggu validasi</span>
              : `${data.length} data ditemukan`
            }
          </p>
        </div>
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-48">
          <option value="">Semua Status</option>
          <option>Belum Bayar</option>
          <option>Menunggu Validasi</option>
          <option>Valid</option>
          <option>Ditolak</option>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Belum Bayar', key: 'Belum Bayar', color: 'bg-gray-100 text-gray-700' },
          { label: 'Menunggu', key: 'Menunggu Validasi', color: 'bg-amber-100 text-amber-700' },
          { label: 'Valid', key: 'Valid', color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Ditolak', key: 'Ditolak', color: 'bg-red-100 text-red-700' },
        ].map(s => {
          const count = data.filter(d => d.status === s.key).length
          return (
            <div key={s.key} className={`${s.color} rounded-2xl p-4 text-center cursor-pointer border-2 transition-all ${filterStatus === s.key ? 'border-current scale-105' : 'border-transparent'}`}
              onClick={() => setFilterStatus(filterStatus === s.key ? '' : s.key)}>
              <p className="text-3xl font-bold">{count}</p>
              <p className="text-sm font-medium mt-1">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Peserta', 'Jenis Kursus', 'Gelombang', 'Tanggal Upload', 'Status', 'Aksi'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><Spinner /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={<CreditCard size={48} />} title="Tidak ada data" description="Tidak ada pembayaran dengan filter ini." /></td></tr>
              ) : (
                data.map((p) => (
                  <tr key={p.id} className="border-t border-border/50 tr-hover">
                    <td className="py-3 px-4">
                      <p className="font-semibold">{p.peserta?.nama_santri}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.peserta?.nomor_registrasi}</p>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{p.peserta?.jenis_kursus}</td>
                    <td className="py-3 px-4 text-muted-foreground">{p.peserta?.gelombang?.nama || '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(p.created_at)}</td>
                    <td className="py-3 px-4"><Badge variant={badgeVariant(p.status)}>{p.status}</Badge></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelected(p); setCatatan('') }} title="Detail" className="p-1.5 rounded-lg hover:bg-miq-50 text-muted-foreground hover:text-miq-700 transition-colors">
                          <Eye size={15} />
                        </button>
                        {(p.status === 'Menunggu Validasi' || p.status === 'Belum Bayar') && (
                          <>
                            <button onClick={() => handleApprove(p.id, p.peserta_id)} title="Approve (Bayar Lunas)" className="p-1.5 rounded-lg hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600 transition-colors">
                              <Check size={15} />
                            </button>
                            {p.status === 'Menunggu Validasi' && (
                              <button onClick={() => setSelected({ ...p, showReject: true })} title="Reject" className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                                <X size={15} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail / Validasi Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detail Pembayaran" className="max-w-xl">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Nama Santri', selected.peserta?.nama_santri],
                ['No. Registrasi', selected.peserta?.nomor_registrasi],
                ['Jenis Kursus', selected.peserta?.jenis_kursus],
                ['Gelombang', selected.peserta?.gelombang?.nama || '-'],
                ['Status', selected.status],
                ['Upload', formatDate(selected.created_at)],
              ].map(([k, v]) => (
                <div key={k} className="bg-muted/40 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">{k}</p>
                  <p className="font-semibold text-sm">{v}</p>
                </div>
              ))}
            </div>

            {/* Bukti Transfer Preview */}
            {selected.bukti_transfer_url ? (
              <div className="rounded-xl overflow-hidden border border-border">
                <img src={selected.bukti_transfer_url} alt="Bukti Transfer" className="w-full max-h-60 object-contain bg-muted" />
              </div>
            ) : (
              <div className="bg-muted/40 rounded-xl p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada bukti transfer diupload</p>
              </div>
            )}

            {/* Catatan */}
            {(selected.status === 'Menunggu Validasi' || selected.status === 'Belum Bayar') && (
              <div className="space-y-2">
                <label className="text-sm font-semibold">Catatan (opsional)</label>
                <textarea
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-miq-500/50"
                  rows={2}
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder={selected.status === 'Belum Bayar' ? "Contoh: Bayar tunai di tempat" : "Tambahkan catatan validasi..."}
                />
              </div>
            )}

            {(selected.status === 'Menunggu Validasi' || selected.status === 'Belum Bayar') && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="success"
                  className="flex-1"
                  onClick={() => handleApprove(selected.id, selected.peserta_id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {selected.status === 'Belum Bayar' ? 'Setujui (Bayar Tunai)' : 'Setujui'}
                </Button>
                {selected.status === 'Menunggu Validasi' && (
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => handleReject(selected.id, selected.peserta_id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                    Tolak
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
