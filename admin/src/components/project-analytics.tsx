"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sparkles, MessageCircleQuestion, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type AnalyticsCache = {
  last_updated: string
  top_questions: string[]
  unanswered_questions: string[]
}

export function ProjectAnalytics({ projectId }: { projectId: string }) {
  const supabase = createClient()
  const [data, setData] = useState<AnalyticsCache | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    const { data: project } = await supabase
      .from('projects')
      .select('analytics_cache')
      .eq('id', projectId)
      .single()
    
    if (project?.analytics_cache) {
      setData(project.analytics_cache)
    }
    setIsLoading(false)
  }

  const generateAnalytics = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/project/analytics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      if (!res.ok) {
        throw new Error('Ошибка генерации')
      }

      const newData = await res.json()
      setData(newData)
    } catch (error) {
      console.error(error)
      alert('Не удалось обновить аналитику. Возможно, диалогов пока недостаточно.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      
      <Card className="bg-[#09090b] border-zinc-800/50">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between items-start gap-3 pb-2 border-b border-zinc-800/50 mb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <MessageCircleQuestion className="w-5 h-5 text-blue-400" />
              Облако вопросов
            </CardTitle>
            <CardDescription className="text-zinc-400 mt-1">О чем чаще всего спрашивают</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateAnalytics} 
            disabled={isGenerating}
            className="border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />}
            AI Анализ
          </Button>
        </CardHeader>
        <CardContent>
          {!data?.top_questions || data.top_questions.length === 0 ? (
            <div className="text-center p-8 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-lg">
              Нажмите "AI Анализ", чтобы сгенерировать облако вопросов по истории чатов.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.top_questions.map((q, i) => (
                <div key={i} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm rounded-full">
                  {q}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#09090b] border-zinc-800/50">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between items-start gap-3 pb-2 border-b border-zinc-800/50 mb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Слабые места
            </CardTitle>
            <CardDescription className="text-zinc-400 mt-1">На что бот не смог ответить</CardDescription>
          </div>
          {data?.last_updated && (
            <div className="text-xs text-zinc-500">
              Обновлено: {new Date(data.last_updated).toLocaleDateString()}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!data?.unanswered_questions || data.unanswered_questions.length === 0 ? (
            <div className="text-center p-8 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-lg">
              {data ? 'Нет данных о вопросах без ответа. Отличная работа!' : 'Аналитика еще не проводилась.'}
            </div>
          ) : (
            <ul className="space-y-3 mt-2">
              {data.unanswered_questions.map((q, i) => (
                <li key={i} className="flex gap-3 text-sm text-red-200 bg-red-950/20 p-3 rounded-lg border border-red-900/30">
                  <span className="text-red-500 font-bold shrink-0">•</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      
    </div>
  )
}
