import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding-wizard'

export default async function SetupProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) {
    redirect('/')
  }

  // Check if owner or manager
  const { data: member } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', id)
    .eq('user_id', user.id)
    .single()

  const { data: limitData } = await supabase
    .from('user_limits')
    .select('is_super_admin')
    .eq('user_id', user.id)
    .single()
    
  const isSuperAdmin = limitData?.is_super_admin || false
  const isOwner = project.user_id === user.id || isSuperAdmin
  const isManager = !!member

  if (!isOwner && !isManager) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 flex flex-col relative overflow-hidden">
      {/* Квадратики на фоне */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_30%,transparent_100%)] pointer-events-none"></div>

      <div className="container mx-auto px-4 py-12 relative z-10 flex-1 flex flex-col max-w-4xl">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-100">
            Настройка новой модели <span className="text-primary">{project.name}</span>
          </h1>
        </div>

        <OnboardingWizard project={project} />
      </div>
    </div>
  )
}
