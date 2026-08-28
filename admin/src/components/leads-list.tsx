'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Lead = {
  id: string
  contact_info: string
  message: string
  created_at: string
}

function formatContact(contact: string) {
  if (!contact) return contact;
  const digits = contact.replace(/\D/g, '')
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    const prefix = digits.startsWith('7') ? '+7' : '8'
    const match = digits.match(/^[78](\d{3})(\d{3})(\d{2})(\d{2})$/)
    if (match) {
      return `${prefix} (${match[1]}) ${match[2]}-${match[3]}-${match[4]}`
    }
  }
  return contact
}

export function LeadsList({ projectId }: { projectId: string }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching leads:', error)
      } else if (data) {
        setLeads(data)
      }
      setLoading(false)
    }

    fetchLeads()
  }, [projectId])

  if (loading) {
    return <div>Загрузка лидов...</div>
  }

  if (leads.length === 0) {
    return (
      <Card className="bg-white dark:bg-zinc-900 shadow-sm dark:shadow-none shadow-sm dark:shadow-none/50 shadow-sm dark:shadow-none border-slate-200 dark:border-slate-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle>Собранные лиды</CardTitle>
          <CardDescription>Пока никто не оставил контактов. Бот будет автоматически сохранять здесь номера телефонов и email-адреса из диалогов.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-zinc-900 shadow-sm dark:shadow-none shadow-sm dark:shadow-none/50 shadow-sm dark:shadow-none border-slate-200 dark:border-slate-200 dark:border-zinc-800">
      <CardHeader>
        <CardTitle>Собранные лиды ({leads.length})</CardTitle>
        <CardDescription>Здесь отображаются все контактные данные, которые клиенты оставили в чате.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Контакт</TableHead>
              <TableHead>Сообщение клиента</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const isExpanded = expandedId === lead.id
              return (
                <TableRow key={lead.id}>
                  <TableCell className="whitespace-nowrap align-top pt-4">
                    {new Date(lead.created_at).toLocaleString('ru-RU')}
                  </TableCell>
                  <TableCell className="font-medium text-primary align-top pt-4 whitespace-nowrap">
                    {formatContact(lead.contact_info)}
                  </TableCell>
                  <TableCell className="align-top pt-4 whitespace-normal min-w-[300px]">
                    <div 
                      title={!isExpanded ? lead.message : undefined}
                      className={`cursor-pointer text-slate-900 dark:text-slate-500 dark:text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-slate-700 dark:text-zinc-300 leading-relaxed transition-all break-words w-full ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}
                      onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                    >
                      {lead.message}
                    </div>
                    {!isExpanded && (
                      <div 
                        className="text-xs text-slate-900 dark:text-slate-500 dark:text-slate-500 dark:text-zinc-500 mt-1 cursor-pointer hover:text-slate-900 dark:text-slate-500 dark:text-zinc-400 inline-block"
                        onClick={() => setExpandedId(lead.id)}
                      >
                        Развернуть
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
