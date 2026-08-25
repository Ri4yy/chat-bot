'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner'
import { UploadCloud, Link as LinkIcon, FileText, CheckCircle2, Globe } from 'lucide-react'

export function KnowledgeBaseUpload({ projectId }: { projectId: string }) {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFormatting, setIsFormatting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Crawler State
  const [crawledLinks, setCrawledLinks] = useState<{ url: string; checked: boolean }[]>([])
  const [isCrawling, setIsCrawling] = useState(false)
  const [crawlProgress, setCrawlProgress] = useState({ current: 0, total: 0 })
  const [useLlm, setUseLlm] = useState(false)

  async function handleUpload() {
    if (!text.trim()) return
    setIsLoading(true)
    const toastId = toast.loading('Обработка текста и генерация векторов...')
    
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, projectId })
      })
      
      const data = await res.json()
      if (res.ok) {
        toast.success(`Успешно! Обработано ${data.chunksProcessed} фрагментов текста.`, { id: toastId })
        setText('')
      } else {
        toast.error(`Ошибка: ${data.error}`, { id: toastId })
      }
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message}`, { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleFormatText() {
    if (!text.trim()) return
    setIsFormatting(true)
    const toastId = toast.loading('ИИ анализирует и форматирует текст...')

    try {
      const res = await fetch('/api/format-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, projectId })
      })
      
      const data = await res.json()
      if (res.ok) {
        setText(data.formattedText)
        toast.success(`Текст отформатирован! Списано токенов: ${data.tokensUsed}`, { id: toastId })
      } else {
        toast.error(`Ошибка: ${data.error}`, { id: toastId })
      }
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message}`, { id: toastId })
    } finally {
      setIsFormatting(false)
    }
  }

  async function handleFetchLinks() {
    if (!url.trim()) return
    setIsLoading(true)
    const toastId = toast.loading('Поиск ссылок на сайте...')

    try {
      const res = await fetch('/api/crawl/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      
      const data = await res.json()
      if (res.ok) {
        setCrawledLinks(data.links.map((l: string) => ({ url: l, checked: true })))
        toast.success(`Найдено ${data.links.length} внутренних страниц!`, { id: toastId })
      } else {
        toast.error(`Ошибка поиска: ${data.error}`, { id: toastId })
      }
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message}`, { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleBatchScrape() {
    const selectedLinks = crawledLinks.filter(l => l.checked)
    if (selectedLinks.length === 0) return

    setIsCrawling(true)
    setCrawlProgress({ current: 0, total: selectedLinks.length })
    
    let combinedText = ''
    let successCount = 0

    for (let i = 0; i < selectedLinks.length; i++) {
      setCrawlProgress({ current: i + 1, total: selectedLinks.length })
      try {
        const res = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: selectedLinks[i].url, useLlm })
        })
        const data = await res.json()
        if (res.ok && data.text) {
          combinedText += `\n\n--- Source: ${selectedLinks[i].url} ---\n\n` + data.text
          successCount++
        }
      } catch (e) {
        console.error(`Failed to scrape ${selectedLinks[i].url}`)
      }
    }

    setText((prev) => prev + combinedText)
    toast.success(`Парсинг завершен! Извлечен текст с ${successCount} из ${selectedLinks.length} страниц.`)
    setIsCrawling(false)
    setCrawledLinks([])
    setUrl('')
  }

  function toggleLink(index: number) {
    const newLinks = [...crawledLinks]
    newLinks[index].checked = !newLinks[index].checked
    setCrawledLinks(newLinks)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Файл слишком большой (максимум 15 МБ)')
      return
    }

    const toastId = toast.loading('Чтение и извлечение текста из файла...')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/parse-file', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      
      if (res.ok) {
        setText((prev) => (prev ? prev + '\n\n' + data.text : data.text))
        toast.success(`Файл ${file.name} успешно прочитан!`, { id: toastId })
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
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-slate-100">Источники данных (Knowledge Base)</CardTitle>
        <CardDescription className="text-zinc-400">
          Загрузите данные, которые ИИ должен знать для ответов на вопросы.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800/50">
            <TabsTrigger value="text" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white"><FileText className="w-4 h-4 mr-2" />Текст</TabsTrigger>
            <TabsTrigger value="url" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white"><Globe className="w-4 h-4 mr-2" />Парсинг сайта</TabsTrigger>
            <TabsTrigger value="file" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white"><UploadCloud className="w-4 h-4 mr-2" />Файл</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="pt-4 space-y-4">
            <p className="text-sm text-zinc-400">Вставьте готовый текст напрямую в редактор ниже.</p>
          </TabsContent>

          <TabsContent value="url" className="pt-4 space-y-4">
            {!crawledLinks.length ? (
              <>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://example.com" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-slate-100"
                  />
                  <Button onClick={handleFetchLinks} disabled={isLoading || !url.trim()} variant="secondary" className="whitespace-nowrap">
                    Найти страницы
                  </Button>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-3 rounded-md text-sm">
                  <strong>Совет:</strong> Парсер очищает страницы от шапок и меню, оставляя только суть. Однако, если у вас каталог на <strong>сотни товаров</strong>, для идеальной точности ИИ мы настоятельно рекомендуем использовать вкладку <strong>«Файл»</strong> и загружать прайс-листы в форматах <strong>.xlsx, .csv или .sql</strong>.
                </div>
              </>
            ) : (
              <div className="space-y-4 border border-zinc-700 rounded-md p-4 bg-zinc-800/30">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-slate-200">Найденные страницы ({crawledLinks.length})</h4>
                  <Button variant="ghost" size="sm" onClick={() => setCrawledLinks([])} disabled={isCrawling} className="text-zinc-400 hover:text-white">Отмена</Button>
                </div>

                <div className="flex items-center space-x-2 bg-zinc-950/50 p-3 rounded-md border border-zinc-800">
                  <input 
                    type="checkbox" 
                    id="use-llm"
                    checked={useLlm}
                    onChange={(e) => setUseLlm(e.target.checked)}
                    disabled={isCrawling}
                    className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-primary focus:ring-primary focus:ring-offset-zinc-900"
                  />
                  <label htmlFor="use-llm" className="text-sm font-medium text-slate-200 cursor-pointer">
                    ✨ Использовать ИИ-структурирование (расходует токены аккаунта)
                  </label>
                </div>
                
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                  {crawledLinks.map((link, idx) => (
                    <label key={idx} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-zinc-800/50 rounded-md transition-colors">
                      <input 
                        type="checkbox" 
                        checked={link.checked} 
                        onChange={() => toggleLink(idx)}
                        disabled={isCrawling}
                        className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-primary focus:ring-primary focus:ring-offset-zinc-900"
                      />
                      <span className="text-sm text-zinc-300 truncate">{link.url}</span>
                    </label>
                  ))}
                </div>

                {isCrawling ? (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Сбор контента...</span>
                      <span>{crawlProgress.current} из {crawlProgress.total}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(crawlProgress.current / crawlProgress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <Button onClick={handleBatchScrape} className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Начать глубокий парсинг ({crawledLinks.filter(l => l.checked).length})
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="file" className="pt-4 space-y-4">
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer bg-zinc-800/20 hover:bg-zinc-800/50 hover:border-zinc-500 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-3 text-zinc-400" />
                  <p className="mb-2 text-sm text-zinc-300"><span className="font-semibold">Нажмите для загрузки</span> или перетащите файл</p>
                  <p className="text-xs text-zinc-500">.PDF, .XLSX, .SQL, .TXT, .CSV, .MD (до 15 МБ)</p>
                </div>
                <input ref={fileInputRef} id="dropzone-file" type="file" className="hidden" accept=".pdf,.xlsx,.xls,.sql,.txt,.csv,.md" onChange={handleFileUpload} />
              </label>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2 mt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-2">
            <Label htmlFor="kb-text" className="text-zinc-300">Содержимое для векторизации</Label>
            <div className="flex flex-wrap items-center gap-2 mt-1 lg:mt-0">
              <span className="text-xs text-amber-500/80">Внимание: расходует AI-токены</span>
              <Button 
                onClick={handleFormatText} 
                disabled={isFormatting || !text.trim()} 
                variant="outline" 
                size="sm"
                className="h-8 bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700"
              >
                {isFormatting ? 'Форматирование...' : '✨ Отформатировать через ИИ'}
              </Button>
            </div>
          </div>
          <textarea 
            id="kb-text"
            className="flex min-h-[300px] w-full rounded-md border bg-zinc-800/50 border-zinc-700 text-slate-100 px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
            placeholder="Сюда попадет извлеченный текст с сайтов или файлов. Вы также можете писать здесь вручную..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <Button onClick={handleUpload} disabled={isLoading || isCrawling || !text.trim()} className="w-full bg-zinc-800 text-slate-100 hover:bg-zinc-700 transition-colors h-12 text-md font-medium mt-4 border border-zinc-700">
          {isLoading && !isCrawling ? 'Сохранение в БД...' : 'Добавить в базу знаний'}
        </Button>
      </CardContent>
    </Card>
  )
}
