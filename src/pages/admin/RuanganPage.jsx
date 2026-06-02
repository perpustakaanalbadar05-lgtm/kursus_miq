import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2, BookOpen, Loader2 } from 'lucide-react'
import { Button, Input, Modal, Alert, EmptyState, Spinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useForm } from 'react-hook-form'

export default function RuanganPage() {
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
    const [{ data: ruangan }, { data: gelombang }] = await Promise.all([
      supabase.from('ruangan').select('*, gelombang(nama)').order('kode_ruangan'),
      supabase.from('gelombang').select('*').order('created_at', { ascending: false }),
    ])
    setData(ruangan || [])
    setGelombangList(gelombang || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openAdd = () => { setEditing(null); reset({}); setShowModal(true) }
  const openEdit = (row) => { setEditing(row); reset(row); setShowModal(true) }

  const onSave = handleSubmit(async (vals) => {
    setSaving(true)
    if (editing) {
      await supabase.from('ruangan').update(vals).eq('id', editing.id)
    } else {
      await supabase.from('ruangan').insert(vals)
    }
    setSaving(false)
    setShowModal(false)
    fetchData()
  })

  const handleDelete = async () => {
    await supabase.from('ruangan').delete().eq('id', delTarget.id)
    setDelTarget(null)
    fetchData()
  }

  const jenisBadgeColor = (jenis) => jenis === 'Tartil Pemula' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-purple-100 text-purple-700 border border-purple-200'

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Manajemen Ruangan</h2>
          <p className="text-muted-foreground text-sm mt-1">{data.length} ruangan terdaftar</p>
        </div>
        <Button variant="primary" onClick={openAdd}><Plus size={16} /> Tambah Ruangan</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={<BookOpen size={48} />} title="Belum ada ruangan" description="Tambahkan ruangan belajar untuk peserta."
          action={<Button variant="primary" onClick={openAdd}><Plus size={16} /> Tambah Ruangan</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((r) => (
            <div key={r.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-miq-600 to-miq-400 flex items-center justify-center text-white font-bold text-sm">
                  {r.kode_ruangan?.substring(0, 2)}
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${jenisBadgeColor(r.jenis_kursus)}`}>
                  {r.jenis_kursus}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg">{r.nama_ruangan}</h3>
              <p className="text-muted-foreground text-sm">{r.kode_ruangan} • {r.gelombang?.nama || '-'}</p>
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(r)}>
                  <Edit2 size={14} /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setDelTarget(r)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Ruangan' : 'Tambah Ruangan'}>
        <form onSubmit={onSave} className="space-y-4">
          <Input label="Nama Ruangan *" placeholder="Contoh: Ruang Al Fatih" error={errors.nama_ruangan?.message}
            {...register('nama_ruangan', { required: 'Wajib diisi' })} />
          <Input label="Kode Ruangan *" placeholder="Contoh: ALF" error={errors.kode_ruangan?.message}
            {...register('kode_ruangan', { required: 'Wajib diisi' })} />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Jenis Kursus *</label>
            <select className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-miq-500/50"
              {...register('jenis_kursus', { required: 'Wajib diisi' })}>
              <option value="">-- Pilih Jenis Kursus --</option>
              <option>Tartil Pemula</option>
              <option>Tartil Melanjutkan</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Gelombang *</label>
            <select className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-miq-500/50"
              {...register('gelombang_id', { required: 'Wajib diisi' })}>
              <option value="">-- Pilih Gelombang --</option>
              {gelombangList.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
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

      <Modal open={!!delTarget} onClose={() => setDelTarget(null)} title="Hapus Ruangan">
        <div className="space-y-4">
          <Alert type="error">Hapus ruangan <strong>{delTarget?.nama_ruangan}</strong>? Ini tidak dapat dibatalkan.</Alert>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDelTarget(null)}>Batal</Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete}>Hapus</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
