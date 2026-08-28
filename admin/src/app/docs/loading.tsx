import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, BookOpen } from 'lucide-react'

export default function DocsLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50 flex flex-col relative overflow-hidden">
      {/* Квадратики на фоне */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_30%,transparent_100%)] pointer-events-none"></div>

      <header className="border-b border-slate-200 dark:border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-2">
              <ArrowLeft size={16} /> Назад
            </div>
            <div className="h-6 w-px bg-slate-300 dark:bg-zinc-800 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <BookOpen className="w-5 h-5 text-slate-900 dark:text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 hidden sm:block">
                Справка
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 relative z-10 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation Skeleton */}
        <aside className="w-full md:w-64 shrink-0">
          <Card className="bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none border-slate-200 dark:border-slate-200 dark:border-zinc-800 sticky top-8">
            <CardContent className="p-4 flex flex-col gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg relative overflow-hidden">
                  <Skeleton className="w-5 h-5 bg-slate-200 dark:bg-zinc-800 shrink-0" />
                  <Skeleton className="h-4 w-3/4 bg-slate-200 dark:bg-zinc-800" />
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* Main Content Area Skeleton */}
        <section className="flex-1 min-w-0">
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4 max-w-lg bg-slate-200 dark:bg-zinc-800" />
            <Skeleton className="h-6 w-full bg-slate-200 dark:bg-zinc-800" />
            <Skeleton className="h-6 w-4/5 bg-slate-200 dark:bg-zinc-800" />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
                  <Skeleton className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800 mb-4" />
                  <Skeleton className="h-6 w-32 bg-slate-200 dark:bg-zinc-800 mb-2" />
                  <Skeleton className="h-4 w-full bg-slate-200 dark:bg-zinc-800 mb-1" />
                  <Skeleton className="h-4 w-5/6 bg-slate-200 dark:bg-zinc-800 mb-1" />
                  <Skeleton className="h-4 w-4/5 bg-slate-200 dark:bg-zinc-800" />
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
