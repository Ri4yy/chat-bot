import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '../login/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NewProjectButton } from '@/components/new-project-button'
import { DeleteProjectButton } from '@/components/delete-project-button'
import Link from 'next/link'
import { Bot } from 'lucide-react'
import { HeaderProfile } from '@/components/header-profile'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch limit and roles
  const { data: limitData } = await supabase
    .from('user_limits')
    .select('max_projects, is_super_admin')
    .eq('user_id', user.id)
    .single()
  
  const isSuperAdmin = limitData?.is_super_admin || false
  let allProjects: any[] = []

  if (isSuperAdmin) {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    allProjects = data || []
  } else {
    // Fetch owned projects
    const { data: ownedProjects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Fetch projects where user is a member
    const { data: memberData } = await supabase
      .from('project_members')
      .select('projects(*)')
      .eq('user_id', user.id)

    const memberProjects = memberData?.map(m => m.projects).filter(Boolean) || []
    allProjects = [...(ownedProjects || []), ...(memberProjects as any[])]
  }

  const projects = Array.from(new Map(allProjects.map(p => [p.id, p])).values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const maxProjects = limitData?.max_projects || 0
  const ownedCount = isSuperAdmin ? 0 : allProjects.filter(p => p.user_id === user.id).length
  const isLimitReached = !isSuperAdmin && ownedCount >= maxProjects

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-zinc-950 dark:text-slate-50 flex flex-col relative overflow-hidden">
      {/* Квадратики на фоне */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_30%,transparent_100%)] pointer-events-none"></div>

      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 py-3 min-h-[4rem] flex flex-wrap items-center justify-between gap-y-3 gap-x-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-zinc-400 whitespace-nowrap">
              Nexus AI
            </h1>
          </div>
          <HeaderProfile />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 relative z-10">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Дашборд</h2>
            <p className="text-slate-500 dark:text-zinc-400 mt-1">Управляйте вашими виджетами и базами знаний ИИ.</p>
          </div>
          <NewProjectButton isLimitReached={isLimitReached} maxProjects={maxProjects} />
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="group relative block h-full">
                <Card className="hover:border-primary dark:hover:border-zinc-600 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-300 h-full bg-white dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 backdrop-blur-md relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  
                  <CardHeader className="flex flex-row items-center gap-4 relative z-10 justify-between">
                    <Link href={`/project/${project.id}`} className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12 border-2 border-slate-100 dark:border-zinc-800">
                        <AvatarFallback style={{ backgroundColor: project.theme_color, color: 'white' }}>
                          {project.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{project.name}</CardTitle>
                        <CardDescription className="text-slate-500 dark:text-zinc-500">
                          Создан {new Date(project.created_at).toLocaleDateString('ru-RU')}
                        </CardDescription>
                      </div>
                    </Link>
                    
                    {(project.user_id === user.id || isSuperAdmin) && (
                      <div className="z-20 relative shrink-0">
                        <DeleteProjectButton projectId={project.id} />
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <Link href={`/project/${project.id}`} className="block relative z-10">
                      <p className="text-sm text-slate-600 dark:text-zinc-400 line-clamp-2">
                        {project.welcome_message}
                      </p>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border-2 border-dashed border-slate-300 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/30 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-700 dark:text-slate-200">У вас пока нет проектов</h3>
            <p className="text-slate-500 dark:text-zinc-500 mb-6">Создайте ваш первый ИИ виджет, чтобы начать работу.</p>
            <NewProjectButton isLimitReached={isLimitReached} maxProjects={maxProjects} />
          </div>
        )}
      </main>
    </div>
  )
}
