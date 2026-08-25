'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { updateUserLimits } from '@/app/actions/superadmin'
import { Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function UserLimitsForm({ user }: { user: any }) {
  const [loading, setLoading] = useState(false)
  const [maxProjects, setMaxProjects] = useState(user.max_projects)
  const [isSuperAdmin, setIsSuperAdmin] = useState(user.is_super_admin)
  const [isActive, setIsActive] = useState(user.is_active)
  const router = useRouter()

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateUserLimits(user.id, {
        max_projects: Number(maxProjects),
        is_super_admin: isSuperAdmin,
        is_active: isActive
      })
      toast.success('Настройки пользователя сохранены')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle>Права и лимиты</CardTitle>
        <CardDescription>Управление доступом клиента к системе</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="max_projects">Лимит создаваемых ботов</Label>
          <Input 
            id="max_projects" 
            type="number" 
            value={maxProjects}
            onChange={(e) => setMaxProjects(e.target.value)}
            className="bg-zinc-950 border-zinc-800 text-zinc-100"
          />
          <p className="text-xs text-zinc-500">Установите 0, чтобы запретить создание проектов.</p>
        </div>

        <div className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">Активный аккаунт</Label>
            <p className="text-sm text-zinc-400">
              Если отключить, проекты пользователя перестанут работать.
            </p>
          </div>
          <Switch 
            checked={isActive} 
            onCheckedChange={setIsActive} 
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base text-amber-500">Супер-администратор</Label>
            <p className="text-sm text-amber-500/70">
              Дает полный доступ ко всем проектам и этой админке.
            </p>
          </div>
          <Switch 
            checked={isSuperAdmin} 
            onCheckedChange={setIsSuperAdmin} 
            className="data-[state=checked]:bg-amber-500"
          />
        </div>

      </CardContent>
      <CardFooter className="bg-zinc-900/50 border-t border-zinc-800">
        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Сохранение...' : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Сохранить изменения
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
