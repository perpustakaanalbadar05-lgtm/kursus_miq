-- =============================================
-- MIQ KURSUS — SUPABASE SQL SCHEMA
-- Jalankan di Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ADMINS ────────────────────────────────────────────────────────────────────
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nama TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── GELOMBANG ─────────────────────────────────────────────────────────────────
CREATE TABLE gelombang (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  tahun INTEGER NOT NULL,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  status_aktif BOOLEAN DEFAULT TRUE,
  kuota INTEGER DEFAULT 100,
  whatsapp_group TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── KAMAR ─────────────────────────────────────────────────────────────────────
CREATE TABLE kamar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gelombang_id UUID REFERENCES gelombang(id) ON DELETE CASCADE,
  nama_kamar TEXT NOT NULL,
  nomor_kamar TEXT NOT NULL,
  kapasitas INTEGER NOT NULL DEFAULT 20,
  terisi INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RUANGAN ───────────────────────────────────────────────────────────────────
CREATE TABLE ruangan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gelombang_id UUID REFERENCES gelombang(id) ON DELETE CASCADE,
  nama_ruangan TEXT NOT NULL,
  kode_ruangan TEXT NOT NULL,
  jenis_kursus TEXT CHECK (jenis_kursus IN ('Tartil Pemula', 'Tartil Melanjutkan')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PESERTA ───────────────────────────────────────────────────────────────────
CREATE TABLE peserta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nomor_registrasi TEXT NOT NULL UNIQUE,
  gelombang_id UUID REFERENCES gelombang(id),
  nama_santri TEXT NOT NULL,
  nama_lembaga TEXT NOT NULL,
  asal_pesantren TEXT NOT NULL,
  nama_penanggung_jawab TEXT NOT NULL,
  nomor_penanggung_jawab TEXT NOT NULL,
  jenis_kursus TEXT CHECK (jenis_kursus IN ('Tartil Pemula', 'Tartil Melanjutkan')),
  kamar_id UUID REFERENCES kamar(id),
  ruangan_id UUID REFERENCES ruangan(id),
  status_pembayaran TEXT DEFAULT 'Belum Bayar'
    CHECK (status_pembayaran IN ('Belum Bayar', 'Menunggu Validasi', 'Valid', 'Ditolak')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PEMBAYARAN ────────────────────────────────────────────────────────────────
CREATE TABLE pembayaran (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  peserta_id UUID REFERENCES peserta(id) ON DELETE CASCADE,
  bukti_transfer_url TEXT,
  status TEXT DEFAULT 'Belum Bayar'
    CHECK (status IN ('Belum Bayar', 'Menunggu Validasi', 'Valid', 'Ditolak')),
  catatan TEXT,
  validated_by UUID REFERENCES admins(id),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SERTIFIKAT ────────────────────────────────────────────────────────────────
CREATE TABLE sertifikat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  peserta_id UUID REFERENCES peserta(id) ON DELETE CASCADE,
  nomor_sertifikat TEXT NOT NULL UNIQUE,
  pdf_url TEXT,
  verification_code TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CERTIFICATE TEMPLATES ─────────────────────────────────────────────────────
CREATE TABLE certificate_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_template TEXT NOT NULL,
  background_url TEXT,
  field_configs JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUDIT LOGS ────────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admins(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE gelombang ENABLE ROW LEVEL SECURITY;
ALTER TABLE kamar ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE sertifikat ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public: read gelombang aktif
CREATE POLICY "public_read_gelombang" ON gelombang FOR SELECT USING (status_aktif = true);
-- Public: read kamar & ruangan (for auto-assign)
CREATE POLICY "public_read_kamar" ON kamar FOR SELECT USING (true);
CREATE POLICY "public_read_ruangan" ON ruangan FOR SELECT USING (true);
-- Public: insert peserta & pembayaran (for registration)
CREATE POLICY "public_insert_peserta" ON peserta FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_pembayaran" ON pembayaran FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_kamar_terisi" ON kamar FOR UPDATE USING (true);
-- Public: read sertifikat & peserta (for verify)
CREATE POLICY "public_read_sertifikat" ON sertifikat FOR SELECT USING (true);
CREATE POLICY "public_read_peserta" ON peserta FOR SELECT USING (true);

-- Admin: full access
CREATE POLICY "admin_full_access_peserta" ON peserta FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_full_access_pembayaran" ON pembayaran FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_full_access_kamar" ON kamar FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_full_access_ruangan" ON ruangan FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_full_access_gelombang" ON gelombang FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_full_access_sertifikat" ON sertifikat FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_full_access_templates" ON certificate_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_full_access_admins" ON admins FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_full_access_logs" ON audit_logs FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- STORAGE BUCKETS
-- =============================================
-- Jalankan di Supabase Storage Settings:
-- 1. Buat bucket 'certificates' (public)
-- 2. Buat bucket 'payment-proofs' (private)

-- =============================================
-- SAMPLE DATA
-- =============================================
INSERT INTO gelombang (nama, tahun, tanggal_mulai, tanggal_selesai, status_aktif, kuota, whatsapp_group) VALUES
('Gelombang 1', 2026, '2026-07-01', '2026-07-07', true, 100, 'https://chat.whatsapp.com/sample-link'),
('Gelombang 2', 2026, '2026-08-01', '2026-08-07', true, 100, 'https://chat.whatsapp.com/sample-link-2');

-- Sample kamar for gelombang 1
INSERT INTO kamar (gelombang_id, nama_kamar, nomor_kamar, kapasitas, terisi)
SELECT id, 'Kamar A01', 'A01', 20, 0 FROM gelombang WHERE nama = 'Gelombang 1'
UNION ALL
SELECT id, 'Kamar A02', 'A02', 20, 0 FROM gelombang WHERE nama = 'Gelombang 1'
UNION ALL
SELECT id, 'Kamar B01', 'B01', 30, 0 FROM gelombang WHERE nama = 'Gelombang 1';

-- Sample ruangan for gelombang 1
INSERT INTO ruangan (gelombang_id, nama_ruangan, kode_ruangan, jenis_kursus)
SELECT id, 'Ruang Al Fatih', 'ALF', 'Tartil Pemula' FROM gelombang WHERE nama = 'Gelombang 1'
UNION ALL
SELECT id, 'Ruang Al Furqan', 'ALFQ', 'Tartil Melanjutkan' FROM gelombang WHERE nama = 'Gelombang 1';
