import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Users, Bot, Settings2, ShieldAlert, MessageSquareText, Database, FileText, DollarSign, HardDrive } from 'lucide-react'
import { SuperAdminTokenChart } from '@/components/superadmin-token-chart'
import { SuperAdminCostEstimator } from '@/components/superadmin-cost-estimator'

export const dynamic = 'force-dynamic'

export default async function SuperAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'users' } = await searchParams
  const supabase = await createClient()
  
  // -- Fetch logic for Users tab --
  const { data: users, error: usersError } = await supabase.rpc('get_all_users')
  const usersCount = users?.length || 0

  // -- Fetch logic for Bots tab --
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  const allProjects = projects || []
  const projectsCount = allProjects.length
  
  // -- Fetch storage stats --
  const { data: storageStats } = await supabase.rpc('get_projects_storage_stats')
  const storageMap = new Map<string, number>((storageStats || []).map((s: any) => [s.project_id, s.storage_bytes]))

  const totalChatTokens = allProjects.reduce((acc, p) => acc + (p.chat_tokens_used || 0), 0)
  const totalParseTokens = allProjects.reduce((acc, p) => acc + (p.parse_tokens_used || 0), 0)
  const totalTokens = totalChatTokens + totalParseTokens

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      
      {/* Sidebar Menu */}
      <div className="md:col-span-1 space-y-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Меню</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link 
              href="/superadmin?tab=users" 
              className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-md transition-colors ${tab === 'users' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-slate-200'}`}
            >
              <Users size={16} /> Пользователи
            </Link>
            <Link 
              href="/superadmin?tab=bots" 
              className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-md transition-colors ${tab === 'bots' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-slate-200'}`}
            >
              <Bot size={16} /> Проекты (Боты)
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="md:col-span-3 space-y-8">
        
        {tab === 'users' ? (
          <>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Обзор системы</h2>
              <p className="text-zinc-400 mt-1">Сводка по пользователям и созданным ботам.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
                  <Users className="h-4 w-4 text-zinc-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usersCount}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего ботов создано</CardTitle>
                  <Bot className="h-4 w-4 text-zinc-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projectsCount}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle>Список пользователей</CardTitle>
                <CardDescription>Управление лимитами и доступами клиентов</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-zinc-400">
                    <thead className="text-xs uppercase bg-zinc-800/50 text-zinc-300">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Email</th>
                        <th className="px-4 py-3">Дата регистрации</th>
                        <th className="px-4 py-3 text-center">Статус</th>
                        <th className="px-4 py-3 text-center">Роль</th>
                        <th className="px-4 py-3 text-center">Лимит ботов</th>
                        <th className="px-4 py-3 rounded-tr-lg text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users?.map((u: any) => (
                        <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-4 font-medium text-zinc-200">
                            {u.email}
                          </td>
                          <td className="px-4 py-4">
                            {new Date(u.created_at).toLocaleDateString('ru-RU')}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {u.is_active ? (
                              <span className="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/20">Активен</span>
                            ) : (
                              <span className="bg-red-500/10 text-red-400 text-xs px-2 py-1 rounded-full border border-red-500/20">Отключен</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {u.is_super_admin ? (
                              <span className="text-amber-400 font-medium text-xs border border-amber-500/30 bg-amber-500/10 px-2 py-1 rounded-full">Супер-админ</span>
                            ) : (
                              <span className="text-zinc-500">Пользователь</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center font-mono">
                            {u.max_projects}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Link href={`/superadmin/users/${u.id}`} className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors">
                              <Settings2 className="w-4 h-4" /> Настроить
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {(!users || users.length === 0) && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                            Пользователи не найдены
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : tab === 'bots' ? (
          <>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                Статистика токенов ботов
              </h2>
              <p className="text-zinc-400 mt-2">Детализация использования токенов по каждому созданному проекту.</p>
            </div>

            {/* Global Stats for Bots */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Расход (Чат)</CardTitle>
                  <MessageSquareText className="w-4 h-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-100">{totalChatTokens.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Расход (База)</CardTitle>
                  <Database className="w-4 h-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-100">{totalParseTokens.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Общий Расход</CardTitle>
                  <FileText className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{totalTokens.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <SuperAdminCostEstimator totalTokens={totalTokens} />
            </div>

            {/* Token Usage Chart */}
            <SuperAdminTokenChart projects={allProjects} />

            {/* Projects Table */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-slate-100">Созданные проекты</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-400 bg-zinc-950/50 uppercase border-b border-zinc-800">
                      <tr>
                        <th className="px-4 py-3 font-medium">ID Проекта</th>
                        <th className="px-4 py-3 font-medium">Название</th>
                        <th className="px-4 py-3 font-medium">Владелец (ID)</th>
                        <th className="px-4 py-3 font-medium text-right">Хранилище</th>
                        <th className="px-4 py-3 font-medium text-right">Токены Чат</th>
                        <th className="px-4 py-3 font-medium text-right">Токены База</th>
                        <th className="px-4 py-3 font-medium text-right text-primary">Итого Токенов</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProjects.map((p) => {
                        const pChat = p.chat_tokens_used || 0
                        const pParse = p.parse_tokens_used || 0
                        const pTotal = pChat + pParse
                        
                        return (
                          <tr key={p.id} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                              <Link href={`/project/${p.id}`} className="hover:text-primary transition-colors">
                                {p.id.slice(0, 8)}...
                              </Link>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-200">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden shrink-0" style={{ backgroundColor: p.theme_color || '#3b82f6' }}>
                                  {p.icon_url ? <img src={p.icon_url} className="w-full h-full object-cover" /> : <Bot size={12} className="text-white" />}
                                </div>
                                {p.name}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-zinc-500" title={p.user_id}>{p.user_id?.slice(0, 8)}...</td>
                            <td className="px-4 py-3 text-right text-emerald-400/80 font-medium">
                              {storageMap.has(p.id) ? ((storageMap.get(p.id) || 0) / 1024).toFixed(1) + ' KB' : '-'}
                            </td>
                            <td className="px-4 py-3 text-right text-blue-400/80 font-medium">{pChat > 0 ? pChat.toLocaleString() : '-'}</td>
                            <td className="px-4 py-3 text-right text-purple-400/80 font-medium">{pParse > 0 ? pParse.toLocaleString() : '-'}</td>
                            <td className="px-4 py-3 text-right text-primary font-bold">{pTotal > 0 ? pTotal.toLocaleString() : '-'}</td>
                          </tr>
                        )
                      })}
                      {allProjects.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                            Нет проектов
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}

      </div>
    </div>
  )
}
