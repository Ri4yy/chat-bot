'use client'

import { useState, useEffect } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

function CodeBlock({ codeString, title }: { codeString: string, title: string }) {
  const [copied, setCopied] = useState(false)

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
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-700 dark:text-zinc-300">{title}</div>
      <div className="relative group">
        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-slate-300 p-4 rounded-md overflow-x-auto text-sm font-mono shadow-inner">
          <pre>{codeString}</pre>
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleCopy}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-700"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-slate-500 dark:text-zinc-400" />}
        </Button>
      </div>
    </div>
  )
}

export function InstallSnippet({ projectId }: { projectId: string }) {
  const [appUrl, setAppUrl] = useState('http://localhost:3000')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin)
    }
  }, [])

  const devCode = `<!-- Загрузка виджета (Development Mode) -->\n<script type="module" src="http://localhost:5173/@vite/client"></script>\n<script type="module" src="http://localhost:5173/src/main.tsx" data-project-id="${projectId}"></script>`
  
  const prodCode = `<!-- Загрузка виджета (Production) -->\n<script type="module" crossorigin src="${appUrl}/chat-widget.js" data-project-id="${projectId}"></script>`

  return (
    <div className="space-y-6 mt-4">
      <CodeBlock title="1. Для продакшена (Готовый билд на сайте)" codeString={prodCode} />
      <CodeBlock title="2. Для локальной разработки (Vite Dev Server)" codeString={devCode} />
    </div>
  )
}
