import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/login/actions'
import { Bot } from 'lucide-react'
import { HeaderProfile } from '@/components/header-profile'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: limitData } = await supabase
    .from('user_limits')
    .select('is_super_admin')
    .eq('user_id', user.id)
    .single()

  if (!limitData?.is_super_admin) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_30%,transparent_100%)] pointer-events-none"></div>

      <header className="border-b border-amber-500/20 bg-zinc-950/80 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold tracking-tight text-amber-500 flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">Nexus AI</span>
            </Link>
            <Link href="/superadmin" className="text-amber-500/50 hover:text-amber-500/80 transition-colors text-sm font-normal align-middle px-2 py-1 rounded-md hover:bg-amber-500/10">
              Админка
            </Link>
          </div>
          <HeaderProfile />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 relative z-10">
        {children}
      </main>
    </div>
  )
}
