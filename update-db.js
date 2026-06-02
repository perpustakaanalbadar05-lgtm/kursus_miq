import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://ztjyeynfrnzdylkhhfju.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0anlleW5mcm56ZHlsa2hoZmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNTU3ODksImV4cCI6MjA5NTkzMTc4OX0.hMYrmf1FdslV4FoaI993F5NjmOULTT_sgXxwGjb-a-U')

async function updateSchema() {
  console.log('Menjalankan update skema DB...')

  // Kita tidak bisa langsung jalankan DDL (ALTER/CREATE TABLE) dari supabase-js REST (kecuali pakai rpc).
  // Karena itu, saya akan mencetak SQL script agar user bisa jalankan.
  
  const sql = `
-- 1. Buat tabel jenis_kursus
CREATE TABLE IF NOT EXISTS jenis_kursus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL UNIQUE,
  biaya INTEGER NOT NULL DEFAULT 150000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert data awal
INSERT INTO jenis_kursus (nama, biaya) VALUES 
('Tartil Pemula', 150000),
('Tartil Melanjutkan', 200000)
ON CONFLICT (nama) DO NOTHING;

-- 2. Hapus constraint check lama di tabel peserta & ruangan
ALTER TABLE peserta DROP CONSTRAINT IF EXISTS peserta_jenis_kursus_check;
ALTER TABLE ruangan DROP CONSTRAINT IF EXISTS ruangan_jenis_kursus_check;

-- 3. Set RLS
ALTER TABLE jenis_kursus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_jenis_kursus" ON jenis_kursus FOR SELECT USING (true);
CREATE POLICY "admin_all_jenis_kursus" ON jenis_kursus FOR ALL USING (auth.role() = 'authenticated');
  `
  
  console.log("\n=============================================")
  console.log("SILAKAN COPY-PASTE SQL DI BAWAH INI KE SUPABASE SQL EDITOR:")
  console.log("=============================================\n")
  console.log(sql)
  console.log("\n=============================================")
}

updateSchema()
