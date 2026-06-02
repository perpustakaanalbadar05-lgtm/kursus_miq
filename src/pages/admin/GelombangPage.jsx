import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2, Layers, Power, Loader2, Calendar } from 'lucide-react'
import { Button, Input, Modal, Alert, EmptyState, Spinner, Badge } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { formatDate } from '@/utils'

export default function GelombangPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [delTarget, setDelTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: rows } = await supabase
      .from('gelombang')
      .select('*, peserta(count)')
      .order('created_at', { ascending: false })
    setData(rows || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openAdd = () => { setEditing(null); reset({ status_aktif: true }); setShowModal(true) }
  const openEdit = (row) => { setEditing(row); reset(row); setShowModal(true) }

  const onSave = handleSubmit(async (vals) => {
    setSaving(true)
    const payload = { ...vals, kuota: +vals.kuota, tahun: +vals.tahun, status_aktif: vals.status_aktif === 'true' || vals.status_aktif === true }
    if (editing) {
      await supabase.from('gelombang').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('gelombang').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    fetchData()
  })

  const toggleStatus = async (g) => {
    await supabase.from('gelombang').update({ status_aktif: !g.status_aktif }).eq('id', g.id)
    fetchData()
  }

  const handleDelete = async () => {
    await supabase.from('gelombang').delete().eq('id', delTarget.id)
    setDelTarget(null)
    fetchData()
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Manajemen Gelombang</h2>
          <p className="text-muted-foreground text-sm mt-1">{data.length} gelombang terdaftar</p>
        </div>
        <Button variant="primary" onClick={openAdd}><Plus size={16} /> Tambah Gelombang</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={<Layers size={48} />} title="Belum ada gelombang" description="Buat gelombang kursus pertama Anda."
          action={<Button variant="primary" onClick={openAdd}><Plus size={16} /> Tambah Gelombang</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((g) => {
            const pesertaCount = g.peserta?.[0]?.count || 0
            const fillPct = Math.round((pesertaCount / (g.kuota || 1)) * 100)
            return (
              <div key={g.id} className={`bg-card rounded-2xl border p-5 hover:shadow-lg transition-all duration-200 ${g.status_aktif ? 'border-miq-200 ring-1 ring-miq-100' : 'border-border opacity-75'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-miq-700 to-miq-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                    {g.tahun?.toString().slice(-2)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={g.status_aktif ? 'success' : 'default'}>
                      {g.status_aktif ? 'Aktif' : 'Tutup'}
                    </Badge>
                  </div>
                </div>

                <h3 className="font-display font-bold text-lg leading-tight">{g.nama}</h3>
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1 mb-4">
                  <Calendar size={14} />
                  <span>{formatDate(g.tanggal_mulai)} — {formatDate(g.tanggal_selesai)}</span>
                </div>

                {/* Fill bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Peserta: {pesertaCount}</span>
                    <span>Kuota: {g.kuota}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${fillPct >= 100 ? 'bg-red-500' : fillPct >= 80 ? 'bg-amber-500' : 'bg-miq-500'}`}
                      style={{ width: `${Math.min(fillPct, 100)}%` }}
                    />
                  </div>
                </div>

                {g.whatsapp_group && (
                  <a href={g.whatsapp_group} target="_blank" rel="noopener noreferrer"
                    className="block text-xs text-emerald-600 hover:text-emerald-700 font-semibold mb-3 truncate">
                    🔗 Link Grup WhatsApp
                  </a>
                )}

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(g)}>
                    <Edit2 size={14} /> Edit
                  </Button>
                  <Button
                    variant={g.status_aktif ? 'ghost' : 'success'}
                    size="sm"
                    className={g.status_aktif ? 'text-amber-600 hover:bg-amber-50' : ''}
                    onClick={() => toggleStatus(g)}
                    title={g.status_aktif ? 'Tutup Gelombang' : 'Aktifkan Gelombang'}
                  >
                    <Power size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setDelTarget(g)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Gelombang' : 'Tambah Gelombang'} className="max-w-xl">
        <form onSubmit={onSave} className="space-y-4">
          <Input label="Nama Gelombang *" placeholder="Contoh: Gelombang 1" error={errors.nama?.message}
            {...register('nama', { required: 'Wajib diisi' })} />
          <Input label="Tahun *" type="number" placeholder="Contoh: 2026" error={errors.tahun?.message}
            {...register('tahun', { required: 'Wajib diisi' })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tanggal Mulai *" type="date" error={errors.tanggal_mulai?.message}
              {...register('tanggal_mulai', { required: 'Wajib diisi' })} />
            <Input label="Tanggal Selesai *" type="date" error={errors.tanggal_selesai?.message}
              {...register('tanggal_selesai', { required: 'Wajib diisi' })} />
          </div>
          <Input label="Kuota Peserta *" type="number" placeholder="Contoh: 100" error={errors.kuota?.message}
            {...register('kuota', { required: 'Wajib diisi', min: 1 })} />
          <Input label="Link Grup WhatsApp" placeholder="https://chat.whatsapp.com/..." {...register('whatsapp_group')} />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Status</label>
            <select className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-miq-500/50"
              {...register('status_aktif')}>
              <option value="true">Aktif</option>
              <option value="false">Tutup</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Batal</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editing ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!delTarget} onClose={() => setDelTarget(null)} title="Hapus Gelombang">
        <div className="space-y-4">
          <Alert type="error">Hapus gelombang <strong>{delTarget?.nama}</strong>? Semua data peserta gelombang ini akan terpengaruh.</Alert>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDelTarget(null)}>Batal</Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete}>Hapus</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
