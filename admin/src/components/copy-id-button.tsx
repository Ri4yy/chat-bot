'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800" 
      onClick={handleCopy}
      title="Копировать ID"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </Button>
  )
}
