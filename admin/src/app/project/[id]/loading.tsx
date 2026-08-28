import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LineChart, Settings, Database, Brain, MessageSquare, Users, Shield, Code, Plug } from 'lucide-react'

export default function ProjectLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50 flex flex-col relative overflow-hidden">
      {/* Квадратики на фоне */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_30%,transparent_100%)] pointer-events-none"></div>

      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              &larr; Назад к дашборду
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800"></div>
            <Skeleton className="h-7 w-32 bg-slate-200 dark:bg-zinc-800" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Sidebar Skeleton */}
          <div className="md:col-span-1 space-y-4">
            <Card className="bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800">
              <CardHeader>
                <Skeleton className="h-6 w-16 bg-slate-200 dark:bg-zinc-800" />
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Skeleton className="h-3 w-32 bg-slate-200 dark:bg-zinc-800 mt-2 mb-1 px-4" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="px-4 py-2 flex items-center gap-2 rounded-md">
                    <Skeleton className="w-4 h-4 bg-slate-200 dark:bg-zinc-800" />
                    <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-zinc-800" />
                  </div>
                ))}

                <Skeleton className="h-3 w-24 bg-slate-200 dark:bg-zinc-800 mt-4 mb-1 px-4" />
                {[1, 2].map((i) => (
                  <div key={i} className="px-4 py-2 flex items-center gap-2 rounded-md">
                    <Skeleton className="w-4 h-4 bg-slate-200 dark:bg-zinc-800" />
                    <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-zinc-800" />
                  </div>
                ))}

                <Skeleton className="h-3 w-20 bg-slate-200 dark:bg-zinc-800 mt-4 mb-1 px-4" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="px-4 py-2 flex items-center gap-2 rounded-md">
                    <Skeleton className="w-4 h-4 bg-slate-200 dark:bg-zinc-800" />
                    <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-zinc-800" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area Skeleton */}
          <div className="md:col-span-2 space-y-4">
            <Card className="bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 backdrop-blur-md">
              <CardHeader>
                <Skeleton className="h-6 w-48 bg-slate-200 dark:bg-zinc-800 mb-2" />
                <Skeleton className="h-4 w-64 bg-slate-200 dark:bg-zinc-800" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full bg-slate-200 dark:bg-zinc-800 rounded-md" />
                <Skeleton className="h-10 w-full bg-slate-200 dark:bg-zinc-800 rounded-md" />
                <Skeleton className="h-10 w-3/4 bg-slate-200 dark:bg-zinc-800 rounded-md" />
              </CardContent>
            </Card>
          </div>
          
        </div>
      </main>
    </div>
  )
}
