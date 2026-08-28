'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createProject } from '@/app/actions/project'

import { toast } from 'sonner'

export function NewProjectButton({ isLimitReached, maxProjects }: { isLimitReached?: boolean, maxProjects?: number }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const project = await createProject(formData)
      setOpen(false)
      router.push(`/project/${project.id}/setup`)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Произошла ошибка')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLimitReached) {
    return (
      <span title={`Достигнут лимит проектов (${maxProjects}). Для создания нового проекта обратитесь к администратору.`}>
        <Button disabled className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground opacity-50 h-9 px-4 py-2 cursor-not-allowed">
          + Новый Проект
        </Button>
      </span>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
      >
        + Новый Проект
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-6 sm:p-8 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-2xl">
        <form onSubmit={onSubmit}>
          <DialogHeader className="space-y-3 text-left">
            <DialogTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Создать новый ИИ Виджет</DialogTitle>
            <DialogDescription className="text-base text-slate-500 dark:text-zinc-400">
              Придумайте название для вашего нового ИИ-ассистента.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-8">
            <div className="grid gap-3">
              <Label htmlFor="name" className="text-sm font-medium text-slate-900 dark:text-slate-700 dark:text-slate-200">
                Название проекта
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="напр. Мой классный магазин"
                required
                className="h-12 bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 focus-visible:ring-primary dark:focus-visible:ring-zinc-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 px-4"
              />
            </div>
          </div>
          <DialogFooter className="pt-4 bg-transparent border-none sm:justify-center">
            <Button type="submit" disabled={isLoading} className="w-full h-12 text-base font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors">
              {isLoading ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
