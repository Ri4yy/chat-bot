'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BrainCircuit, Database, Trash2, Clock, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { createClient } from '@/lib/supabase/client'

export function KnowledgeBaseList({ projectId, permissions = ['memory_delete'] }: { projectId: string, permissions?: string[] }) {
  const [documents, setDocuments] = useState<any[]>([])
  const [quickQuestions, setQuickQuestions] = useState<string[]>([])
  const [newQuestion, setNewQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const supabase = createClient()

  async function handleGenerateQuestions() {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/project/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      if (res.ok) {
        toast.success('Стартовые вопросы успешно сгенерированы!')
        fetchDocs() // Re-fetch to get new questions
      } else {
        let errorMsg = 'Неизвестная ошибка'
        try {
          const data = await res.json()
          errorMsg = data.error || errorMsg
        } catch(e) {
          errorMsg = res.statusText || 'Сервер не вернул ответ'
        }
        toast.error('Ошибка генерации: ' + errorMsg)
      }
    } catch (e: any) {
      toast.error('Ошибка сети: ' + e.message)
    } finally {
      setIsGenerating(false)
    }
  }

  async function fetchDocs() {
    try {
      const res = await fetch(`/api/knowledge/list?projectId=${projectId}`)
      const data = await res.json()
      
      const { data: project } = await supabase.from('projects').select('quick_questions').eq('id', projectId).single()
      
      if (res.ok) {
        setDocuments(data.documents || [])
        setQuickQuestions(project?.quick_questions || [])
      } else {
        toast.error('Ошибка загрузки памяти: ' + data.error)
      }
    } catch (e: any) {
      toast.error('Сетевая ошибка: ' + e.message)
    } finally {
      setIsLoading(false)
    }
  }

  const [isDeletingAll, setIsDeletingAll] = useState(false)

  async function handleDelete(id: string) {
    if (!confirm('Удалить этот фрагмент из памяти бота?')) return
    
    setDeletingId(id)
    try {
      const res = await fetch('/api/knowledge/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, projectId })
      })
      if (res.ok) {
        toast.success('Успешно удалено из базы!')
        setDocuments(prev => prev.filter(d => d.id !== id))
      } else {
        const data = await res.json()
        toast.error('Ошибка удаления: ' + data.error)
      }
    } catch (e: any) {
      toast.error('Ошибка сети: ' + e.message)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDeleteAll() {
    if (!confirm('ВЫ УВЕРЕНЫ? Это удалит ВСЕ сохраненные данные из памяти этого проекта!')) return
    
    setIsDeletingAll(true)
    const allIds = documents.map(d => d.id)
    
    try {
      const res = await fetch('/api/knowledge/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: allIds, projectId })
      })
      if (res.ok) {
        toast.success('Вся память успешно очищена!')
        setDocuments([])
      } else {
        const data = await res.json()
        toast.error('Ошибка удаления: ' + data.error)
      }
    } catch (e: any) {
      toast.error('Ошибка сети: ' + e.message)
    } finally {
      setIsDeletingAll(false)
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [projectId])

  const totalWords = documents.reduce((acc, doc) => acc + (doc.content?.split(/\s+/).length || 0), 0)

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Векторных фрагментов</p>
              <h3 className="text-2xl font-bold text-slate-100">{documents.length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Примерный объем (слов)</p>
              <h3 className="text-2xl font-bold text-slate-100">~{totalWords.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-slate-100">Стартовые вопросы</CardTitle>
            <CardDescription className="text-zinc-400">Быстрые подсказки, которые видят пользователи в начале чата.</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateQuestions} 
            disabled={isGenerating}
            className="border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isGenerating ? 'Генерация...' : 'Сгенерировать ИИ'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quickQuestions.map((q, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input 
                  value={q} 
                  readOnly
                  className="bg-zinc-950 border-zinc-800 text-zinc-300" 
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={async () => {
                    const newQs = quickQuestions.filter((_, i) => i !== idx)
                    setQuickQuestions(newQs)
                    await supabase.from('projects').update({ quick_questions: newQs }).eq('id', projectId)
                  }}
                  className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800/50">
              <Input 
                placeholder="Новый вопрос..." 
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && newQuestion.trim()) {
                    const newQs = [...quickQuestions, newQuestion.trim()]
                    setQuickQuestions(newQs)
                    setNewQuestion('')
                    await supabase.from('projects').update({ quick_questions: newQs }).eq('id', projectId)
                  }
                }}
                className="bg-zinc-950 border-zinc-800 text-zinc-300" 
              />
              <Button 
                onClick={async () => {
                  if (newQuestion.trim()) {
                    const newQs = [...quickQuestions, newQuestion.trim()]
                    setQuickQuestions(newQs)
                    setNewQuestion('')
                    await supabase.from('projects').update({ quick_questions: newQs }).eq('id', projectId)
                  }
                }}
                className="bg-primary text-primary-foreground shrink-0"
              >
                Добавить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-slate-100">Содержимое памяти</CardTitle>
            <CardDescription className="text-zinc-400">Все фрагменты текста, которые ИИ использует для ответов.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchDocs} className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white">
              Обновить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center p-8 border border-zinc-800 border-dashed rounded-lg bg-zinc-900/30 text-zinc-500">
              База знаний пока пуста. Загрузите данные в разделе "База знаний".
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 rounded-lg bg-zinc-950 border border-zinc-800/80 group transition-colors hover:border-zinc-700">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs text-zinc-500 flex items-center mt-3 border-t border-zinc-800/50 pt-2">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(doc.created_at).toLocaleString('ru-RU')}
                    </div>
                    {permissions.includes('memory_delete') && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity self-start -mt-1 -mr-1 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 h-8 w-8 rounded-full"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed line-clamp-4">
                    {doc.content}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-zinc-500">
              Суммарно: {documents.length} блоков
            </p>
            
            {permissions.includes('memory_delete') && documents.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20"
              >
                {isDeletingAll ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Удаление...</>
                ) : (
                  <><Trash2 className="w-4 h-4 mr-2" /> Очистить память ({documents.length})</>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
