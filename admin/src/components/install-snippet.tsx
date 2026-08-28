'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function InstallSnippet({ projectId }: { projectId: string }) {
  const [copied, setCopied] = useState(false)

  const codeString = `<!-- Загрузка виджета (Development Mode) -->\n<script type="module" src="http://localhost:5173/@vite/client"></script>\n<script type="module" src="http://localhost:5173/src/main.tsx" data-project-id="${projectId}"></script>`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="relative group">
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-slate-500 dark:text-slate-300 p-4 rounded-md overflow-x-auto text-sm font-mono shadow-inner">
        <pre>{codeString}</pre>
      </div>
      <Button
        variant="secondary"
        size="icon"
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-500 dark:text-slate-700 dark:text-zinc-300"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  )
}
