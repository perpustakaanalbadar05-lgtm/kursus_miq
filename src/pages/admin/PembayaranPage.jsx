import React, { useEffect, useState, useCallback } from 'react'
import { Check, X, Eye, CreditCard, Upload, Loader2, Printer, RotateCcw } from 'lucide-react'
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
  const [printData, setPrintData] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedRows, setSelectedRows] = useState([])
  const [jenisKursusMap, setJenisKursusMap] = useState({}) // Untuk nyimpan data biaya per kursus

  // Ambil data jenis kursus (jika tabelnya sudah dibuat)
  useEffect(() => {
    supabase.from('jenis_kursus').select('*').then(({ data }) => {
      if (data) {
        const map = {}
        data.forEach(d => map[d.nama] = d.biaya)
        setJenisKursusMap(map)
      }
    })
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('pembayaran')
      .select('*, peserta(*, gelombang(nama))')
      .order('created_at', { ascending: false })

    const { data: rows } = await query
    setData(rows || [])
    setLoading(false)
  }, [])

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

  const handleCancel = async (pembayaranId, pesertaId) => {
    if (!window.confirm('Yakin ingin membatalkan status pembayaran ini menjadi Belum Bayar?')) return
    setActionLoading(true)
    await Promise.all([
      supabase.from('pembayaran').update({ status: 'Belum Bayar', catatan: 'Dibatalkan admin', validated_by: profile?.id, validated_at: null }).eq('id', pembayaranId),
      supabase.from('peserta').update({ status_pembayaran: 'Belum Bayar' }).eq('id', pesertaId),
    ])
    setSelected(null)
    setActionLoading(false)
    fetchData()
  }

  const handlePrintKuitansi = (pesertaList) => {
    if (!pesertaList || pesertaList.length === 0) return
    
    // Group by first person's penanggung jawab
    const pj = pesertaList[0].peserta?.nama_penanggung_jawab
    const hp = pesertaList[0].peserta?.nomor_penanggung_jawab
    
    setPrintData({
      penanggung_jawab: pj,
      nomor_hp: hp,
      tanggal: new Date().toISOString(),
      items: pesertaList.map(p => p.peserta)
    })
    
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const handleBulkPrint = () => {
    const selectedData = data.filter(d => selectedRows.includes(d.id) && d.status === 'Valid')
    if (selectedData.length === 0) return alert('Pilih setidaknya 1 pembayaran yang berstatus Valid.')
    handlePrintKuitansi(selectedData)
  }

  // Count pending
  const pendingCount = data.filter(d => d.status === 'Menunggu Validasi').length

  const filteredData = data.filter(d => {
    const matchStatus = filterStatus ? d.status === filterStatus : true
    const matchSearch = search ? (
      d.peserta?.nama_santri?.toLowerCase().includes(search.toLowerCase()) || 
      d.peserta?.nama_penanggung_jawab?.toLowerCase().includes(search.toLowerCase())
    ) : true
    return matchStatus && matchSearch
  })

  const toggleSelectAll = () => {
    if (selectedRows.length === filteredData.length) setSelectedRows([])
    else setSelectedRows(filteredData.map(d => d.id))
  }

  const toggleSelectRow = (id) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id])
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Pembayaran</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {filterStatus === 'Menunggu Validasi' && pendingCount > 0
              ? <span className="text-amber-600 font-semibold">{pendingCount} pembayaran menunggu validasi</span>
              : `${filteredData.length} data ditemukan`
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

      {/* Action Bar & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cari santri atau penanggung jawab..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-miq-500/50"
          />
        </div>
        {selectedRows.length > 0 && (
          <Button variant="primary" onClick={handleBulkPrint}>
            <Printer size={16} /> Cetak Kuitansi Terpilih ({selectedRows.length})
          </Button>
        )}
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
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" checked={selectedRows.length > 0 && selectedRows.length === filteredData.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-border accent-miq-600" />
                </th>
                {['Peserta', 'Penanggung Jawab', 'Jenis Kursus', 'Tanggal Upload', 'Status', 'Aksi'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center"><Spinner /></td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={<CreditCard size={48} />} title="Tidak ada data" description="Tidak ada pembayaran dengan filter ini." /></td></tr>
              ) : (
                filteredData.map((p) => (
                  <tr key={p.id} className="border-t border-border/50 tr-hover cursor-pointer" onClick={(e) => {
                    if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SVG' && e.target.tagName !== 'path' && e.target.type !== 'checkbox') {
                      toggleSelectRow(p.id)
                    }
                  }}>
                    <td className="py-3 px-4">
                      <input type="checkbox" checked={selectedRows.includes(p.id)} onChange={() => toggleSelectRow(p.id)} className="w-4 h-4 rounded border-border accent-miq-600" />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold">{p.peserta?.nama_santri}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.peserta?.nomor_registrasi}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm">{p.peserta?.nama_penanggung_jawab}</p>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{p.peserta?.jenis_kursus}</td>
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
                        {(p.status === 'Valid' || p.status === 'Ditolak') && (
                          <button onClick={() => handleCancel(p.id, p.peserta_id)} title="Batalkan" className="p-1.5 rounded-lg hover:bg-amber-50 text-muted-foreground hover:text-amber-600 transition-colors">
                            <RotateCcw size={15} />
                          </button>
                        )}
                        {p.status === 'Valid' && (
                          <button onClick={(e) => { e.stopPropagation(); handlePrintKuitansi([p]) }} title="Cetak Kuitansi" className="p-1.5 rounded-lg hover:bg-miq-50 text-muted-foreground hover:text-miq-700 transition-colors">
                            <Printer size={15} />
                          </button>
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

      {/* Hidden Kuitansi Print Template */}
      {printData && (
        <div className="hidden print-area print:block bg-white p-8 absolute top-0 left-0 w-full min-h-screen z-50 text-black">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold uppercase">Kuitansi Pembayaran Kursus</h1>
            <p className="text-lg">Madrasah Ilmu Al Quran PP Miftahul Ulum Panyeppen</p>
          </div>
          
          <div className="flex justify-between mb-8">
            <div>
              <p className="mb-1"><span className="inline-block w-32 font-semibold">Telah terima dari</span>: {printData.penanggung_jawab}</p>
              <p className="mb-1"><span className="inline-block w-32 font-semibold">Nomor HP</span>: {printData.nomor_hp}</p>
            </div>
            <div className="text-right">
              <p className="mb-1"><span className="font-semibold">Tanggal</span>: {formatDate(printData.tanggal)}</p>
            </div>
          </div>

          <table className="w-full border-collapse border border-black mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-4 py-2">No</th>
                <th className="border border-black px-4 py-2">Nama Santri</th>
                <th className="border border-black px-4 py-2">Kamar/Ruang</th>
                <th className="border border-black px-4 py-2">Jenis Kursus</th>
                <th className="border border-black px-4 py-2">Status</th>
                <th className="border border-black px-4 py-2">Biaya</th>
              </tr>
            </thead>
            <tbody>
              {printData.items.map((item, idx) => {
                const biaya = jenisKursusMap[item.jenis_kursus] || 150000 // Fallback ke 150rb jika blm ada di db
                return (
                  <tr key={idx}>
                    <td className="border border-black px-4 py-2 text-center">{idx + 1}</td>
                    <td className="border border-black px-4 py-2">
                      <p className="font-semibold">{item.nama_santri}</p>
                      <p className="text-xs">{item.nomor_registrasi}</p>
                    </td>
                    <td className="border border-black px-4 py-2 text-center">
                      <p className="font-semibold">{item.kamar?.nama_kamar || '-'}</p>
                      <p className="text-xs">{item.ruangan?.nama_ruangan || '-'}</p>
                    </td>
                    <td className="border border-black px-4 py-2 text-center">{item.jenis_kursus}</td>
                    <td className="border border-black px-4 py-2 text-center">{item.status_pembayaran}</td>
                    <td className="border border-black px-4 py-2 text-right">
                      Rp {item.status_pembayaran === 'Valid' ? biaya.toLocaleString('id-ID') : 0}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="5" className="border border-black px-4 py-2 font-bold text-right">TOTAL KESELURUHAN</td>
                <td className="border border-black px-4 py-2 font-bold text-right">
                  Rp {(printData.items.reduce((acc, item) => {
                    const biaya = jenisKursusMap[item.jenis_kursus] || 150000
                    return acc + (item.status_pembayaran === 'Valid' ? biaya : 0)
                  }, 0)).toLocaleString('id-ID')}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="flex justify-between mt-16 px-12">
            <div className="text-center">
              <p className="mb-20">Penyetor</p>
              <p className="font-bold border-b border-black inline-block px-4">{printData.penanggung_jawab}</p>
            </div>
            <div className="text-center">
              <p className="mb-20">Penerima / Bendahara</p>
              <p className="font-bold border-b border-black inline-block px-4">( {profile?.user_metadata?.nama || profile?.email || '...................................'} )</p>
            </div>
          </div>
          
          <div className="mt-10 p-4 bg-gray-100 border rounded no-print">
            <p className="font-semibold mb-2">Aksi Kuitansi</p>
            <div className="flex items-center gap-2">
              <Button onClick={() => window.print()} variant="primary" size="sm">Print Ulang</Button>
              <Button onClick={() => setPrintData(null)} variant="secondary" size="sm">Tutup Kuitansi</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
