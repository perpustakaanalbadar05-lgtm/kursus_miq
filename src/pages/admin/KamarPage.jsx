import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2, BedDouble, Loader2 } from 'lucide-react'
import { Button, Input, Modal, Alert, EmptyState, Spinner, Badge } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useForm } from 'react-hook-form'

export default function KamarPage() {
  const [data, setData] = useState([])
  const [gelombangList, setGelombangList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [delTarget, setDelTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: kamar }, { data: gelombang }] = await Promise.all([
      supabase.from('kamar').select('*, gelombang(nama)').order('nomor_kamar'),
      supabase.from('gelombang').select('*').order('created_at', { ascending: false }),
    ])
    setData(kamar || [])
    setGelombangList(gelombang || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openAdd = () => { setEditing(null); reset({}); setShowModal(true) }
  const openEdit = (row) => { setEditing(row); reset(row); setShowModal(true) }

  const onSave = handleSubmit(async (vals) => {
    setSaving(true)
    if (editing) {
      await supabase.from('kamar').update({ ...vals, kapasitas: +vals.kapasitas }).eq('id', editing.id)
    } else {
      await supabase.from('kamar').insert({ ...vals, kapasitas: +vals.kapasitas, terisi: 0 })
    }
    setSaving(false)
    setShowModal(false)
    fetchData()
  })

  const handleDelete = async () => {
    await supabase.from('kamar').delete().eq('id', delTarget.id)
    setDelTarget(null)
    fetchData()
  }

  const fillPercent = (row) => Math.round(((row.terisi || 0) / row.kapasitas) * 100)

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Manajemen Kamar</h2>
          <p className="text-muted-foreground text-sm mt-1">{data.length} kamar terdaftar</p>
        </div>
        <Button variant="primary" onClick={openAdd}><Plus size={16} /> Tambah Kamar</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={<BedDouble size={48} />} title="Belum ada kamar" description="Tambahkan kamar untuk digunakan peserta."
          action={<Button variant="primary" onClick={openAdd}><Plus size={16} /> Tambah Kamar</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((k) => {
            const pct = fillPercent(k)
            const isFull = pct >= 100
            return (
              <div key={k.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-display font-bold text-lg">{k.nama_kamar}</p>
                    <p className="text-muted-foreground text-sm">No. {k.nomor_kamar} • {k.gelombang?.nama || '-'}</p>
                  </div>
                  <Badge variant={isFull ? 'danger' : 'primary'}>
                    {isFull ? 'Penuh' : 'Tersedia'}
                  </Badge>
                </div>

                {/* Capacity bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Terisi: {k.terisi || 0}</span>
                    <span>Kapasitas: {k.kapasitas}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-miq-500'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right">{pct}% terisi</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(k)}>
                    <Edit2 size={14} /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setDelTarget(k)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Kamar' : 'Tambah Kamar'}>
        <form onSubmit={onSave} className="space-y-4">
          <Input label="Nama Kamar *" placeholder="Contoh: Kamar A01" error={errors.nama_kamar?.message} {...register('nama_kamar', { required: 'Wajib diisi' })} />
          <Input label="Nomor Kamar *" placeholder="Contoh: A01" error={errors.nomor_kamar?.message} {...register('nomor_kamar', { required: 'Wajib diisi' })} />
          <Input label="Kapasitas *" type="number" min={1} placeholder="Contoh: 20" error={errors.kapasitas?.message} {...register('kapasitas', { required: 'Wajib diisi', min: 1 })} />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Gelombang *</label>
            <select className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-miq-500/50"
              {...register('gelombang_id', { required: 'Pilih gelombang' })}>
              <option value="">-- Pilih Gelombang --</option>
              {gelombangList.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
            </select>
            {errors.gelombang_id && <p className="text-xs text-red-500">{errors.gelombang_id.message}</p>}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Batal</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {editing ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!delTarget} onClose={() => setDelTarget(null)} title="Hapus Kamar">
        <div className="space-y-4">
          <Alert type="error">Hapus kamar <strong>{delTarget?.nama_kamar}</strong>? Tindakan ini tidak dapat dibatalkan.</Alert>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDelTarget(null)}>Batal</Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete}>Hapus</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
