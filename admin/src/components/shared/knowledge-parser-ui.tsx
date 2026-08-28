'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Globe, Link as LinkIcon, FileSpreadsheet, Loader2, ListTree, FileText } from 'lucide-react'

export function KnowledgeParserUI({ projectId, onComplete, onProcessingChange }: { projectId: string, onComplete?: (text?: string) => void | Promise<void>, onProcessingChange?: (isProcessing: boolean) => void }) {
  const [url, setUrl] = useState('')
  const [exclusions, setExclusions] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  // Crawler State
  const [crawledLinks, setCrawledLinks] = useState<{ url: string; checked: boolean }[]>([])
  const [isCrawling, setIsCrawling] = useState(false)
  const [crawlProgress, setCrawlProgress] = useState({ current: 0, total: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parsedExclusions = exclusions.split(',').map(e => e.trim()).filter(Boolean)

  async function handleFetchLinks(mode: 'crawl' | 'sitemap') {
    if (!url.trim()) return
    setIsLoading(true)
    if (onProcessingChange) onProcessingChange(true)
    const toastId = toast.loading(mode === 'sitemap' ? 'Чтение Sitemap...' : 'Поиск ссылок на сайте...')

    try {
      const endpoint = mode === 'sitemap' ? '/api/scrape/sitemap' : '/api/crawl/links'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, exclusions: parsedExclusions })
      })
      
      const data = await res.json()
      if (res.ok) {
        setCrawledLinks(data.links.map((l: string) => ({ url: l, checked: true })))
        toast.success(`Найдено ${data.links.length} страниц (с учетом исключений)!`, { id: toastId })
      } else {
        toast.error(`Ошибка поиска: ${data.error}`, { id: toastId })
      }
    } catch (e) {
      toast.error('Ошибка сети', { id: toastId })
    } finally {
      setIsLoading(false)
      if (onProcessingChange) onProcessingChange(false)
    }
  }

  async function handleBatchScrape() {
    const selectedLinks = crawledLinks.filter(l => l.checked)
    if (selectedLinks.length === 0) return toast.error('Выберите хотя бы одну страницу')

    setIsCrawling(true)
    setCrawlProgress({ current: 0, total: selectedLinks.length })
    if (onProcessingChange) onProcessingChange(true)
    
    let combinedText = ''
    let successCount = 0

    for (let i = 0; i < selectedLinks.length; i++) {
      setCrawlProgress({ current: i + 1, total: selectedLinks.length })
      try {
        const res = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: selectedLinks[i].url, projectId })
        })
        const data = await res.json()
        if (res.ok && data.text) {
          combinedText += `\n\n` + data.text
          successCount++
        }
      } catch (e) {
        console.error(`Failed to scrape ${selectedLinks[i].url}`)
      }
    }

    if (successCount > 0) {
      if (onComplete) {
        // Pass the extracted text to the parent component
        await onComplete(combinedText)
      } else {
        const toastId = toast.loading('Сохранение текста в базу знаний...')
        try {
          const res = await fetch('/api/knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: combinedText, projectId })
          })
          
          if (res.ok) {
            toast.success(`Парсинг завершен! Данные с ${successCount} страниц добавлены в ИИ.`, { id: toastId })
            setCrawledLinks([])
            setUrl('')
          } else {
            toast.error('Ошибка сохранения данных', { id: toastId })
          }
        } catch (e) {
          toast.error('Ошибка сети при сохранении', { id: toastId })
        }
      }
    }
    
    setIsCrawling(false)
    if (onProcessingChange) onProcessingChange(false)
  }

  function toggleLink(index: number) {
    const newLinks = [...crawledLinks]
    newLinks[index].checked = !newLinks[index].checked
    setCrawledLinks(newLinks)
  }

  async function handleFeedUpload(file: File) {
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Файл слишком большой (максимум 15 МБ)')
      return
    }

    const toastId = toast.loading('Чтение Excel/CSV фида...')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', projectId)

    try {
      const res = await fetch('/api/parse-feed', {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success(`Фид загружен! Добавлено ${data.count} товаров в каталог.`, { id: toastId })
        if (onComplete) onComplete()
      } else {
        toast.error(`Ошибка при загрузке: ${data.error}`, { id: toastId })
      }
    } catch (e: any) {
      toast.error(`Ошибка сети: ${e.message}`, { id: toastId })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleFileUpload(file: File) {
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Файл слишком большой (максимум 15 МБ)')
      return
    }

    const toastId = toast.loading('Распознавание текста из файла...')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/parse-file', {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      
      if (res.ok && data.text) {
        toast.success(`Текст успешно извлечен!`, { id: toastId })
        if (onComplete) {
          await onComplete(data.text)
        } else {
          // Fallback if no onComplete (shouldn't happen with our setup)
          const saveRes = await fetch('/api/knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.text, projectId })
          })
          if (saveRes.ok) {
            toast.success(`Данные из файла сохранены в ИИ.`, { id: toastId })
          } else {
            toast.error('Ошибка сохранения данных', { id: toastId })
          }
        }
      } else {
        toast.error(`Ошибка при чтении: ${data.error}`, { id: toastId })
      }
    } catch (e: any) {
      toast.error(`Ошибка сети: ${e.message}`, { id: toastId })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="website" className="w-full">
        <TabsList className="w-full grid grid-cols-2 lg:grid-cols-4 mb-4 bg-zinc-900 border border-zinc-800 !h-auto p-1 gap-1">
          <TabsTrigger value="website" className="!h-auto py-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Сайт</TabsTrigger>
          <TabsTrigger value="sitemap" className="!h-auto py-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Sitemap</TabsTrigger>
          <TabsTrigger value="document" className="!h-auto py-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-wrap">Документ (Текст)</TabsTrigger>
          <TabsTrigger value="feed" className="!h-auto py-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-wrap">Товарный фид</TabsTrigger>
        </TabsList>
        
        <TabsContent value="website" className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-300 text-sm">Ссылка на сайт</Label>
            <div className="flex gap-2">
              <Input 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={isLoading || isCrawling}
                className="bg-zinc-950 border-zinc-800 text-slate-200 focus-visible:ring-primary/50"
              />
              <Button onClick={() => handleFetchLinks('crawl')} disabled={isLoading || isCrawling} className="bg-primary hover:bg-primary/90">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
                Искать страницы
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sitemap" className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-300 text-sm">Ссылка на sitemap.xml</Label>
            <div className="flex gap-2">
              <Input 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/sitemap.xml"
                disabled={isLoading || isCrawling}
                className="bg-zinc-950 border-zinc-800 text-slate-200 focus-visible:ring-primary/50"
              />
              <Button onClick={() => handleFetchLinks('sitemap')} disabled={isLoading || isCrawling} className="bg-primary hover:bg-primary/90">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListTree className="w-4 h-4 mr-2" />}
                Читать Sitemap
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="feed" className="space-y-4">
           <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if(f) handleFeedUpload(f) }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/50'
            }`}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.csv,.xls" onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFeedUpload(file)
            }} />
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-200">Перетащите Excel фид сюда</p>
                <p className="text-xs text-zinc-500">или нажмите для выбора файла (XLSX, CSV)</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="document" className="space-y-4">
           <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if(f) handleFileUpload(f) }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/50'
            }`}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.docx,.md,.sql" onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
            }} />
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
                <FileText className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-200">Перетащите документ сюда</p>
                <p className="text-xs text-zinc-500">или нажмите для выбора файла (PDF, TXT, DOCX)</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Общие настройки для парсеров (Сайт / Sitemap) */}
        {(url && crawledLinks.length === 0) && (
          <div className="space-y-2 mt-4">
            <Label className="text-zinc-400 text-xs uppercase font-semibold tracking-wider">Исключения (через запятую)</Label>
            <Input 
                value={exclusions}
                onChange={(e) => setExclusions(e.target.value)}
                placeholder="/catalog/, ?sort=, /blog/"
                className="bg-zinc-950 border-zinc-800 text-slate-300 text-sm focus-visible:ring-primary/50"
            />
            <p className="text-xs text-zinc-500">Ссылки, содержащие эти строки, не будут добавлены в базу.</p>
          </div>
        )}
      </Tabs>

      {/* Список найденных ссылок */}
      {crawledLinks.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-zinc-400" />
              Найдено страниц: {crawledLinks.length}
            </h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isCrawling || isLoading}
                onClick={() => setCrawledLinks(crawledLinks.map(l => ({ ...l, checked: false })))}
                className="text-xs h-8 border-zinc-800 text-zinc-400 hover:text-white bg-zinc-950"
              >
                Снять все
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isCrawling || isLoading}
                onClick={() => setCrawledLinks(crawledLinks.map(l => ({ ...l, checked: true })))}
                className="text-xs h-8 border-zinc-800 text-zinc-400 hover:text-white bg-zinc-950"
              >
                Выбрать все
              </Button>
            </div>
          </div>
          <div className="border border-zinc-800 rounded-lg max-h-[250px] overflow-y-auto bg-zinc-950 p-2 space-y-1 custom-scrollbar">
            {crawledLinks.map((link, i) => (
              <div key={i} className="flex items-center space-x-3 p-2 hover:bg-zinc-900/50 rounded-md transition-colors group">
                <Checkbox 
                  checked={link.checked} 
                  disabled={isCrawling || isLoading}
                  onCheckedChange={() => toggleLink(i)}
                  className="border-zinc-700 data-[state=checked]:bg-primary"
                />
                <label className={`text-sm text-zinc-400 truncate flex-1 transition-colors ${(isCrawling || isLoading) ? 'opacity-50 cursor-not-allowed' : 'group-hover:text-slate-300 cursor-pointer'}`} onClick={() => !(isCrawling || isLoading) && toggleLink(i)}>
                  {link.url}
                </label>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleBatchScrape} 
            disabled={isCrawling || crawledLinks.filter(l => l.checked).length === 0}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isCrawling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Обработка {crawlProgress.current} из {crawlProgress.total}...
              </>
            ) : (
              <>Обучить бота на {crawledLinks.filter(l => l.checked).length} страницах</>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
