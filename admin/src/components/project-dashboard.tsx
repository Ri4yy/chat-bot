'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MousePointerClick,  MessageSquareText, Users, Activity, Loader2, ArrowUpRight, ArrowDownRight  } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Button } from '@/components/ui/button'
import { ProjectAnalytics } from '@/components/project-analytics'

type ChartDataPoint = {
  date: string
  opens: number
  sessions: number
  leads: number
}

type DashboardStats = {
  currentOpens: number
  opensTrend: number
  currentSessions: number
  sessionsTrend: number
  currentLeads: number
  leadsTrend: number
  currentConversion: number
  conversionTrend: number
  chartData: ChartDataPoint[]
}

type TimeRange = 'today' | 'week' | 'month'

export function ProjectDashboard({ projectId }: { projectId: string }) {
  const supabase = createClient()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('month')

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true)
      try {
        const now = new Date()
        const fromDate = new Date()
        const prevDate = new Date()
        
        let daysCount = 30
        if (timeRange === 'today') {
          daysCount = 1
          fromDate.setHours(now.getHours() - 24)
          prevDate.setHours(now.getHours() - 48)
        } else if (timeRange === 'week') {
          daysCount = 7
          fromDate.setDate(now.getDate() - 7)
          prevDate.setDate(now.getDate() - 14)
        } else {
          daysCount = 30
          fromDate.setDate(now.getDate() - 30)
          prevDate.setDate(now.getDate() - 60)
        }

        const [
          { data: sessions, error: sessionsError },
          { data: leads, error: leadsError },
          { data: opens, error: opensError }
        ] = await Promise.all([
          supabase
            .from('chat_sessions')
            .select('created_at')
            .eq('project_id', projectId)
            .gte('created_at', prevDate.toISOString()),
          supabase
            .from('leads')
            .select('created_at')
            .eq('project_id', projectId)
            .gte('created_at', prevDate.toISOString()),
          supabase
            .from('widget_opens')
            .select('created_at')
            .eq('project_id', projectId)
            .gte('created_at', prevDate.toISOString())
        ])

        if (sessionsError) throw sessionsError
        if (leadsError) throw leadsError
        if (opensError) throw opensError

        // Process Metrics
        const currentSessions = sessions.filter(s => new Date(s.created_at) >= fromDate).length
        const previousSessions = sessions.filter(s => new Date(s.created_at) < fromDate).length
        
        const currentLeads = leads.filter(l => new Date(l.created_at) >= fromDate).length
        const previousLeads = leads.filter(l => new Date(l.created_at) < fromDate).length
        
        const currentOpens = opens.filter(o => new Date(o.created_at) >= fromDate).length
        const previousOpens = opens.filter(o => new Date(o.created_at) < fromDate).length

        // Conversion now calculated as Leads / Opens
        const currentConversion = currentOpens > 0 ? (currentLeads / currentOpens) * 100 : 0
        const previousConversion = previousOpens > 0 ? (previousLeads / previousOpens) * 100 : 0

        const calcTrend = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0
          return ((current - previous) / previous) * 100
        }

        const opensTrend = calcTrend(currentOpens, previousOpens)
        const sessionsTrend = calcTrend(currentSessions, previousSessions)
        const leadsTrend = calcTrend(currentLeads, previousLeads)
        const conversionTrend = currentConversion - previousConversion

        // Build Chart Data
        const chartDataMap = new Map<string, ChartDataPoint>()
        
        if (timeRange === 'today') {
          // Group by hour for last 24h
          for (let i = 23; i >= 0; i--) {
            const d = new Date()
            d.setHours(now.getHours() - i)
            const dateStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            chartDataMap.set(dateStr, { date: dateStr, opens: 0, sessions: 0, leads: 0 })
          }

          sessions.filter(s => new Date(s.created_at) >= fromDate).forEach(s => {
            const dateStr = new Date(s.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            // We might not hit exactly 00 minute if we group by exact hour-minute.
            // Better group by just hour: 13:00, 14:00 etc.
          })
          // Let's refine grouping by hour
        }
        
        // Actually, if we group by hour, let's just make `dateStr` be "15:00"
        if (timeRange === 'today') {
          chartDataMap.clear()
          for (let i = 23; i >= 0; i--) {
            const d = new Date()
            d.setHours(now.getHours() - i)
            const hour = d.getHours()
            const dateStr = `${hour.toString().padStart(2, '0')}:00`
            if (!chartDataMap.has(dateStr)) {
              chartDataMap.set(dateStr, { date: dateStr, opens: 0, sessions: 0, leads: 0 })
            }
          }
          sessions.filter(s => new Date(s.created_at) >= fromDate).forEach(s => {
            const d = new Date(s.created_at)
            const dateStr = `${d.getHours().toString().padStart(2, '0')}:00`
            if (chartDataMap.has(dateStr)) chartDataMap.get(dateStr)!.sessions++
          })
          leads.filter(l => new Date(l.created_at) >= fromDate).forEach(l => {
            const d = new Date(l.created_at)
            const dateStr = `${d.getHours().toString().padStart(2, '0')}:00`
            if (chartDataMap.has(dateStr)) chartDataMap.get(dateStr)!.leads++
          })
          opens.filter(o => new Date(o.created_at) >= fromDate).forEach(o => {
            const d = new Date(o.created_at)
            const dateStr = `${d.getHours().toString().padStart(2, '0')}:00`
            if (chartDataMap.has(dateStr)) chartDataMap.get(dateStr)!.opens++
          })
        } else {
          // Group by day for week/month
          for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date()
            d.setDate(now.getDate() - i)
            const dateStr = d.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
            chartDataMap.set(dateStr, { date: dateStr, opens: 0, sessions: 0, leads: 0 })
          }

          sessions.filter(s => new Date(s.created_at) >= fromDate).forEach(s => {
            const dateStr = new Date(s.created_at).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
            if (chartDataMap.has(dateStr)) chartDataMap.get(dateStr)!.sessions++
          })

          leads.filter(l => new Date(l.created_at) >= fromDate).forEach(l => {
            const dateStr = new Date(l.created_at).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
            if (chartDataMap.has(dateStr)) chartDataMap.get(dateStr)!.leads++
          })
          opens.filter(o => new Date(o.created_at) >= fromDate).forEach(o => {
            const dateStr = new Date(o.created_at).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
            if (chartDataMap.has(dateStr)) chartDataMap.get(dateStr)!.opens++
          })
        }

        setStats({
          currentOpens,
          opensTrend,
          currentSessions,
          sessionsTrend,
          currentLeads,
          leadsTrend,
          currentConversion,
          conversionTrend,
          chartData: Array.from(chartDataMap.values())
        })

      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [projectId, supabase, timeRange])

  const renderTrendBadge = (trend: number, isPercentPoint = false) => {
    const isPositive = trend >= 0
    const colorClass = isPositive ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight
    
    let displayValue = Math.abs(trend).toFixed(1)
    if (!isPercentPoint) displayValue += '%'

    return (
      <div className={`flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colorClass}`}>
        <Icon className="w-3.5 h-3.5 mr-1" />
        {isPositive ? '+' : '-'}{displayValue}
      </div>
    )
  }

  const periodLabels = {
    today: '24 ч',
    week: '7 дн',
    month: '30 дн'
  }
  
  const periodDesc = {
    today: 'за последние 24 часа',
    week: 'за последние 7 дней',
    month: 'за последние 30 дней'
  }

  return (
    <div className="space-y-6">
      
      {/* Top Bar with range switch */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Аналитика</h2>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Ключевые показатели работы ИИ-ассистента.</p>
        </div>
        
        <div className="flex flex-wrap bg-white dark:bg-zinc-900/40 p-1 rounded-lg border border-slate-200 dark:border-zinc-800/50 shadow-sm">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setTimeRange('today')}
            className={`text-xs px-3 h-8 ${timeRange === 'today' ? 'bg-white dark:bg-zinc-800/80 text-slate-900 dark:text-white shadow-sm shadow-sm' : 'text-slate-700 dark:text-zinc-400'}`}
          >
            Сегодня
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setTimeRange('week')}
            className={`text-xs px-3 h-8 ${timeRange === 'week' ? 'bg-white dark:bg-zinc-800/80 text-slate-900 dark:text-white shadow-sm shadow-sm' : 'text-slate-700 dark:text-zinc-400'}`}
          >
            Неделя
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setTimeRange('month')}
            className={`text-xs px-3 h-8 ${timeRange === 'month' ? 'bg-white dark:bg-zinc-800/80 text-slate-900 dark:text-white shadow-sm shadow-sm' : 'text-slate-700 dark:text-zinc-400'}`}
          >
            Месяц
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800">
          <CardContent className="p-8 flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-slate-500 dark:text-zinc-500 animate-spin" />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-white dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800/50 hover:border-slate-300 dark:border-zinc-700/50 transition-colors shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-zinc-400">Открытий виджета</CardTitle>
                <MousePointerClick className="w-4 h-4 text-slate-500 dark:text-zinc-500" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats?.currentOpens.toLocaleString()}</div>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2">
                      <span className="text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-zinc-300">Окно развернуто</span>
                    </p>
                  </div>
                  <div className="mb-1">{renderTrendBadge(stats?.opensTrend || 0)}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800/50 hover:border-slate-300 dark:border-zinc-700/50 transition-colors shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-zinc-400">Диалоги ({periodLabels[timeRange]})</CardTitle>
                <MessageSquareText className="w-4 h-4 text-slate-500 dark:text-zinc-500" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats?.currentSessions.toLocaleString()}</div>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2">
                      <span className="text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-zinc-300">Запросов от клиентов</span>
                    </p>
                  </div>
                  <div className="mb-1">{renderTrendBadge(stats?.sessionsTrend || 0)}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800/50 hover:border-slate-300 dark:border-zinc-700/50 transition-colors shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-zinc-400">Собрано Лидов ({periodLabels[timeRange]})</CardTitle>
                <Users className="w-4 h-4 text-slate-500 dark:text-zinc-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats?.currentLeads.toLocaleString()}</div>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2">
                      <span className="text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-zinc-300">Оставлено контактов</span>
                    </p>
                  </div>
                  <div className="mb-1">{renderTrendBadge(stats?.leadsTrend || 0)}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800/50 hover:border-slate-300 dark:border-zinc-700/50 transition-colors shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-zinc-400">Конверсия ({periodLabels[timeRange]})</CardTitle>
                <Activity className="w-4 h-4 text-slate-500 dark:text-zinc-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats?.currentConversion.toFixed(1)}%</div>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2">
                      <span className="text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-zinc-300">Доля успешных сессий</span>
                    </p>
                  </div>
                  <div className="mb-1">{renderTrendBadge(stats?.conversionTrend || 0, true)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Area */}
          <Card className="bg-white dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800/50 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 dark:border-zinc-800/50 pb-4 mb-4">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Активность пользователей</CardTitle>
                <CardDescription className="text-slate-500 dark:text-zinc-400 mt-1">График активности {periodDesc[timeRange]}</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center text-xs text-slate-500 dark:text-zinc-400"><span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>Открытия</div>
                <div className="flex items-center text-xs text-slate-500 dark:text-zinc-400"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>Диалоги</div>
                <div className="flex items-center text-xs text-slate-500 dark:text-zinc-400"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>Лиды</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.chartData || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-700 dark:text-slate-200 dark:text-zinc-800" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#71717a' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#71717a' }} 
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 p-3 rounded-lg shadow-sm text-sm text-slate-900 dark:text-slate-100">
                              <p className="font-medium mb-1">{label}</p>
                              {payload.map((entry, index) => (
                                <p key={index} style={{color: entry.color}}>
                                  {entry.name}: {entry.value}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{fill: 'transparent'}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="opens" 
                      name="Открытия виджета" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorOpens)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sessions" 
                      name="Диалоги"
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorSessions)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="leads" 
                      name="Лиды"
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorLeads)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* AI Analytics Blocks */}
          <ProjectAnalytics projectId={projectId} />
        </>
      )}
    </div>
  )
}
