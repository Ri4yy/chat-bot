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
      router.push(`/project/${project.id}`)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Произошла ошибка')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span 
        title={isLimitReached ? `Достигнут лимит проектов (${maxProjects}). Для создания нового проекта обратитесь к администратору.` : ''}
        className="inline-block"
      >
        <DialogTrigger 
          disabled={isLimitReached}
          onClick={(e) => { if (isLimitReached) e.preventDefault() }}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
        >
          + Новый Проект
        </DialogTrigger>
      </span>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Создать новый ИИ Виджет</DialogTitle>
            <DialogDescription>
              Придумайте название для вашего нового ИИ-ассистента.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название проекта</Label>
              <Input id="name" name="name" placeholder="напр. Мой классный магазин" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
