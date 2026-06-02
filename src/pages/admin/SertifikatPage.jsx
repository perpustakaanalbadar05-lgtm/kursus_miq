import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Download, Award, Upload, Eye, Settings, Loader2, Zap } from 'lucide-react'
import { Button, Modal, Alert, EmptyState, Spinner, Badge, Select } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { generateSertifikat, downloadPdf } from '@/lib/pdf'
import { generateNomorSertifikat, generateVerificationCode, formatDate } from '@/utils'

const VARIABLES = [
  '{{nomor_sertifikat}}', '{{nama_santri}}', '{{nama_lembaga}}',
  '{{asal_pesantren}}', '{{jenis_kursus}}', '{{tanggal}}', '{{tahun}}',
]

export default function SertifikatPage() {
  const [pesertaList, setPesertaList] = useState([])
  const [templates, setTemplates] = useState([])
  const [activeTemplate, setActiveTemplate] = useState(null)
  const [sertifikatList, setSertifikatList] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [bulkGenerating, setBulkGenerating] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showFieldEditor, setShowFieldEditor] = useState(false)
  const [filterGelombang, setFilterGelombang] = useState('')
  const [gelombangList, setGelombangList] = useState([])
  const [fieldConfigs, setFieldConfigs] = useState([])
  const fileInputRef = useRef()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: peserta }, { data: tmpl }, { data: sert }, { data: gelombang }] = await Promise.all([
      supabase.from('peserta').select('*, gelombang(nama), sertifikat(*)').order('created_at', { ascending: false }),
      supabase.from('certificate_templates').select('*').order('created_at', { ascending: false }),
      supabase.from('sertifikat').select('*, peserta(nama_santri)').order('created_at', { ascending: false }),
      supabase.from('gelombang').select('*').order('created_at', { ascending: false }),
    ])
    setPesertaList(peserta || [])
    setTemplates(tmpl || [])
    setSertifikatList(sert || [])
    setGelombangList(gelombang || [])
    const active = tmpl?.find(t => t.is_active) || tmpl?.[0]
    if (active) {
      setActiveTemplate(active)
      setFieldConfigs(active.field_configs || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUploadTemplate = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const path = `templates/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('certificates').upload(path, file)
    if (error) { alert('Upload gagal: ' + error.message); return }
    const { data: { publicUrl } } = supabase.storage.from('certificates').getPublicUrl(path)
    const { data: tmpl } = await supabase.from('certificate_templates').insert({
      nama_template: file.name,
      background_url: publicUrl,
      field_configs: [],
      is_active: true,
    }).select().single()
    // Deactivate others
    await supabase.from('certificate_templates').update({ is_active: false }).neq('id', tmpl.id)
    fetchData()
    setShowTemplateModal(false)
  }

  const saveFieldConfigs = async () => {
    if (!activeTemplate) return
    await supabase.from('certificate_templates').update({ field_configs: fieldConfigs }).eq('id', activeTemplate.id)
    fetchData()
    setShowFieldEditor(false)
  }

  const addField = () => {
    setFieldConfigs(prev => [...prev, {
      variable: '{{nama_santri}}', x: 200, y: 300, fontSize: 24, bold: true, color: '#1b4332'
    }])
  }

  const updateField = (idx, key, val) => {
    setFieldConfigs(prev => prev.map((f, i) => i === idx ? { ...f, [key]: key === 'x' || key === 'y' || key === 'fontSize' ? +val : val } : f))
  }

  const removeField = (idx) => {
    setFieldConfigs(prev => prev.filter((_, i) => i !== idx))
  }

  const generateForPeserta = async (peserta) => {
    setGenerating(true)
    try {
      const year = new Date().getFullYear()
      const seq = sertifikatList.length + 1
      const nomorSert = generateNomorSertifikat(year, seq)
      const verCode = generateVerificationCode()

      const { data: sert } = await supabase.from('sertifikat').insert({
        peserta_id: peserta.id,
        nomor_sertifikat: nomorSert,
        verification_code: verCode,
        issued_at: new Date().toISOString(),
      }).select().single()

      const pesertaWithSert = { ...peserta, sertifikat: sert }
      const bytes = await generateSertifikat(pesertaWithSert, activeTemplate)
      downloadPdf(bytes, `sertifikat-${peserta.nama_santri}.pdf`)
      fetchData()
    } catch (err) {
      alert('Gagal generate sertifikat: ' + err.message)
    }
    setGenerating(false)
  }

  const generateBulk = async () => {
    setBulkGenerating(true)
    const eligible = filteredPeserta.filter(p => !p.sertifikat?.length && p.status_pembayaran === 'Valid')
    for (let i = 0; i < eligible.length; i++) {
      await generateForPeserta(eligible[i])
    }
    setBulkGenerating(false)
  }

  const downloadExisting = async (sert, peserta) => {
    const bytes = await generateSertifikat({ ...peserta, sertifikat: sert }, activeTemplate)
    downloadPdf(bytes, `sertifikat-${peserta.nama_santri}.pdf`)
  }

  const filteredPeserta = filterGelombang
    ? pesertaList.filter(p => p.gelombang_id === filterGelombang)
    : pesertaList

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Sertifikat Otomatis</h2>
          <p className="text-muted-foreground text-sm mt-1">{sertifikatList.length} sertifikat telah diterbitkan</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => setShowTemplateModal(true)}>
            <Upload size={16} /> Upload Template
          </Button>
          {activeTemplate && (
            <Button variant="secondary" size="sm" onClick={() => setShowFieldEditor(true)}>
              <Settings size={16} /> Konfigurasi Field
            </Button>
          )}
          <Button variant="gold" size="sm" onClick={generateBulk} disabled={bulkGenerating}>
            {bulkGenerating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            Generate Massal
          </Button>
        </div>
      </div>

      {/* Active Template Preview */}
      {activeTemplate ? (
        <div className="bg-gradient-to-r from-miq-800 to-miq-600 rounded-2xl p-5 text-white flex items-center gap-4">
          <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center">
            <Award size={24} className="text-gold-400" />
          </div>
          <div>
            <p className="font-semibold">Template Aktif: {activeTemplate.nama_template}</p>
            <p className="text-white/60 text-sm">{fieldConfigs.length} field dikonfigurasi</p>
          </div>
          {activeTemplate.background_url && (
            <img src={activeTemplate.background_url} alt="Preview" className="ml-auto h-16 rounded-lg border border-white/20 object-cover" />
          )}
        </div>
      ) : (
        <Alert type="warning">Belum ada template sertifikat. Upload template terlebih dahulu.</Alert>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filterGelombang} onChange={e => setFilterGelombang(e.target.value)} className="w-48">
          <option value="">Semua Gelombang</option>
          {gelombangList.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
        </Select>
        <p className="text-muted-foreground text-sm">{filteredPeserta.length} peserta</p>
      </div>

      {/* Peserta Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Nama Santri', 'Jenis Kursus', 'Gelombang', 'Status Bayar', 'Sertifikat', 'Aksi'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPeserta.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={<Award size={48} />} title="Tidak ada peserta" /></td></tr>
              ) : filteredPeserta.map((p) => {
                const hasSert = p.sertifikat?.length > 0
                const sert = p.sertifikat?.[0]
                const canGenerate = p.status_pembayaran === 'Valid' && activeTemplate
                return (
                  <tr key={p.id} className="border-t border-border/50 tr-hover">
                    <td className="py-3 px-4 font-semibold">{p.nama_santri}</td>
                    <td className="py-3 px-4 text-muted-foreground">{p.jenis_kursus}</td>
                    <td className="py-3 px-4 text-muted-foreground">{p.gelombang?.nama || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={p.status_pembayaran === 'Valid' ? 'success' : 'unpaid'}>{p.status_pembayaran}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {hasSert ? (
                        <div>
                          <p className="font-mono text-xs font-semibold text-miq-700">{sert.nomor_sertifikat}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(sert.issued_at)}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Belum ada</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {hasSert ? (
                        <Button variant="secondary" size="sm" onClick={() => downloadExisting(sert, p)}>
                          <Download size={14} /> Download
                        </Button>
                      ) : canGenerate ? (
                        <Button variant="gold" size="sm" onClick={() => generateForPeserta(p)} disabled={generating}>
                          {generating ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
                          Generate
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {!activeTemplate ? 'Perlu template' : 'Belum valid'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Template Modal */}
      <Modal open={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Upload Template Sertifikat">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Upload file gambar (PNG/JPG) atau PDF sebagai background sertifikat.</p>
          <div
            className="border-2 border-dashed border-miq-200 rounded-2xl p-10 text-center cursor-pointer hover:border-miq-400 hover:bg-miq-50 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-10 h-10 text-miq-400 mx-auto mb-3" />
            <p className="font-semibold text-miq-700">Klik untuk upload</p>
            <p className="text-muted-foreground text-sm mt-1">PNG, JPG, atau PDF • Max 10MB</p>
          </div>
          <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden" onChange={handleUploadTemplate} />
        </div>
      </Modal>

      {/* Field Editor Modal */}
      <Modal open={showFieldEditor} onClose={() => setShowFieldEditor(false)} title="Konfigurasi Field Sertifikat" className="max-w-2xl">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <p className="text-sm text-muted-foreground">
            Atur posisi, ukuran font, dan warna untuk setiap variabel yang akan muncul di sertifikat.
          </p>
          {fieldConfigs.map((fc, idx) => (
            <div key={idx} className="bg-muted/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <select
                  value={fc.variable}
                  onChange={e => updateField(idx, 'variable', e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-miq-500/50"
                >
                  {VARIABLES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <button onClick={() => removeField(idx)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Hapus</button>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="block text-muted-foreground mb-1">X (px)</label>
                  <input type="number" value={fc.x} onChange={e => updateField(idx, 'x', e.target.value)} className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Y (px)</label>
                  <input type="number" value={fc.y} onChange={e => updateField(idx, 'y', e.target.value)} className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Font Size</label>
                  <input type="number" value={fc.fontSize} onChange={e => updateField(idx, 'fontSize', e.target.value)} className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Warna</label>
                  <input type="color" value={fc.color} onChange={e => updateField(idx, 'color', e.target.value)} className="w-full h-9 rounded-lg border border-border cursor-pointer" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={fc.bold} onChange={e => updateField(idx, 'bold', e.target.checked)} className="w-4 h-4 accent-miq-600 rounded" />
                <span>Bold</span>
              </label>
            </div>
          ))}
          <Button variant="secondary" onClick={addField} className="w-full">
            <Plus size={16} /> Tambah Field
          </Button>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button variant="secondary" className="flex-1" onClick={() => setShowFieldEditor(false)}>Batal</Button>
          <Button variant="primary" className="flex-1" onClick={saveFieldConfigs}>Simpan Konfigurasi</Button>
        </div>
      </Modal>
    </div>
  )
}
