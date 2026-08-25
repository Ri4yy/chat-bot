'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { addTeamMember, removeTeamMember, updateTeamMemberPermissions } from '@/app/actions/team'
import { UserPlus, Trash2, Shield } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type TeamMember = {
  id: string
  user_id: string
  role: string
  permissions: string[]
  created_at: string
}

const AVAILABLE_PERMISSIONS = [
  { id: 'history', label: 'История диалогов' },
  { id: 'leads', label: 'Лиды' },
  { id: 'knowledge', label: 'База знаний (загрузка/удаление)' },
  { id: 'memory_view', label: 'Управление памятью (только чтение)' },
  { id: 'memory_delete', label: 'Управление памятью (удаление)' },
  { id: 'settings', label: 'Настройки бота' },
  { id: 'install', label: 'Установка виджета' }
]

export function ProjectTeam({ projectId }: { projectId: string }) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteInput, setInviteInput] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  const fetchMembers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching team:', error)
    } else if (data) {
      setMembers(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMembers()
  }, [projectId])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteInput.trim()) return

    setIsInviting(true)
    const toastId = toast.loading('Добавление пользователя...')
    try {
      await addTeamMember(projectId, inviteInput.trim())
      toast.success('Пользователь успешно добавлен', { id: toastId })
      setInviteInput('')
      fetchMembers()
    } catch (error: any) {
      toast.error(error.message, { id: toastId })
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemove = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя из проекта?')) return

    const toastId = toast.loading('Удаление...')
    try {
      await removeTeamMember(projectId, userId)
      toast.success('Пользователь удален', { id: toastId })
      fetchMembers()
    } catch (error: any) {
      toast.error(error.message, { id: toastId })
    }
  }

  const togglePermission = async (member: TeamMember, permissionId: string) => {
    const newPermissions = member.permissions.includes(permissionId)
      ? member.permissions.filter(p => p !== permissionId)
      : [...member.permissions, permissionId]

    // Optimistic update
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, permissions: newPermissions } : m))

    try {
      await updateTeamMemberPermissions(projectId, member.user_id, newPermissions)
      toast.success('Права обновлены')
    } catch (error: any) {
      toast.error(error.message)
      // Revert on error
      fetchMembers()
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-zinc-400" />
            Пригласить менеджера
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Добавьте пользователя по Email или ID. Он получит доступ к проекту с ограниченными правами.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="invite" className="text-zinc-300">Email или ID пользователя</Label>
              <Input
                id="invite"
                placeholder="user@example.com"
                value={inviteInput}
                onChange={e => setInviteInput(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-slate-100"
              />
            </div>
            <Button type="submit" disabled={isInviting || !inviteInput.trim()} className="bg-slate-100 text-zinc-900 hover:bg-white transition-colors">
              {isInviting ? 'Добавление...' : 'Добавить'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-zinc-400" />
            Команда проекта
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Управление правами доступа для добавленных менеджеров.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-zinc-500">Загрузка команды...</div>
          ) : members.length === 0 ? (
            <div className="text-zinc-500 text-center py-8 bg-zinc-900/30 rounded-lg border border-zinc-800 border-dashed">
              В проекте пока нет менеджеров.
            </div>
          ) : (
            <div className="space-y-6">
              {members.map(member => (
                <div key={member.id} className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700 relative group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm font-medium text-slate-200">ID пользователя</div>
                      <div className="text-xs text-zinc-400 font-mono mt-1">{member.user_id}</div>
                      <div className="text-xs text-zinc-500 mt-1">Добавлен: {new Date(member.created_at).toLocaleDateString('ru-RU')}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      onClick={() => handleRemove(member.user_id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="border-t border-zinc-700/50 pt-4">
                    <div className="text-sm font-medium text-slate-300 mb-3">Права доступа:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {AVAILABLE_PERMISSIONS.map(perm => (
                        <label key={perm.id} className="flex items-start space-x-3 cursor-pointer group/label p-1">
                          <Checkbox
                            checked={member.permissions.includes(perm.id)}
                            onCheckedChange={() => togglePermission(member, perm.id)}
                            className="mt-0.5"
                          />
                          <span className="text-sm text-zinc-400 group-hover/label:text-zinc-300 transition-colors">
                            {perm.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
