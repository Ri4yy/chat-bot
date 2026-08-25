import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BrainCircuit, Mail, Activity, LogOut, MessageSquareText, Database } from 'lucide-react'
import { CopyIdButton } from '@/components/copy-id-button'

export default async function AccountPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch token usage
  const { data: usageData } = await supabase
    .from('user_usage')
    .select('tokens_used, chat_tokens_used, parse_tokens_used')
    .eq('user_id', user.id)
    .single()

  const tokensUsed = usageData?.tokens_used || 0
  const chatTokens = usageData?.chat_tokens_used || 0
  const parseTokens = usageData?.parse_tokens_used || 0

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 flex flex-col relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_30%,transparent_100%)] pointer-events-none"></div>

      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              &larr; Вернуться к проектам
            </Link>
            <div className="h-6 w-px bg-zinc-800"></div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">Настройки аккаунта</h1>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="flex items-center text-sm font-medium text-red-400 hover:text-red-300 transition-colors">
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 relative z-10 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-md md:col-span-1">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Mail className="w-5 h-5 text-zinc-400" /> Профиль
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Email</p>
                <p className="text-base font-medium text-slate-200">{user.email}</p>
              </div>
              <div className="space-y-1 mt-4">
                <p className="text-sm text-zinc-400">ID пользователя</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono text-zinc-500 truncate">{user.id}</p>
                  <CopyIdButton id={user.id} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-md md:col-span-2">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-zinc-400" /> Статистика использования
              </CardTitle>
              <CardDescription className="text-zinc-400">Биллинг и ресурсы, потраченные на ваш аккаунт</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-6 flex items-center gap-6">
                <div className="p-4 bg-primary/10 rounded-full">
                  <BrainCircuit className="w-8 h-8 text-primary" />
                </div>
                <div className="relative group">
                  <h4 className="text-3xl font-bold text-slate-100 underline decoration-dashed decoration-zinc-700 underline-offset-4 cursor-help">
                    {tokensUsed.toLocaleString()}
                  </h4>
                  <p className="text-sm font-medium text-zinc-400 mt-2">
                    Токенов ИИ израсходовано
                  </p>
                  
                  {/* CSS Hover Tooltip */}
                  <div className="absolute left-0 top-full mt-3 w-64 p-4 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="flex flex-col gap-3 text-sm">
                      <div className="flex justify-between items-center text-zinc-300">
                        <span className="flex items-center gap-2"><MessageSquareText className="w-4 h-4 text-zinc-400" /> Чат-бот:</span>
                        <span className="font-semibold text-white">{chatTokens.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-300">
                        <span className="flex items-center gap-2"><Database className="w-4 h-4 text-zinc-400" /> Парсинг:</span>
                        <span className="font-semibold text-white">{parseTokens.toLocaleString()}</span>
                      </div>
                    </div>
                    {/* Arrow */}
                    <div className="absolute -top-2 left-6 w-4 h-4 bg-zinc-900 border-t border-l border-zinc-700 transform rotate-45"></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
                * Токены расходуются во время общения клиентов с вашим чат-ботом, а также при включенной опции "ИИ-структурирование" во время парсинга сайтов (использует мощности нейросетей для очистки текста от визуального мусора).
              </p>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}
