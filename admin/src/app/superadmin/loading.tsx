import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Users, Bot, Settings2 } from 'lucide-react'

export default function SuperAdminLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Sidebar Menu Skeleton */}
      <div className="md:col-span-1 space-y-4">
        <Card className="bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none border-slate-200 dark:border-zinc-800">
          <CardHeader>
            <Skeleton className="h-6 w-24 bg-slate-200 dark:bg-zinc-800" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-2 flex items-center gap-2 rounded-md">
                <Skeleton className="w-4 h-4 bg-slate-200 dark:bg-zinc-800" />
                <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-zinc-800" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="md:col-span-3 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none border-slate-200 dark:border-zinc-800">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-zinc-800" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-slate-200 dark:bg-zinc-800" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none border-slate-200 dark:border-zinc-800">
          <CardHeader>
            <Skeleton className="h-6 w-48 bg-slate-200 dark:bg-zinc-800" />
            <Skeleton className="h-4 w-64 bg-slate-200 dark:bg-zinc-800 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-zinc-800 rounded-md p-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4 mb-4">
                  <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-zinc-800" />
                  <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-zinc-800" />
                  <Skeleton className="h-4 w-16 bg-slate-200 dark:bg-zinc-800" />
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full bg-slate-200 dark:bg-zinc-800" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-zinc-800" />
                        <Skeleton className="h-3 w-48 bg-slate-200 dark:bg-zinc-800" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-24 bg-slate-200 dark:bg-zinc-800 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
