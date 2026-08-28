import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Mail, Activity, LogOut, Database } from 'lucide-react'

export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50 flex flex-col relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_30%,transparent_100%)] pointer-events-none"></div>

      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              &larr; Вернуться к проектам
            </div>
            <div className="h-6 w-px bg-slate-300 dark:bg-zinc-800"></div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Настройки аккаунта</h1>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 relative z-10 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Card className="bg-white dark:bg-zinc-900/60 shadow-sm dark:shadow-none border-slate-200 dark:border-zinc-800 backdrop-blur-md md:col-span-1">
            <CardHeader>
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold">
                <Mail className="w-5 h-5 text-slate-500 dark:text-zinc-400" /> Профиль
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12 bg-slate-200 dark:bg-zinc-800" />
                <Skeleton className="h-5 w-48 bg-slate-200 dark:bg-zinc-800" />
              </div>
              <div className="space-y-2 mt-6">
                <Skeleton className="h-4 w-16 bg-slate-200 dark:bg-zinc-800" />
                <Skeleton className="h-8 w-full bg-slate-200 dark:bg-zinc-800 rounded-md" />
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-zinc-800/50">
                <Skeleton className="h-10 w-full bg-red-100 dark:bg-red-900/30 rounded-md" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900/60 shadow-sm dark:shadow-none border-slate-200 dark:border-zinc-800 backdrop-blur-md md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold">
                <Activity className="w-5 h-5 text-slate-500 dark:text-zinc-400" /> Статистика токенов
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800/50 bg-slate-50 dark:bg-zinc-950/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-slate-500 dark:text-zinc-500" />
                      <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-zinc-800" />
                    </div>
                    <Skeleton className="h-8 w-24 bg-slate-200 dark:bg-zinc-800 mb-1" />
                    <Skeleton className="h-3 w-16 bg-slate-200 dark:bg-zinc-800" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}
