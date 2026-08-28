"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export function SuperAdminTokenChart({ projects }: { projects: any[] }) {
  if (!projects || projects.length === 0) {
    return null
  }

  // Подготавливаем данные для графика
  const data = projects.map(p => ({
    name: p.name,
    'Чат (Токены)': p.chat_tokens_used || 0,
    'База (Токены)': p.parse_tokens_used || 0,
  }))

  if (data.length === 0) {
    return (
      <Card className="bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none border-slate-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Распределение токенов</CardTitle>
          <CardDescription className="text-slate-500 dark:text-zinc-400">Сравнение затрат между активными ботами</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4 flex items-center justify-center text-slate-500 dark:text-zinc-500 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-lg">
            Нет данных для отображения
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none border-slate-200 dark:border-zinc-800">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-slate-100">Распределение токенов</CardTitle>
        <CardDescription className="text-slate-500 dark:text-zinc-400">Сравнение затрат между активными ботами</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#a1a1aa" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#a1a1aa" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                cursor={{ fill: '#27272a', opacity: 0.5 }}
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f8fafc' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Чат (Токены)" stackId="a" fill="#60a5fa" radius={[0, 0, 4, 4]} />
              <Bar dataKey="База (Токены)" stackId="a" fill="#c084fc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
