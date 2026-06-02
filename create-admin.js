import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://ztjyeynfrnzdylkhhfju.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0anlleW5mcm56ZHlsa2hoZmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNTU3ODksImV4cCI6MjA5NTkzMTc4OX0.hMYrmf1FdslV4FoaI993F5NjmOULTT_sgXxwGjb-a-U')

async function createAdmin() {
  console.log('Membuat akun admin...')
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@miq.com',
    password: 'password123',
  })
  
  if (error) {
    console.error('❌ Gagal membuat user di Auth:', error.message)
    return
  }
  
  if (data.user) {
    console.log('✅ User berhasil dibuat di Auth. ID:', data.user.id)
    
    // Jika perlu konfirmasi email, session mungkin null
    if (!data.session) {
      console.log('⚠️ Supabase Anda membutuhkan konfirmasi email (Email Confirmations is ON).')
      console.log('Jalankan script SQL berikut di menu SQL Editor Supabase untuk memasukkan data admin secara manual:')
      console.log(`\nINSERT INTO admins (id, nama, email, role) VALUES ('${data.user.id}', 'Super Admin', '${data.user.email}', 'admin');\n`)
      return
    }

    // Insert into admins table
    const { error: insertError } = await supabase
      .from('admins')
      .insert([{ 
        id: data.user.id, 
        nama: 'Super Admin', 
        email: data.user.email, 
        role: 'admin' 
      }])
      
    if (insertError) {
      console.error('❌ Gagal memasukkan data ke tabel admins:', insertError.message)
      console.log(`\nJalankan SQL ini secara manual di Supabase SQL Editor:\nINSERT INTO admins (id, nama, email, role) VALUES ('${data.user.id}', 'Super Admin', '${data.user.email}', 'admin');\n`)
    } else {
      console.log('✅ Akun Admin berhasil dibuat sepenuhnya! Silakan login dengan:')
      console.log('Email: admin@miq.com')
      console.log('Password: password123')
    }
  }
}

createAdmin()
