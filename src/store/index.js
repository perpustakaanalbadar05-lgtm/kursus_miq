import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error
          set({ user: data.user })

          // Fetch admin profile
          const { data: profile } = await supabase
            .from('admins')
            .select('*')
            .eq('id', data.user.id)
            .single()

          set({ profile, loading: false })
          return { success: true }
        } catch (err) {
          set({ error: err.message, loading: false })
          return { success: false, error: err.message }
        }
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null })
      },

      checkSession: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          set({ user: session.user })
          const { data: profile } = await supabase
            .from('admins')
            .select('*')
            .eq('id', session.user.id)
            .single()
          set({ profile })
        }
      },

      resetPassword: async (email) => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          })
          if (error) throw error
          set({ loading: false })
          return { success: true }
        } catch (err) {
          set({ error: err.message, loading: false })
          return { success: false, error: err.message }
        }
      },

      updatePassword: async (newPassword) => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase.auth.updateUser({ password: newPassword })
          if (error) throw error
          set({ loading: false })
          return { success: true }
        } catch (err) {
          set({ error: err.message, loading: false })
          return { success: false, error: err.message }
        }
      },
    }),
    { name: 'miq-auth' }
  )
)

export const useAppStore = create((set) => ({
  sidebarOpen: true,
  activeGelombang: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveGelombang: (g) => set({ activeGelombang: g }),
}))
