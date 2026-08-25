'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ChatSession = {
  id: string
  created_at: string
  chat_messages: {
    id: string
    role: string
    content: string
    created_at: string
  }[]
}

export function DialogHistory({ projectId }: { projectId: string }) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [onlyLeads, setOnlyLeads] = useState(false)
  const PAGE_SIZE = 14

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('chat_sessions')
        .select(`
          id, 
          created_at,
          chat_messages (
            id, role, content, created_at
          )
        `, { count: 'exact' })
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (onlyLeads) {
        const { data: leads } = await supabase.from('leads').select('session_id').eq('project_id', projectId)
        if (leads && leads.length > 0) {
          query = query.in('id', leads.map(l => l.session_id))
        } else {
          setSessions([])
          setTotalPages(1)
          setLoading(false)
          return
        }
      }

      const { data, error, count } = await query.range(from, to)

      if (error) {
        console.error('Error fetching chat history:', error)
      } else if (data) {
        // Sort messages inside sessions
        const sortedData = data.map(session => ({
          ...session,
          chat_messages: session.chat_messages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        }))
        setSessions(sortedData)
        if (count !== null) {
          setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)))
        }
      }
      setLoading(false)
    }

    fetchHistory()
  }, [projectId, page, onlyLeads])

  if (loading) {
    return <div>Загрузка истории...</div>
  }

  if (sessions.length === 0) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle>История диалогов</CardTitle>
          <CardDescription>Здесь пока пусто. Как только кто-то напишет боту, диалог появится здесь.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle>История диалогов</CardTitle>
          <CardDescription>Здесь сохраняются все переписки пользователей с виджетом.</CardDescription>
        </div>
        <div className="flex items-center space-x-2 bg-zinc-900/50 p-2 rounded-md border border-zinc-800">
          <Switch 
            id="leads-mode" 
            checked={onlyLeads} 
            onCheckedChange={(c) => { setOnlyLeads(c); setPage(1); }} 
          />
          <Label htmlFor="leads-mode" className="text-zinc-300 cursor-pointer">Только с лидами</Label>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion className="w-full">
          {sessions.map((session) => (
            <AccordionItem key={session.id} value={session.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex justify-between w-full pr-4 text-sm">
                  <span className="font-medium text-slate-200">
                    Сессия от {new Date(session.created_at).toLocaleString('ru-RU')}
                  </span>
                  <span className="text-zinc-500">
                    Сообщений: {session.chat_messages.length}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 p-4 bg-zinc-900/50 rounded-md border border-zinc-800/50 mt-2 max-h-[500px] overflow-y-auto">
                  {session.chat_messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-zinc-800 text-slate-200 rounded-bl-none border border-zinc-700'
                      }`}>
                        <div className="font-semibold text-[10px] opacity-50 mb-1 uppercase tracking-wider">
                          {msg.role === 'user' ? 'Пользователь' : 'AI Assistant'}
                        </div>
                        {msg.content}
                        <div className="text-[10px] mt-2 opacity-40 text-right">
                          {new Date(msg.created_at).toLocaleTimeString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {session.chat_messages.length === 0 && (
                    <div className="text-zinc-500 text-center py-2 text-sm">Пустой диалог</div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 border-t border-zinc-800 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
            >
              Назад
            </Button>
            <span className="text-sm text-zinc-400">
              Страница {page} из {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
            >
              Вперед
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
