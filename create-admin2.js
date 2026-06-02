import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://ztjyeynfrnzdylkhhfju.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0anlleW5mcm56ZHlsa2hoZmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNTU3ODksImV4cCI6MjA5NTkzMTc4OX0.hMYrmf1FdslV4FoaI993F5NjmOULTT_sgXxwGjb-a-U')

async function createAdmin() {
  console.log('Membuat akun admin baru...')
  const { data, error } = await supabase.auth.signUp({
    email: 'superadmin@miq.com',
    password: 'password123',
  })
  
  if (error) {
    console.error('❌ Gagal membuat user di Auth:', error.message)
    return
  }
  
  if (data.user) {
    console.log('✅ User berhasil dibuat di Auth. ID:', data.user.id)
    
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
    } else {
      console.log('✅ Akun Admin berhasil dibuat sepenuhnya! Silakan login dengan:')
      console.log('Email: superadmin@miq.com')
      console.log('Password: password123')
    }
  }
}

createAdmin()
