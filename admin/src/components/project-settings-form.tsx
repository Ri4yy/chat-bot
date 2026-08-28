'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { updateProjectSettings } from '@/app/actions/project'
import { toast } from 'sonner'
import Image from 'next/image'
import { Bot } from 'lucide-react'

export function ProjectSettingsForm({ project }: { project: any }) {
  const [isLoading, setIsLoading] = useState(false)
  const [themeColor, setThemeColor] = useState(project.theme_color || '#000000')
  const [iconPreview, setIconPreview] = useState<string | null>(project.icon_url || null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      await updateProjectSettings(project.id, formData)
      toast.success('Настройки успешно сохранены!')
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при сохранении изменений')
    } finally {
      setIsLoading(false)
    }
  }

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setIconPreview(url)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-zinc-300">Название проекта</Label>
        <Input 
          id="name" 
          name="name" 
          defaultValue={project.name || ''} 
          required 
          className="bg-slate-100 dark:bg-white dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100 focus-visible:ring-primary/50" 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="welcome_message" className="text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-zinc-300">Приветственное сообщение</Label>
        <Input 
          id="welcome_message" 
          name="welcome_message" 
          defaultValue={project.welcome_message || ''} 
          className="bg-slate-100 dark:bg-white dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100 focus-visible:ring-primary/50" 
        />
        <p className="text-sm text-slate-500 dark:text-zinc-500">Первое сообщение, которое бот отправляет пользователям.</p>
      </div>



      <div className="space-y-4 border-t border-slate-200 dark:border-zinc-800 pt-6 pb-2">
        <div className="space-y-2">
          <Label className="text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-zinc-300 font-semibold text-lg">Стиль общения</Label>
          <p className="text-sm text-slate-500 dark:text-zinc-500">Манера ведения диалога у вашего ИИ-ассистента.</p>
          <div className="flex flex-wrap gap-2 pt-2">
            {['Дружелюбный', 'Нейтральный', 'Фактический', 'Профессиональный', 'Юмористический'].map(tone => (
              <label key={tone} className="cursor-pointer">
                <input type="radio" name="tone" value={tone} defaultChecked={project.tone === tone || (tone === 'Нейтральный' && !project.tone)} className="peer sr-only" />
                <div className="px-4 py-2 rounded-full border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 text-slate-700 dark:text-slate-300 text-sm peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 dark:hover:border-blue-500/30">
                  {tone}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 pb-4">
        <div className="space-y-2">
          <Label className="text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-zinc-300 font-semibold text-lg">Правила общения</Label>
          <p className="text-sm text-slate-500 dark:text-zinc-500">Индивидуальная настройка бота под стиль общения вашей компании.</p>
          <div className="space-y-3 pt-2">
            {[
              { id: 'no_guarantee', label: 'Не гарантировать результат', desc: 'Не обещай, что клиент точно добьётся цели. Формулируй аккуратно.' },
              { id: 'use_emojis', label: 'Использовать эмодзи', desc: 'Ставь эмодзи в каждом сообщении для позитивного настроя.' },
              { id: 'short_answers', label: 'Отвечать кратко', desc: 'Давай максимально лаконичные ответы, без лишней воды.' },
              { id: 'strict_you', label: 'Строго на "Вы"', desc: 'Всегда обращайся к клиенту на "Вы" с большой буквы.' },
              { id: 'sales_focus', label: 'Фокус на продажах', desc: 'Старайся мягко переводить диалог на покупку или целевое действие.' }
            ].map(rule => (
              <label key={rule.id} className="block cursor-pointer group">
                <input 
                  type="checkbox" 
                  name="rules" 
                  value={rule.label + ': ' + rule.desc} 
                  defaultChecked={(project.rules || []).includes(rule.label + ': ' + rule.desc)}
                  className="sr-only" 
                />
                <div className="p-4 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-none/30 transition-all group-hover:bg-slate-100 dark:bg-slate-50 dark:bg-zinc-800/30 group-has-[:checked]:bg-primary/10 group-has-[:checked]:border-primary/50">
                  <div className="font-medium text-slate-700 dark:text-slate-200 text-sm leading-none transition-colors group-has-[:checked]:text-primary">{rule.label}</div>
                  <div className="text-sm text-slate-500 dark:text-zinc-500 mt-1.5 leading-snug">{rule.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-200 dark:border-zinc-800 pt-6">
        <Label htmlFor="system_prompt" className="text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-zinc-300">Дополнительные инструкции для ИИ</Label>
        <Textarea 
          id="system_prompt" 
          name="system_prompt" 
          defaultValue={project.system_prompt || ''} 
          placeholder="Вы — полезный ИИ-ассистент..."
          className="bg-slate-100 dark:bg-white dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100 min-h-[120px] max-h-[450px] focus-visible:ring-primary/50 resize-y scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent" 
        />
        <p className="text-sm text-slate-500 dark:text-zinc-500">Укажите роль и правила поведения для вашего бота. Этот текст будет скрыт от пользователей.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="space-y-2">
          <Label htmlFor="theme_color" className="text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-zinc-300">Цвет темы (HEX)</Label>
          <div className="flex items-center gap-3">
            <input 
              type="color" 
              className="w-10 h-10 p-0 border border-slate-300 dark:border-zinc-700 rounded-full cursor-pointer shrink-0 overflow-hidden bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:border-none" 
              value={themeColor} 
              onChange={(e) => setThemeColor(e.target.value)}
            />
            <Input 
              id="theme_color" 
              name="theme_color" 
              value={themeColor} 
              onChange={(e) => setThemeColor(e.target.value)}
              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" 
              required 
              className="h-10 bg-slate-100 dark:bg-white dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100 uppercase font-mono focus-visible:ring-primary/50" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="icon" className="text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-zinc-300">Иконка бота</Label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-white dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100/50 flex items-center justify-center overflow-hidden shrink-0">
              {iconPreview ? (
                <Image src={iconPreview} alt="Bot Icon" width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                <Bot size={20} className="text-slate-500 dark:text-zinc-500" />
              )}
            </div>
            <Input 
              id="icon" 
              name="icon" 
              type="file" 
              accept="image/*"
              onChange={handleIconChange}
              className="h-10 pt-[5px] bg-slate-100 dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100 focus-visible:ring-primary/50 cursor-pointer file:text-slate-900 dark:file:text-slate-100 file:bg-slate-200 dark:file:bg-zinc-700 file:border-0 file:rounded-sm file:px-3 file:py-1 file:mr-3 hover:file:bg-slate-300 dark:hover:file:bg-zinc-600 transition-all file:cursor-pointer" 
            />
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-500">Загрузите изображение для аватара.</p>
        </div>
      </div>
      <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-zinc-800">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Как принимать согласие на обработку персональных данных?</h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Согласно 152-ФЗ обязательно получать от клиента согласие на обработку персональных данных.
        </p>
        <div className="space-y-2 max-w-xl">
          <Label htmlFor="privacy_policy_url" className="text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-zinc-300">Вставьте ссылку на согласие на обработку персональных данных</Label>
          <Input 
            id="privacy_policy_url" 
            name="privacy_policy_url" 
            defaultValue={project.privacy_policy_url || ''} 
            placeholder="https://"
            onFocus={(e) => {
              if (!e.target.value) {
                e.target.value = 'https://'
              }
            }}
            className="bg-slate-100 dark:bg-white dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100 focus-visible:ring-primary/50" 
          />
        </div>
      </div>


      <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white transition-colors">
        {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
      </Button>
    </form>
  )
}
