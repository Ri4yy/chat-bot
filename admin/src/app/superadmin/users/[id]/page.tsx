import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Bot, ExternalLink, Activity } from 'lucide-react'
import { UserLimitsForm } from '@/components/user-limits-form'

export default async function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch user details via RPC
  const { data: users, error } = await supabase.rpc('get_admin_user_details', { target_user_id: id })
  const user = users?.[0]

  if (!user || error) {
    redirect('/superadmin')
  }

  // Fetch user's owned projects
  const { data: ownedProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  // Fetch projects where user is member
  const { data: memberData } = await supabase
    .from('project_members')
    .select('projects(*)')
    .eq('user_id', id)
  
  const memberProjects = memberData?.map(m => m.projects).filter(Boolean) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/superadmin" className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{user.email}</h2>
          <p className="text-zinc-400 mt-1">
            Зарегистрирован: {new Date(user.created_at).toLocaleString('ru-RU')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UserLimitsForm user={user} />

        <div className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-zinc-400" />
                Собственные боты
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ownedProjects && ownedProjects.length > 0 ? (
                <div className="space-y-4">
                  {ownedProjects.map(project => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-zinc-500 mt-1">ID: {project.id}</div>
                      </div>
                      <Link 
                        href={`/project/${project.id}`} 
                        className="text-primary hover:text-primary/80 transition-colors p-2"
                        title="Перейти в проект"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-4">У пользователя нет созданных проектов</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-zinc-400" />
                Приглашен как менеджер
              </CardTitle>
            </CardHeader>
            <CardContent>
              {memberProjects && memberProjects.length > 0 ? (
                <div className="space-y-4">
                  {memberProjects.map((project: any) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-zinc-500 mt-1">ID: {project.id}</div>
                      </div>
                      <Link 
                        href={`/project/${project.id}`} 
                        className="text-primary hover:text-primary/80 transition-colors p-2"
                        title="Перейти в проект"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-4">Не состоит ни в одной команде</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
