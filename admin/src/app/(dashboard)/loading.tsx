import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Bot } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50 flex flex-col relative overflow-hidden">
      {/* Квадратики на фоне */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_30%,transparent_100%)] pointer-events-none"></div>

      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 py-3 min-h-[4rem] flex flex-wrap items-center justify-between gap-y-3 gap-x-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-zinc-400 whitespace-nowrap">
              Nexus AI
            </h1>
          </div>
          {/* Header Profile Skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 relative z-10">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Дашборд</h2>
            <p className="text-slate-500 dark:text-zinc-400 mt-1">Управляйте вашими виджетами и базами знаний ИИ.</p>
          </div>
          <Skeleton className="h-10 w-[180px] bg-slate-200 dark:bg-zinc-800 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="group relative block h-full">
              <Card className="h-full bg-white dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 backdrop-blur-md relative overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-4 relative z-10 justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="h-12 w-12 rounded-full bg-slate-200 dark:bg-zinc-800 shrink-0" />
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-5 w-3/4 bg-slate-200 dark:bg-zinc-800" />
                      <Skeleton className="h-4 w-1/2 bg-slate-200 dark:bg-zinc-800" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 bg-slate-200 dark:bg-zinc-800 rounded-md shrink-0" />
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-slate-200 dark:bg-zinc-800" />
                    <Skeleton className="h-4 w-4/5 bg-slate-200 dark:bg-zinc-800" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
