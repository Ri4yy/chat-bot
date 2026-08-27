'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateProjectSettings } from '@/app/actions/project'
import { toast } from 'sonner'
import { Plug } from 'lucide-react'

export function ProjectIntegrationsForm({ project }: { project: any }) {
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      await updateProjectSettings(project.id, formData)
      toast.success('Настройки интеграции успешно сохранены!')
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при сохранении изменений')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="openrouter_api_key" className="text-zinc-300 font-semibold text-lg flex items-center gap-2">
            <Plug size={18} className="text-zinc-400" />
            Свой API Ключ (RouterAI)
          </Label>
          <p className="text-sm text-zinc-500">
            Для работы бота на вашем аккаунте вставьте ваш личный ключ RouterAI. Ключ хранится в зашифрованном виде.
            <br/>Если ключ не указан — будет использоваться резервный тестовый ключ платформы.
          </p>
          <Input 
            id="openrouter_api_key" 
            name="openrouter_api_key" 
            type="password"
            placeholder="sk-or-v1-..."
            defaultValue={project.openrouter_api_key ? '********' : ''} 
            className="bg-zinc-800/50 border-zinc-700 text-slate-100 focus-visible:ring-primary/50 font-mono" 
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-zinc-800 pt-6 pb-2">
        <div className="space-y-2">
          <Label htmlFor="b24_webhook_url" className="text-zinc-300 font-semibold text-lg flex items-center gap-2">
            <Plug size={18} className="text-zinc-400" />
            Вебхук Bitrix24 (crm.lead.add)
          </Label>
          <p className="text-sm text-zinc-500">
            Входящий вебхук из Bitrix24 для автоматической отправки лидов (телефон, email).
            <br/>Пример: <code>https://ваша-компания.bitrix24.ru/rest/1/secret_token/crm.lead.add.json</code>
          </p>
          <Input 
            id="b24_webhook_url" 
            name="b24_webhook_url" 
            type="url"
            placeholder="https://.../crm.lead.add.json"
            defaultValue={project.b24_webhook_url || ''} 
            className="bg-zinc-800/50 border-zinc-700 text-slate-100 focus-visible:ring-primary/50 font-mono" 
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-zinc-800 pt-6 pb-2">
        <div className="space-y-2">
          <Label htmlFor="amo_webhook_url" className="text-zinc-300 font-semibold text-lg flex items-center gap-2">
            <Plug size={18} className="text-zinc-400" />
            Вебхук AmoCRM (Make.com / Albato / Zapier)
          </Label>
          <p className="text-sm text-zinc-500">
            Входящий вебхук для передачи лидов в сервисы автоматизации, которые затем создадут сделку в AmoCRM.
            <br/>Пример: <code>https://hook.eu1.make.com/xxxxxxxxx</code>
          </p>
          <Input 
            id="amo_webhook_url" 
            name="amo_webhook_url" 
            type="url"
            placeholder="https://hook..."
            defaultValue={project.amo_webhook_url || ''} 
            className="bg-zinc-800/50 border-zinc-700 text-slate-100 focus-visible:ring-primary/50 font-mono" 
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4 border-t border-zinc-800">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
        >
          {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </div>
    </form>
  )
}
