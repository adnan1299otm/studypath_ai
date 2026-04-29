<<<<<<< HEAD
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/auth')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.replace('/roadmap')
        return
      }

      setAllowed(true)
      setChecking(false)
    }

    check()
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!allowed) return null

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col max-w-[1200px] mx-auto relative shadow-2xl overflow-hidden">
=======
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col max-w-[1200px] mx-auto relative shadow-2xl overflow-hidden">
      {/* Admin Header */}
>>>>>>> e778abf694b250563359473f2a170eba7bc0f202
      <header className="bg-card-dark border-b border-border-dark p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
            <span className="text-xl">🛡️</span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white leading-tight">StudyPath Admin</h1>
            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Control Panel</p>
          </div>
        </div>
      </header>
<<<<<<< HEAD
=======

      {/* Admin Content */}
>>>>>>> e778abf694b250563359473f2a170eba7bc0f202
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
<<<<<<< HEAD
  )
=======
  );
>>>>>>> e778abf694b250563359473f2a170eba7bc0f202
}
