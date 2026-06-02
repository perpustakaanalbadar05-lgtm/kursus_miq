import React, { useState } from 'react'
import { Settings, Save, Loader2 } from 'lucide-react'
import { Button, Input, Textarea, Alert, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { supabase } from '@/lib/supabase'

export default function PengaturanPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    // In production: save to a settings table
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 page-enter max-w-2xl">
      <div>
        <h2 className="font-display text-2xl font-bold">Pengaturan Sistem</h2>
        <p className="text-muted-foreground text-sm mt-1">Konfigurasi informasi program dan homepage</p>
      </div>

      {saved && <Alert type="success">Pengaturan berhasil disimpan!</Alert>}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Info Program */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Program</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Nama Program" defaultValue="Kursus Madrasah Ilmu Al Quran" />
            <Input label="Nama Lembaga" defaultValue="PP Miftahul Ulum Panyeppen" />
            <Textarea label="Deskripsi Program" rows={3} defaultValue="Program pembelajaran Al Quran terstruktur di bawah bimbingan para ahli..." />
          </CardContent>
        </Card>

        {/* Kontak */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Kontak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Nomor WhatsApp" placeholder="+62 812-XXXX-XXXX" type="tel" />
            <Input label="Email" placeholder="admin@miq.com" type="email" />
            <Textarea label="Alamat" rows={2} placeholder="Jl. Pesantren No.1, Panyeppen, Madura" />
          </CardContent>
        </Card>

        {/* Pembayaran */}
        <Card>
          <CardHeader>
            <CardTitle>Info Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Nama Bank" placeholder="Bank BRI" />
            <Input label="Nomor Rekening" placeholder="1234-5678-9012" />
            <Input label="Atas Nama" placeholder="PP Miftahul Ulum Panyeppen" />
          </CardContent>
        </Card>

        <Button type="submit" variant="primary" size="lg" disabled={saving}>
          {saving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan Pengaturan</>}
        </Button>
      </form>
    </div>
  )
}
