import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateProjectSettings } from '@/app/actions/project'
import Link from 'next/link'
import { KnowledgeBaseUpload } from '@/components/knowledge-base-upload'
import { ProjectSettingsForm } from '@/components/project-settings-form'
import { InstallSnippet } from '@/components/install-snippet'
import { KnowledgeBaseList } from '@/components/knowledge-base-list'
import { DialogHistory } from '@/components/dialog-history'
import { LeadsList } from '@/components/leads-list'
import { ProjectTeam } from '@/components/project-team'
import { ProjectDashboard } from '@/components/project-dashboard'
import { ProjectIntegrationsForm } from '@/components/project-integrations-form'
import { LineChart, Settings, Database, Brain, MessageSquare, Users, Shield, Code, Plug } from 'lucide-react'
import { HeaderProfile } from '@/components/header-profile'

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab = 'dashboard' } = await searchParams
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

  const permissions = isOwner ? ['dashboard', 'settings', 'install', 'history', 'leads', 'knowledge', 'memory_view', 'memory_delete'] : ['dashboard', ...(member.permissions || [])]

  // Security redirect for non-allowed tabs
  if (!isOwner && tab === 'settings' && !permissions.includes('settings')) {
    redirect(`/project/${id}?tab=history`)
  }
  if (!isOwner && tab === 'install' && !permissions.includes('install')) {
    redirect(`/project/${id}?tab=history`)
  }
  if (!isOwner && tab === 'knowledge' && !permissions.includes('knowledge')) {
    redirect(`/project/${id}?tab=history`)
  }
  if (!isOwner && tab === 'memory' && !permissions.includes('memory_view') && !permissions.includes('memory_delete')) {
    redirect(`/project/${id}?tab=history`)
  }

  const updateSettingsWithId = updateProjectSettings.bind(null, project.id)

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 flex flex-col relative overflow-hidden">
      {/* Квадратики на фоне */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_30%,transparent_100%)] pointer-events-none"></div>

      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              &larr; Назад к дашборду
            </Link>
            <div className="h-6 w-px bg-zinc-800"></div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">{project.name}</h1>
          </div>
          <HeaderProfile />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-1 space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-slate-100">Меню</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {/* Секция: Повседневная работа */}
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-2 mb-1 px-4">
                  Повседневная работа
                </div>
                {permissions.includes('dashboard') && (
                  <Link href={`/project/${project.id}?tab=dashboard`} className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-md transition-colors ${tab === 'dashboard' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-slate-200'}`}>
                    <LineChart size={16} /> Аналитика
                  </Link>
                )}
                {permissions.includes('history') && (
                  <Link href={`/project/${project.id}?tab=history`} className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-md transition-colors ${tab === 'history' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-slate-200'}`}>
                    <MessageSquare size={16} /> История диалогов
                  </Link>
                )}
                {permissions.includes('leads') && (
                  <Link href={`/project/${project.id}?tab=leads`} className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-md transition-colors ${tab === 'leads' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-slate-200'}`}>
                    <Users size={16} /> Лиды
                  </Link>
                )}

                {/* Секция: Обучение ИИ */}
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-4 mb-1 px-4">
                  Обучение ИИ
                </div>
                {permissions.includes('knowledge') && (
                  <Link href={`/project/${project.id}?tab=knowledge`} className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-md transition-colors ${tab === 'knowledge' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-slate-200'}`}>
                    <Database size={16} /> База знаний (Загрузка)
                  </Link>
                )}
                {permissions.includes('memory_view') && (
                  <Link href={`/project/${project.id}?tab=memory`} className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-md transition-colors ${tab === 'memory' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-slate-200'}`}>
                    <Brain size={16} /> Управление памятью
                  </Link>
                )}

                {/* Секция: Управление проектом */}
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-4 mb-1 px-4">
                  Настройки
                </div>
                {permissions.includes('settings') && (
                  <Link href={`/project/${project.id}?tab=settings`} className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-md transition-colors ${tab === 'settings' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-slate-200'}`}>
                    <Settings size={16} /> Настройки бота
                  </Link>
                )}
                {permissions.includes('settings') && (
                  <Link href={`/project/${project.id}?tab=integrations`} className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-md transition-colors ${tab === 'integrations' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-slate-200'}`}>
                    <Plug size={16} /> Интеграции
                  </Link>
                )}
                {permissions.includes('install') && (
                  <Link href={`/project/${project.id}?tab=install`} className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-md transition-colors ${tab === 'install' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-slate-200'}`}>
                    <Code size={16} /> Установка виджета
                  </Link>
                )}
                {isOwner && (
                  <Link href={`/project/${project.id}?tab=team`} className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-md transition-colors ${tab === 'team' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-slate-200'}`}>
                    <Shield size={16} /> Команда
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-4">
            {tab === 'dashboard' ? (
              <ProjectDashboard projectId={project.id} />
            ) : tab === 'settings' ? (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-slate-100">Настройки виджета</CardTitle>
                  <CardDescription className="text-zinc-400">Настройте внешний вид и поведение вашего ИИ виджета.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProjectSettingsForm key={JSON.stringify(project)} project={project} />
                </CardContent>
              </Card>
            ) : tab === 'integrations' ? (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">Интеграции</CardTitle>
                  <CardDescription className="text-zinc-400">Подключение сторонних сервисов и настройка API.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProjectIntegrationsForm key={JSON.stringify(project)} project={project} />
                </CardContent>
              </Card>
            ) : tab === 'install' ? (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-slate-100">Установка виджета</CardTitle>
                  <CardDescription className="text-zinc-400">Скопируйте и вставьте этот код на ваш сайт внутри тега &lt;head&gt; или перед закрывающим тегом &lt;/body&gt;.</CardDescription>
                </CardHeader>
                <CardContent>
                  <InstallSnippet projectId={project.id} />
                  <p className="text-sm text-zinc-500 mt-4">
                    Примечание: Для продакшена вы выполните сборку (npm run build) и замените эти два скрипта на один скомпилированный `widget.js`.
                  </p>
                </CardContent>
              </Card>
            ) : tab === 'memory' ? (
              <KnowledgeBaseList projectId={project.id} permissions={permissions} />
            ) : tab === 'history' ? (
              <DialogHistory projectId={project.id} />
            ) : tab === 'leads' ? (
              <LeadsList projectId={project.id} />
            ) : tab === 'team' && isOwner ? (
              <ProjectTeam projectId={project.id} />
            ) : (
              <KnowledgeBaseUpload projectId={project.id} />
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
