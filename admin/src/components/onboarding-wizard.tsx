'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Globe, FileText, Bot, Code, CheckCircle2, ChevronRight, ChevronLeft, ChevronDown, Send, Copy, Sparkles } from 'lucide-react'
import { updateProjectSettings } from '@/app/actions/project'
import { KnowledgeParserUI } from '@/components/shared/knowledge-parser-ui'

const TONES = [
  { value: 'Дружелюбный', label: 'Дружелюбный (мягкий и позитивный)' },
  { value: 'Нейтральный', label: 'Нейтральный (стандартный)' },
  { value: 'Фактический', label: 'Фактический (только факты, без эмоций)' },
  { value: 'Профессиональный', label: 'Профессиональный (деловой и строгий)' },
  { value: 'Юмористический', label: 'Юмористический (с долей шуток)' }
]

const RULES = [
  { id: 'Не гарантировать результат: Не обещай, что клиент точно добьётся цели. Формулируй аккуратно.', label: 'Не гарантировать результат' },
  { id: 'Использовать эмодзи: Ставь эмодзи в каждом сообщении для позитивного настроя.', label: 'Использовать эмодзи' },
  { id: 'Отвечать кратко: Давай максимально лаконичные ответы, без лишней воды.', label: 'Отвечать кратко' },
  { id: 'Строго на "Вы": Всегда обращайся к клиенту на "Вы" с большой буквы.', label: 'Строго на "Вы"' },
  { id: 'Фокус на продажах: Старайся мягко переводить диалог на покупку или целевое действие.', label: 'Фокус на продажах' }
]

export function OnboardingWizard({ project }: { project: any }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isScraping, setIsScraping] = useState(false)

  // Step 1 State
  const [scrapeUrl, setScrapeUrl] = useState('')
  const [manualText, setManualText] = useState('')
  const [isManual, setIsManual] = useState(false)
  const [isKnowledgeSaved, setIsKnowledgeSaved] = useState(false)
  // Step 2 State
  const [tone, setTone] = useState(project.tone || 'Нейтральный')
  const [rules, setRules] = useState<string[]>(project.rules || [])
  const [systemPrompt, setSystemPrompt] = useState(project.system_prompt || '')
  
  // Step 4 State additions
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState(project.privacy_policy_url || '')

  // Step 3 State
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)

  // Step 4 State
  const [themeColor, setThemeColor] = useState(project.theme_color || '#3b82f6')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Инициализация чата приветственным сообщением
  useEffect(() => {
    if (step === 3 && messages.length === 0) {
      setMessages([
        { 
          role: 'assistant', 
          content: 'Здравствуйте! 👋 Я готов ответить на ваши вопросы. Что бы вы хотели узнать?' 
        }
      ])
    }
  }, [step, messages.length])

  // ----- Step 1 Handlers -----
  async function handleScrape() {
    if (!scrapeUrl) return toast.error('Введите ссылку')
    setIsLoading(true)
    const toastId = toast.loading('Поиск внутренних страниц...')
    
    try {
      // 1. Получаем ссылки
      const linksRes = await fetch('/api/crawl/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl })
      })
      
      let urlsToScrape = [scrapeUrl]
      if (linksRes.ok) {
        const linksData = await linksRes.json()
        if (linksData.links && linksData.links.length > 0) {
          // Ограничим до 50 страниц для максимального охвата сайта
          urlsToScrape = linksData.links.slice(0, 50)
        }
      }

      let combinedText = ''
      let successCount = 0

      // 2. Парсим каждую ссылку
      for (let i = 0; i < urlsToScrape.length; i++) {
        toast.loading(`Глубокий парсинг: ${i + 1} из ${urlsToScrape.length}...`, { id: toastId })
        try {
          const res = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlsToScrape[i], projectId: project.id })
          })
          const data = await res.json()
          if (res.ok && data.text) {
            combinedText += `\n\n` + data.text
            successCount++
          }
        } catch (e) {
          console.error(`Failed to scrape ${urlsToScrape[i]}`)
        }
      }

      if (successCount === 0) {
        toast.error('Не удалось спарсить ни одной страницы', { id: toastId })
        setIsLoading(false)
        return
      }

      toast.loading(`Успешно спарсено ${successCount} стр. Сохраняем в базу...`, { id: toastId })
      await saveKnowledge(combinedText, toastId)
      
    } catch (e: any) {
      toast.error('Ошибка сети при парсинге', { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleManualSave() {
    if (!manualText) return toast.error('Введите текст')
    setIsLoading(true)
    const toastId = toast.loading('Сохранение в базу знаний...')
    try {
      await saveKnowledge(manualText, toastId)
    } catch (e: any) {
      toast.error('Ошибка', { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  async function saveKnowledge(text: string, toastId: string | number) {
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, projectId: project.id })
    })
    
    if (res.ok) {
      const data = await res.json()
      toast.success('База знаний успешно заполнена!', { id: toastId })
      setIsKnowledgeSaved(true)
      
      if (data.generatedPrompt) {
        setSystemPrompt(data.generatedPrompt)
      }
      
      setTimeout(() => setStep(2), 1000)
    } else {
      toast.error('Ошибка сохранения', { id: toastId })
    }
  }

  // ----- Step 2 Handlers -----
  async function handleSaveSettings() {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('tone', tone)
      formData.append('system_prompt', systemPrompt)
      rules.forEach(r => formData.append('rules', r))
      
      await updateProjectSettings(project.id, formData)
      toast.success('Настройки ИИ сохранены')
      setStep(3)
    } catch (e) {
      toast.error('Ошибка сохранения')
    } finally {
      setIsLoading(false)
    }
  }

  // ----- Step 3 Handlers -----
  async function handleTestMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim()) return
    
    const newMsg = { role: 'user', content: chatInput }
    setMessages(prev => [...prev, newMsg])
    setChatInput('')
    setIsChatLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, newMsg],
          projectId: project.id,
          isTest: true
        })
      })

      if (!res.ok) throw new Error('Ошибка')
      
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMsg = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        assistantMsg += text
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1].content = assistantMsg
          return newMessages
        })
      }
    } catch (e) {
      toast.error('Ошибка при тестировании')
    } finally {
      setIsChatLoading(false)
    }
  }

  // ----- Step 4 Handlers -----
  async function handleFinish() {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('theme_color', themeColor)
      formData.append('tone', tone)
      formData.append('system_prompt', systemPrompt)
      formData.append('privacy_policy_url', privacyPolicyUrl)
      rules.forEach(r => formData.append('rules', r))
      
      await updateProjectSettings(project.id, formData)
      toast.success('Настройка завершена! Добро пожаловать.')
      router.push(`/project/${project.id}`)
    } catch (e) {
      toast.error('Ошибка сохранения')
      setIsLoading(false)
    }
  }

  const snippet = `<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://example.com'}/widget.js" data-project="${project.id}" defer></script>`

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Степы (Навигация) */}
      <div className={`flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4 overflow-x-auto whitespace-nowrap scrollbar-none transition-opacity ${(isLoading || isScraping) ? 'pointer-events-none opacity-50' : ''}`}>
        {[
          { num: 1, label: 'Описание компании' },
          { num: 2, label: 'Настройка модели' },
          { num: 3, label: 'Тестирование' },
          { num: 4, label: 'Интеграция' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-3 shrink-0">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              step === s.num ? 'bg-slate-900 dark:bg-slate-200 text-white dark:text-zinc-900' : step > s.num ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 shadow-sm dark:shadow-none'
            }`}>
              {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
            </div>
            <span className={`text-sm font-medium ${step === s.num ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-zinc-500'}`}>
              {s.label}
            </span>
            {s.num < 4 && <ChevronRight className="w-4 h-4 text-zinc-700 ml-1" />}
          </div>
        ))}
      </div>

      {/* ШАГ 1 */}
      {step === 1 && (
        <Card className="bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 mt-4 animate-in fade-in slide-in-from-bottom-4">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Вставьте ссылку на свой сайт</h2>
              <p className="text-slate-500 dark:text-zinc-400 text-sm">Укажите ссылку, чтобы бот начал обучение ИИ для вашей компании.</p>
            </div>

            {!isManual ? (
              <div className="space-y-4 bg-slate-100 dark:bg-zinc-800/30 p-6 rounded-lg border border-slate-200 dark:border-zinc-800/50">
                <KnowledgeParserUI 
                  projectId={project.id}
                  onProcessingChange={setIsScraping}
                  onComplete={async (text) => {
                    if (text) {
                      const toastId = toast.loading('Сохранение в базу знаний...')
                      await saveKnowledge(text, toastId)
                    } else {
                      // If the component already handled saving, just advance step
                      toast.success('База знаний успешно заполнена!')
                      setIsKnowledgeSaved(true)
                      setTimeout(() => setStep(2), 1000)
                    }
                  }}
                />
                <div className="pt-2 text-center">
                  <Button variant="ghost" onClick={() => setIsManual(true)} className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white" disabled={isLoading || isScraping}>
                    У меня нет сайта (Ввести текст)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 bg-slate-100 dark:bg-zinc-800/30 p-6 rounded-lg border border-slate-200 dark:border-zinc-800/50">
                <div className="space-y-2">
                  <Label className="text-zinc-500 dark:text-zinc-300">Расскажите боту о своей компании</Label>
                  <div className="relative">
                    <Textarea 
                      placeholder="Наша компания называется Профиль, мы продаем онлайн-курсы..." 
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      className="bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100 min-h-[150px] text-base focus-visible:ring-primary/50 pr-12 pb-12"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!manualText.trim()) return;
                        setIsLoading(true);
                        const toastId = toast.loading('Форматируем текст с помощью ИИ...');
                        try {
                          const res = await fetch('/api/format-text', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: manualText, projectId: project.id })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Ошибка форматирования');
                          if (data.formattedText) {
                            setManualText(data.formattedText);
                            toast.success('Текст успешно улучшен!', { id: toastId });
                          } else {
                            throw new Error('Пустой ответ от ИИ');
                          }
                        } catch (e: any) {
                          toast.error(e.message, { id: toastId });
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading || !manualText}
                      className="absolute bottom-3 right-3 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 flex items-center gap-1.5 px-3 py-1.5 h-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span className="text-xs font-medium">Улучшить ИИ</span>
                    </Button>
                  </div>
                  <Button 
                    onClick={handleManualSave} 
                    disabled={isLoading || !manualText} 
                    className="w-full h-12 text-base mt-2"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                    Сохранить знания
                  </Button>
                </div>
                <div className="pt-2 text-center">
                  <Button variant="ghost" onClick={() => setIsManual(false)} className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">
                    Использовать ссылку на сайт
                  </Button>
                </div>
              </div>
            )}


          </CardContent>
        </Card>
      )}

      {/* ШАГ 2 */}
      {step === 2 && (
        <Card className="bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 mt-4 animate-in fade-in slide-in-from-bottom-4">
          <CardContent className="pt-6 space-y-8">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Выберите модель ИИ</h2>
              <p className="text-slate-500 dark:text-zinc-400 text-sm">Настройте стиль общения и правила, которым должен следовать бот.</p>
            </div>

            <div className="space-y-4">
              <Label className="text-base text-zinc-500 dark:text-zinc-300">Выберите стиль (Тон общения)</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-full bg-slate-100 dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100 h-auto min-h-[3rem] py-2 text-base">
                  <div className="text-left whitespace-normal break-words leading-tight pr-2">
                    <SelectValue placeholder="Выберите стиль" />
                  </div>
                </SelectTrigger>
                <SelectContent side="bottom" className="bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100 z-[100] shadow-2xl w-[var(--radix-select-trigger-width)] max-h-[300px]">
                  {TONES.map(t => (
                    <SelectItem key={t.value} value={t.value} className="focus:bg-slate-100 dark:focus:bg-zinc-800 focus:text-slate-900 dark:focus:text-white cursor-pointer py-3 whitespace-normal break-words">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-base text-zinc-500 dark:text-zinc-300">Правила общения</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {RULES.map(rule => (
                  <div key={rule.id} className="flex items-center space-x-3 p-3 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800/30 hover:bg-slate-100 dark:bg-zinc-800/50 transition-colors">
                    <Checkbox 
                      id={rule.id} 
                      checked={rules.includes(rule.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setRules([...rules, rule.id])
                        else setRules(rules.filter(r => r !== rule.id))
                      }}
                      className="border-zinc-600 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <Label htmlFor={rule.id} className="text-sm cursor-pointer flex-1 text-slate-500 dark:text-slate-300 font-normal">{rule.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base text-zinc-500 dark:text-zinc-300">Сценарий продаж (Автосгенерирован ИИ)</Label>
              <Textarea 
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Если пусто, ИИ сам напишет сценарий на основе загруженных ссылок..."
                className="bg-white dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700 min-h-[120px] max-h-[450px] text-slate-900 dark:text-slate-100 focus-visible:ring-primary/50 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent"
              />
              <p className="text-xs text-slate-500 dark:text-zinc-500">
                {isKnowledgeSaved ? 'Этот сценарий был написан автоматически! Вы можете изменить его, если нужно.' : 'Вы можете добавить сюда уникальные УТП.'}
              </p>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-zinc-800">
              <Button onClick={() => setStep(1)} variant="ghost" className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-zinc-800/50">
                <ChevronLeft className="w-4 h-4 mr-2" /> Назад
              </Button>
              <Button onClick={handleSaveSettings} disabled={isLoading} className="px-8 bg-blue-600 hover:bg-blue-700 text-white">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Перейти к тестированию
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ШАГ 3 */}
      {step === 3 && (
        <Card className="bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 mt-4 animate-in fade-in slide-in-from-bottom-4">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Тестирование ИИ</h2>
              <p className="text-slate-500 dark:text-zinc-400 text-sm">Задайте боту вопросы, чтобы проверить, как он выучил базу знаний.</p>
            </div>

            <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950 flex flex-col h-[400px]">
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full text-slate-500 dark:text-zinc-500 flex-col gap-2">
                    <Bot className="w-12 h-12 text-zinc-800" />
                    <p>Напишите сообщение, чтобы начать диалог</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className={`px-4 py-2 max-w-[80%] rounded-2xl text-sm ${
                      m.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-slate-700 dark:text-slate-200 rounded-bl-none'
                    }`}>
                      {m.content ? (
                        m.role === 'assistant' && m.content.includes('[') && m.content.includes(']') ? (
                          <div className="flex flex-col gap-2">
                            <span className="whitespace-pre-wrap">{m.content.substring(0, m.content.indexOf('['))}</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {m.content.substring(m.content.indexOf('[') + 1, m.content.indexOf(']')).split('|').map((opt, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={() => setChatInput(opt.trim())}
                                  className="text-xs bg-slate-200 dark:bg-zinc-700/50 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-900 dark:text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full border border-slate-300 dark:border-zinc-600 transition-colors text-left"
                                >
                                  {opt.trim()}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="whitespace-pre-wrap">{m.content}</span>
                        )
                      ) : (
                        m.role === 'assistant' && isChatLoading && i === messages.length - 1 ? (
                          <div className="flex space-x-1 h-5 items-center px-1">
                            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                          </div>
                        ) : ''
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleTestMessage} className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex gap-2">
                <Input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Введите сообщение..."
                  className="bg-white dark:bg-zinc-950 border-slate-300 dark:border-zinc-800 text-slate-900 dark:text-slate-100 focus-visible:ring-primary/50"
                  disabled={isChatLoading}
                />
                <Button type="submit" disabled={isChatLoading || !chatInput.trim()} size="icon" className="bg-blue-600 hover:bg-blue-700">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-zinc-800">
              <Button onClick={() => setStep(2)} variant="ghost" className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-zinc-800/50">
                <ChevronLeft className="w-4 h-4 mr-2" /> Назад
              </Button>
              <Button onClick={() => setStep(4)} className="px-8 bg-blue-600 hover:bg-blue-700 text-white">
                Перейти к интеграции
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ШАГ 4 */}
      {step === 4 && (
        <Card className="bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 mt-4 animate-in fade-in slide-in-from-bottom-4">
          <CardContent className="pt-6 space-y-8">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Установите бота на сайт</h2>
              <p className="text-slate-500 dark:text-zinc-400 text-sm">Скопируйте код виджета и вставьте его на свой сайт.</p>
            </div>

            <div className="space-y-4 bg-slate-100 dark:bg-zinc-800/30 p-6 rounded-lg border border-slate-200 dark:border-zinc-800/50">
              <Label className="text-base text-zinc-500 dark:text-zinc-300">Готовый код для сайта</Label>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mb-2">Скопируйте этот код и вставьте его перед закрывающим тегом <code>&lt;/body&gt;</code>.</p>
              
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-500/10 rounded-md blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <pre className="relative bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 p-4 rounded-md overflow-x-auto text-sm font-mono text-slate-700 dark:text-zinc-300 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                  {snippet}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700 shadow-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(snippet)
                    toast.success('Код скопирован в буфер обмена')
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" /> Скопировать
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div 
                className="flex justify-between items-center p-4 border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/50 cursor-pointer hover:bg-slate-100 dark:bg-zinc-800/50 transition-colors"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span className="text-slate-900 dark:text-slate-100 font-medium text-sm">Дополнительные настройки</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-zinc-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </div>

              {showAdvanced && (
                <div className="space-y-4 p-4 border border-slate-200 dark:border-zinc-800 rounded-lg bg-slate-50 dark:bg-zinc-900/30 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label className="text-base text-zinc-500 dark:text-zinc-300">Цвет виджета</Label>
                    <p className="text-xs text-slate-500 dark:text-zinc-500">Настройте свой брендовый цвет для ответов, чтобы виджет лучше вписывался в дизайн вашего сайта.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      value={themeColor} 
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-12 h-12 p-0 border border-zinc-700 rounded-full cursor-pointer shrink-0 overflow-hidden bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:border-none" 
                    />
                    <Input 
                      value={themeColor} 
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="bg-white dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100 w-32" 
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-2 mt-4">
                    <Label className="text-base text-zinc-500 dark:text-zinc-300">Выберите иконку для виджета</Label>
                    <p className="text-xs text-slate-500 dark:text-zinc-500">Оставьте стандартную иконку Соло или загрузите свой логотип.</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="w-12 h-12 rounded-lg border-2 border-primary bg-primary/10 flex items-center justify-center cursor-pointer">
                        <Bot className="w-6 h-6 text-primary" />
                      </div>
                      <div className="w-12 h-12 rounded-lg border-2 border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-300 hover:border-slate-400 dark:hover:border-zinc-700 cursor-pointer transition-colors">
                        <span className="text-xl">+</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-2 mt-4">
                    <Label className="text-base text-zinc-500 dark:text-zinc-300">Согласие на обработку персональных данных (152-ФЗ)</Label>
                    <p className="text-xs text-slate-500 dark:text-zinc-500">Вставьте ссылку на Политику обработки персональных данных. Она будет отображаться в виджете.</p>
                    <Input 
                      value={privacyPolicyUrl} 
                      onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                      placeholder="https://"
                      onFocus={(e) => {
                        if (!e.target.value) {
                          setPrivacyPolicyUrl('https://')
                        }
                      }}
                      className="bg-white dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100 mt-2" 
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-8 border-t border-slate-200 dark:border-zinc-800">
              <Button onClick={() => setStep(3)} variant="ghost" className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-zinc-800/50">
                <ChevronLeft className="w-4 h-4 mr-2" /> Назад
              </Button>
              <Button onClick={handleFinish} disabled={isLoading} size="lg" className="px-8 text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-0">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Запустить бота! 🚀
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
