'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteProject } from '@/app/actions/project'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteProject(projectId)
      toast.success('Проект успешно удален')
      setIsOpen(false)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Ошибка при удалении')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10 z-20 relative"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">Вы уверены?</DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-zinc-400">
            Это действие нельзя отменить. Проект и все его данные (база знаний, настройки) будут безвозвратно удалены.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" className="text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white" onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}>Отмена</Button>
          <Button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete() }} 
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Удалить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}

