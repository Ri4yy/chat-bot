import Link from 'next/link'
import { BookOpen, ArrowLeft } from 'lucide-react'
import DocsClient from './client'
import { HeaderProfile } from '@/components/header-profile'

export const metadata = {
  title: 'База знаний | AI Widget',
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_30%,transparent_100%)] pointer-events-none"></div>

      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
              <ArrowLeft size={16} /> Назад
            </Link>
            <div className="h-6 w-px bg-zinc-800 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-100 hidden sm:block">
                Справка
              </h1>
            </div>
          </div>
          
          <HeaderProfile />
        </div>
      </header>

      <DocsClient />
    </div>
  )
}
