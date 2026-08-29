'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle2, FileText, Loader2 } from 'lucide-react'
import { KnowledgeParserUI } from '@/components/shared/knowledge-parser-ui'

export function KnowledgeBaseUpload({ projectId }: { projectId: string }) {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFormatting, setIsFormatting] = useState(false)

  async function handleUpload() {
    if (!text.trim()) return
    setIsLoading(true)
    const toastId = toast.loading('Обработка текста и генерация векторов...')
    
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, projectId })
      })
      
      const data = await res.json()
      if (res.ok) {
        toast.success(`Успешно! Обработано ${data.chunksProcessed} фрагментов текста.`, { id: toastId })
        setText('')
      } else {
        toast.error(`Ошибка: ${data.error}`, { id: toastId })
      }
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message}`, { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleFormatText() {
    if (!text.trim()) return
    setIsFormatting(true)
    const toastId = toast.loading('ИИ анализирует и форматирует текст...')

    try {
      const res = await fetch('/api/format-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, projectId })
      })
      
      const data = await res.json()
      if (res.ok) {
        setText(data.formattedText)
        toast.success(`Текст отформатирован! Списано токенов: ${data.tokensUsed}`, { id: toastId })
      } else {
        toast.error(`Ошибка: ${data.error}`, { id: toastId })
      }
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message}`, { id: toastId })
    } finally {
      setIsFormatting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-zinc-900/40 shadow-sm dark:shadow-none border-slate-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Источники данных (Knowledge Base)</CardTitle>
          <CardDescription className="text-slate-500 dark:text-zinc-400">
            Используйте парсер сайтов или товарных фидов, чтобы быстро наполнить базу знаний ИИ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KnowledgeParserUI 
            projectId={projectId} 
            onComplete={(extractedText) => {
              if (extractedText) {
                setText(prev => prev ? prev + '\n\n' + extractedText : extractedText)
              }
            }} 
          />
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-zinc-900/40 shadow-sm dark:shadow-none border-slate-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Ручное редактирование / Текст
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-zinc-400">
            Вы можете вставить текст вручную или отредактировать результаты парсинга перед векторизацией.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-2">
              <Label htmlFor="kb-text" className="text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-zinc-300">Содержимое для векторизации</Label>
              <div className="flex flex-wrap items-center gap-2 mt-1 lg:mt-0">
                <span className="text-xs text-amber-500/80">Внимание: ИИ-форматирование расходует токены</span>
                <Button 
                  onClick={handleFormatText} 
                  disabled={isFormatting || !text.trim()} 
                  variant="outline" 
                  size="sm"
                  className="bg-white dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
                >
                  {isFormatting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                  Сжать с помощью ИИ
                </Button>
              </div>
            </div>
            <Textarea 
              id="kb-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Вставьте сюда любой текст (инструкции, прайсы, правила)..."
              className="min-h-[250px] font-mono text-sm bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-slate-500 dark:text-slate-300 focus-visible:ring-primary/50"
            />
          </div>
          
          <Button onClick={handleUpload} disabled={isLoading || !text.trim()} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Сохранить в базу знаний
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
