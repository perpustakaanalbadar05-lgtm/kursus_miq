import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Download, Eye, Trash2, Filter, Users } from 'lucide-react'
import { Button, Badge, Input, Select, Modal, Alert, EmptyState, Spinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { formatDate, getStatusBadgeClass, exportToCSV } from '@/utils'
import { generateBuktiPendaftaran, downloadPdf } from '@/lib/pdf'
import * as XLSX from 'xlsx'

const badgeVariant = (status) => {
  const m = { 'Valid': 'success', 'Menunggu Validasi': 'warning', 'Ditolak': 'danger', 'Belum Bayar': 'unpaid' }
  return m[status] || 'default'
}

export default function PesertaPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterGelombang, setFilterGelombang] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [gelombangList, setGelombangList] = useState([])
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('peserta')
      .select('*, kamar(*), ruangan(*), gelombang(*)')
      .order('created_at', { ascending: false })

    if (search) query = query.or(`nama_santri.ilike.%${search}%,nomor_registrasi.ilike.%${search}%,nomor_penanggung_jawab.ilike.%${search}%`)
    if (filterStatus) query = query.eq('status_pembayaran', filterStatus)
    if (filterGelombang) query = query.eq('gelombang_id', filterGelombang)
    if (filterJenis) query = query.eq('jenis_kursus', filterJenis)

    const { data: rows } = await query
    setData(rows || [])
    setLoading(false)
  }, [search, filterStatus, filterGelombang, filterJenis])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    supabase.from('gelombang').select('*').then(({ data }) => setGelombangList(data || []))
  }, [])

  const handleDelete = async () => {
    setDeleteLoading(true)
    await supabase.from('peserta').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    setDeleteLoading(false)
    fetchData()
  }

  const handleDownloadPDF = async (peserta) => {
    const bytes = await generateBuktiPendaftaran(peserta)
    downloadPdf(bytes, `bukti-${peserta.nomor_registrasi}.pdf`)
  }

  const handleExportExcel = () => {
    const rows = data.map(p => ({
      'No. Registrasi': p.nomor_registrasi,
      'Nama Santri': p.nama_santri,
      'Nama Lembaga': p.nama_lembaga,
      'Asal Pesantren': p.asal_pesantren,
      'Penanggung Jawab': p.nama_penanggung_jawab,
      'No. HP': p.nomor_penanggung_jawab,
      'Jenis Kursus': p.jenis_kursus,
      'Kamar': p.kamar?.nama_kamar || '-',
      'Ruangan': p.ruangan?.nama_ruangan || '-',
      'Gelombang': p.gelombang?.nama || '-',
      'Status': p.status_pembayaran,
      'Tanggal Daftar': formatDate(p.created_at),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Peserta')
    XLSX.writeFile(wb, 'data-peserta-miq.xlsx')
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Daftar Peserta</h2>
          <p className="text-muted-foreground text-sm mt-1">{data.length} peserta ditemukan</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={handleExportExcel}>
            <Download size={16} /> Export Excel
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportToCSV(data, 'peserta.csv')}>
            <Download size={16} /> Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Download size={16} /> Print Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Cari nama, no. reg, no. HP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option>Belum Bayar</option>
            <option>Menunggu Validasi</option>
            <option>Valid</option>
            <option>Ditolak</option>
          </Select>
          <Select value={filterGelombang} onChange={e => setFilterGelombang(e.target.value)}>
            <option value="">Semua Gelombang</option>
            {gelombangList.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
          </Select>
          <Select value={filterJenis} onChange={e => setFilterJenis(e.target.value)}>
            <option value="">Semua Jenis</option>
            <option>Tartil Pemula</option>
            <option>Tartil Melanjutkan</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden print-area">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['No. Registrasi', 'Nama Santri', 'Jenis Kursus', 'Kamar', 'Ruangan', 'Gelombang', 'Status', 'Aksi'].map(h => (
                  <th key={h} className={`text-left py-3 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wide whitespace-nowrap ${h === 'Aksi' ? 'no-print' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12"><Spinner /></td></tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<Users size={48} />}
                      title="Belum ada peserta"
                      description="Peserta yang mendaftar akan muncul di sini."
                    />
                  </td>
                </tr>
              ) : (
                data.map((p) => (
                  <tr key={p.id} className="border-t border-border/50 tr-hover">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-miq-700">{p.nomor_registrasi}</td>
                    <td className="py-3 px-4 font-semibold whitespace-nowrap">{p.nama_santri}</td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{p.jenis_kursus}</td>
                    <td className="py-3 px-4 text-muted-foreground">{p.kamar?.nama_kamar || '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{p.ruangan?.nama_ruangan || '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{p.gelombang?.nama || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={badgeVariant(p.status_pembayaran)}>{p.status_pembayaran}</Badge>
                    </td>
                    <td className="py-3 px-4 no-print">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelected(p)} title="Detail" className="p-1.5 rounded-lg hover:bg-miq-50 text-muted-foreground hover:text-miq-700 transition-colors">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => handleDownloadPDF(p)} title="Download PDF" className="p-1.5 rounded-lg hover:bg-miq-50 text-muted-foreground hover:text-miq-700 transition-colors">
                          <Download size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(p)} title="Hapus" className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detail Peserta" className="max-w-xl">
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['No. Registrasi', selected.nomor_registrasi],
                ['Nama Santri', selected.nama_santri],
                ['Nama Lembaga', selected.nama_lembaga],
                ['Asal Pesantren', selected.asal_pesantren],
                ['Penanggung Jawab', selected.nama_penanggung_jawab],
                ['No. HP', selected.nomor_penanggung_jawab],
                ['Jenis Kursus', selected.jenis_kursus],
                ['Kamar', selected.kamar?.nama_kamar || '-'],
                ['Ruangan', selected.ruangan?.nama_ruangan || '-'],
                ['Gelombang', selected.gelombang?.nama || '-'],
                ['Status', selected.status_pembayaran],
                ['Tanggal Daftar', formatDate(selected.created_at)],
              ].map(([k, v]) => (
                <div key={k} className="bg-muted/40 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">{k}</p>
                  <p className="font-semibold text-sm">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="primary" className="flex-1" onClick={() => handleDownloadPDF(selected)}>
                <Download size={16} /> Download PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Peserta">
        <div className="space-y-4">
          <Alert type="error">
            Anda yakin ingin menghapus peserta <strong>{deleteTarget?.nama_santri}</strong>? Tindakan ini tidak dapat dibatalkan.
          </Alert>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
