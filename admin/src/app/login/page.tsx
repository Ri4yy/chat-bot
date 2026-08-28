'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-zinc-950 text-slate-50 overflow-hidden">
      {/* Квадратики на фоне (Grid Pattern) */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none"></div>
      
      {/* Декоративное свечение (Liquid Glass effect support) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none">
        <div className="w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full animate-blob"></div>
      </div>
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none">
        <div className="w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full animate-blob [animation-delay:2s]"></div>
      </div>

      <Card className="w-[420px] z-10 bg-zinc-900/40 border-zinc-700/50 backdrop-blur-2xl shadow-2xl text-slate-100 p-2">
        <CardHeader className="space-y-2 pt-10 pb-4">
          <CardTitle className="text-3xl font-bold tracking-tight text-center">Добро пожаловать</CardTitle>
          <CardDescription className="text-zinc-400 text-center text-base">Войдите, чтобы управлять вашими виджетами ИИ.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="auth-form" className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-zinc-500 dark:text-zinc-300">Электронная почта</Label>
              <Input id="email" name="email" type="email" placeholder="hello@example.com" required className="bg-zinc-900/50 border-zinc-700/50 text-slate-100 h-12 placeholder:text-zinc-500 focus-visible:ring-zinc-500/50" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="text-zinc-500 dark:text-zinc-300">Пароль</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="bg-zinc-900/50 border-zinc-700/50 text-slate-100 h-12 placeholder:text-zinc-500 focus-visible:ring-zinc-500/50 pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-slate-100 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-4 pb-6 bg-transparent border-t-0">
          <button 
            form="auth-form" 
            formAction={async (formData) => {
              const res = await login(formData)
              if (res?.error) {
                const msg = res.error.includes('Invalid login credentials') ? 'Неверный логин или пароль' : 
                            res.error.includes('Email not confirmed') ? 'Email не подтвержден' : res.error
                toast.error(`Ошибка входа: ${msg}`)
              }
            }} 
            className="w-full bg-zinc-800 border border-zinc-700/50 text-slate-100 h-12 rounded-lg font-semibold hover:bg-zinc-700 transition-all shadow-md"
          >
            Войти
          </button>
          <button 
            form="auth-form" 
            formAction={async (formData) => {
              const res = await signup(formData)
              if (res?.error) {
                const msg = res.error.includes('User already registered') ? 'Пользователь уже зарегистрирован' : 
                            res.error.includes('Password should be at least') ? 'Пароль слишком короткий (минимум 6 символов)' : res.error
                toast.error(`Ошибка регистрации: ${msg}`)
              } else {
                toast.success('Успешная регистрация! Теперь вы можете войти.')
              }
            }} 
            className="w-full border border-zinc-700/50 bg-transparent text-slate-500 dark:text-slate-300 h-12 rounded-lg font-medium hover:bg-zinc-800/50 hover:text-white transition-all"
          >
            Зарегистрироваться
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}
