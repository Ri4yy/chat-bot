'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Rocket, Database, Brain, Plug, ArrowLeft, Bot, LayoutTemplate, FolderPlus, Settings, Key, ArrowRight, FileText, Globe, FileUp, MessageSquare, Users, BarChart, Coins, MessageCircleQuestion, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const TABS = [
  { id: 'intro', label: 'Введение', icon: BookOpen },
  { id: 'start', label: 'Быстрый старт', icon: Rocket },
  { id: 'knowledge', label: 'База знаний', icon: Database },
  { id: 'memory', label: 'Настройки и Память', icon: Brain },
  { id: 'history', label: 'История и Лиды', icon: MessageSquare },
  { id: 'analytics', label: 'Аналитика', icon: BarChart },
  { id: 'team', label: 'Команда', icon: Users },
  { id: 'tokens', label: 'Токены (AI Генерация)', icon: Coins },
  { id: 'integrations', label: 'Интеграции', icon: Plug },
  { id: 'widget', label: 'Установка', icon: LayoutTemplate },
]

export default function DocsClient() {
  const [activeTab, setActiveTab] = useState('intro')

  return (
    <main className="container mx-auto px-4 py-8 flex-1 relative z-10 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <Card className="bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none border-slate-200 dark:border-zinc-800 sticky top-8">
            <CardContent className="p-4 flex flex-col gap-2">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all relative overflow-hidden ${
                      isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-zinc-800/50'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-doc-tab"
                        className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon size={18} className="relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'intro' && <IntroSection />}
              {activeTab === 'start' && <StartSection />}
              {activeTab === 'knowledge' && <KnowledgeSection />}
              {activeTab === 'memory' && <MemorySection />}
              {activeTab === 'history' && <HistorySection />}
              {activeTab === 'analytics' && <AnalyticsSection />}
              {activeTab === 'team' && <TeamSection />}
              {activeTab === 'tokens' && <TokensSection />}
              {activeTab === 'integrations' && <IntegrationsSection />}
              {activeTab === 'widget' && <WidgetSection />}
            </motion.div>
          </AnimatePresence>
        </section>

      </main>
  )
}

function IntroSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Добро пожаловать в Nexus AI</h2>
      <p className="text-slate-500 dark:text-zinc-400 text-lg">
        Nexus AI — это мощная SaaS-платформа для создания интеллектуальных ИИ-ассистентов для вашего бизнеса.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
        <motion.div whileHover={{ scale: 1.02 }} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
            <Bot size={20} />
          </div>
          <h3 className="text-lg font-bold mb-2">Умные ответы</h3>
          <p className="text-slate-500 dark:text-zinc-500 text-sm leading-relaxed">ИИ не просто ищет по ключевым словам, он понимает контекст и генерирует уникальные, естественные ответы на основе ваших данных.</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
            <Database size={20} />
          </div>
          <h3 className="text-lg font-bold mb-2">Своя База Знаний</h3>
          <p className="text-slate-500 dark:text-zinc-500 text-sm leading-relaxed">Загрузите тексты о ваших товарах, меню ресторана или FAQ. Бот будет продавать, консультировать и отвечать строго по регламенту.</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
            <Coins size={20} />
          </div>
          <h3 className="text-lg font-bold mb-2">Оплата токенами</h3>
          <p className="text-slate-500 dark:text-zinc-500 text-sm leading-relaxed">Система работает на базе передовых нейросетей через RouterAI API. Вы платите напрямую провайдеру только за использованные токены ИИ.</p>
        </motion.div>
      </div>
    </div>
  )
}

function StartSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">С чего начать?</h2>
        <p className="text-slate-500 dark:text-zinc-400 text-lg">Создать и запустить своего первого умного ИИ-бота можно буквально за 3 минуты.</p>
      </div>
      
      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-6 before:-translate-x-px lg:before:mx-auto lg:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-300 before:via-slate-200 before:to-slate-300 dark:before:from-zinc-800 dark:before:via-zinc-700 dark:before:to-zinc-900">
        {[
          { 
            step: 1, 
            icon: FolderPlus, 
            title: 'Создайте проект', 
            desc: 'В панели управления нажмите кнопку "Новый проект". Придумайте название вашему будущему виджету (например, "Чат на главном сайте").',
            color: 'bg-indigo-500' 
          },
          { 
            step: 2, 
            icon: Settings, 
            title: 'Настройте характер', 
            desc: 'Перейдите в настройки созданного проекта. Выберите тон общения (дружелюбный, строгий) и укажите строгие правила. Например: "Никогда не обещай 100% результат" или "Всегда здоровайся".',
            color: 'bg-emerald-500'
          },
          { 
            step: 3, 
            icon: Key, 
            title: 'Подключите мозг (API Ключ)', 
            desc: 'Во вкладке "Интеграции" вставьте ваш личный токен от сервиса RouterAI. Именно он дает боту доступ к передовым нейросетям.',
            color: 'bg-amber-500'
          }
        ].map((s) => {
          const Icon = s.icon
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: s.step * 0.15 }}
              key={s.step} 
              className="relative flex items-center justify-between lg:justify-normal lg:even:flex-row-reverse group is-active"
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-slate-50 dark:border-zinc-950 ${s.color} text-slate-900 dark:text-white shrink-0 lg:order-1 lg:group-even:-translate-x-1/2 lg:group-odd:translate-x-1/2 shadow-lg relative z-10`}>
                <Icon size={20} />
              </div>
              
              <div className="w-[calc(100%-4rem)] lg:w-[calc(50%-3rem)] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:border-slate-300 dark:border-zinc-700 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-slate-500 dark:text-zinc-500 font-mono text-sm font-bold">Шаг {s.step}</span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{s.title}</h4>
                </div>
                <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="pt-6 flex justify-center">
        <Link href="/">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black hover:bg-slate-200 font-medium rounded-md shadow transition-colors"
          >
            Создать проект сейчас <ArrowRight size={18} />
          </motion.button>
        </Link>
      </div>
    </div>
  )
}

function KnowledgeSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Работа с Базой Знаний</h2>
        <p className="text-slate-500 dark:text-zinc-400 text-lg">Это мозг вашего бота. Чем качественнее материалы вы загрузите, тем точнее и умнее будут его ответы.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:border-blue-500/50 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-slate-900 dark:text-white transition-colors">
            <FileText size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Ввод текста</h3>
          <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">Вставьте текст описания компании, расписание работы или условия доставки. Платформа автоматически разобьет его на смысловые куски (чанки) и превратит в нейронные связи (векторы).</p>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:border-emerald-500/50 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-slate-900 dark:text-white transition-colors">
            <Globe size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Парсинг сайтов</h3>
          <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">Укажите ссылку на страницу вашего сайта. Умный парсер сам зайдет на нее, очистит от лишнего HTML-кода, рекламы и меню, оставив только полезную выжимку для обучения.</p>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:border-purple-500/50 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-slate-900 dark:text-white transition-colors">
            <FileUp size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Файлы и PDF</h3>
          <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">Загружайте готовые документы: прайс-листы, меню, внутренние регламенты или мануалы. Система извлечет весь текст из файлов и мгновенно обучит на нем бота.</p>
        </motion.div>
      </div>
    </div>
  )
}

function MemorySection() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Настройки и Память ИИ</h2>
      
      <div className="bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4 text-blue-600 dark:text-blue-200 text-sm">
        <p><strong>Важно:</strong> Память — это то, что бот запоминает в процессе диалога с конкретным пользователем. База знаний — это глобальные знания бота для всех.</p>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Стартовые вопросы</h3>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mb-4">
            Это кнопки-подсказки, которые появляются у клиента при открытии чата. Они помогают начать диалог.
            Вы можете настроить до 4 таких вопросов в разделе "Настройки". Например: "Сколько стоит доставка?" или "Позвать менеджера".
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Содержимое памяти</h3>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mb-4">
            В разделе <strong>Управление памятью</strong> вы можете увидеть, что именно бот сохранил о пользователе (имя, потребности, бюджет) и, при необходимости, отредактировать эти данные.
            Например, если клиент сказал "Зовите меня Александр", бот сохранит это в память. Если вы зайдете в панель, вы увидите переменную "Имя: Александр" и сможете ее удалить или поменять.
          </p>
          <Card className="bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-4">
              <pre className="text-xs text-slate-500 dark:text-zinc-400 font-mono overflow-x-auto whitespace-pre-wrap break-words">
                // Пример внутренней памяти бота:\n
                &#123;\n
                  "client_name": "Александр",\n
                  "budget": "до 100 000 руб",\n
                  "wants_to_buy": "Квартира в новостройке"\n
                &#125;
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function IntegrationsSection() {
  const [activeCrm, setActiveCrm] = useState<'b24' | 'amo'>('b24')

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Интеграции с CRM</h2>
      <p className="text-slate-500 dark:text-zinc-400 text-lg">
        Настройте автоматическую передачу лидов (номеров телефонов и email) из чат-бота прямо в вашу CRM-систему. Выберите вашу CRM ниже, чтобы увидеть пошаговую инструкцию.
      </p>

      {/* CRM Selector */}
      <div className="flex gap-4 p-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg w-fit">
        <button
          onClick={() => setActiveCrm('b24')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${activeCrm === 'b24' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'}`}
        >
          Bitrix24
        </button>
        <button
          onClick={() => setActiveCrm('amo')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${activeCrm === 'amo' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'}`}
        >
          AmoCRM (Make / Albato)
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCrm}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeCrm === 'b24' ? <B24Guide /> : <AmoGuide />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function B24Guide() {
  return (
    <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-blue-500"></div>
      <CardContent className="p-6 space-y-8">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Как подключить Bitrix24</h3>
          <p className="text-slate-500 dark:text-zinc-400 text-sm">Вам не нужны программисты. Все настраивается за пару минут через стандартные «Входящие вебхуки» Битрикса.</p>
        </div>

        <div className="space-y-4">
          {[
            { step: 1, title: 'Зайдите в портал Битрикс24', desc: 'В левом меню вашего портала найдите раздел "Разработчикам" → "Другое" → "Входящий вебхук".' },
            { step: 2, title: 'Настройте права', desc: 'В настройках вебхука обязательно выберите права доступа к "CRM" (чтобы мы могли создавать лиды). Нажмите "Сохранить".' },
            { step: 3, title: 'Скопируйте ссылку', desc: 'Битрикс сгенерирует уникальную ссылку (URL). Она выглядит примерно так:', code: 'https://b24-xxxx.bitrix24.ru/rest/1/secret_token/' },
            { step: 4, title: 'Вставьте в Nexus AI', desc: 'Зайдите в панель управления проектом → "Интеграции". Вставьте скопированную ссылку в поле "Вебхук Bitrix24" и обязательно добавьте в конец "crm.lead.add.json", чтобы ссылка стала такой:', code: 'https://b24-xxxx.bitrix24.ru/rest/1/secret_token/crm.lead.add.json' },
          ].map((s) => (
            <div key={s.step} className="flex gap-4 items-start p-4 bg-slate-200 dark:bg-zinc-800/30 border border-slate-300 dark:border-zinc-700/50 rounded-xl">
              <div className="w-8 h-8 shrink-0 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">{s.step}</div>
              <div className="w-full min-w-0">
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">{s.title}</h4>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">{s.desc}</p>
                {s.code && (
                  <div className="mt-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded p-2 text-xs text-blue-300 font-mono overflow-x-auto whitespace-nowrap">
                    {s.code}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AmoGuide() {
  return (
    <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-orange-500"></div>
      <CardContent className="p-6 space-y-8">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Как подключить AmoCRM</h3>
          <p className="text-slate-500 dark:text-zinc-400 text-sm">AmoCRM не поддерживает прямые ссылки для создания лидов извне. Поэтому мы используем сервисы-прослойки (Albato, Make.com, Zapier).</p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4 items-start p-4 bg-slate-200 dark:bg-zinc-800/30 border border-slate-300 dark:border-zinc-700/50 rounded-xl">
            <div className="w-8 h-8 rounded bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold shrink-0">1</div>
            <div className="min-w-0">
              <h4 className="font-semibold text-slate-700 dark:text-slate-200">Создайте сценарий в Make.com (или аналоге)</h4>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Первым модулем выберите "Custom Webhook". Сервис выдаст вам уникальную ссылку (например, <code>https://hook.eu1.make.com/xxx...</code>).</p>
            </div>
          </div>

          <div className="flex gap-4 items-start p-4 bg-slate-200 dark:bg-zinc-800/30 border border-slate-300 dark:border-zinc-700/50 rounded-xl">
            <div className="w-8 h-8 rounded bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold shrink-0">2</div>
            <div className="min-w-0">
              <h4 className="font-semibold text-slate-700 dark:text-slate-200">Подключите webhook к нашему боту</h4>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Скопируйте этот Webhook URL и вставьте его в нашей админке в разделе "Интеграции" → "AmoCRM".</p>
            </div>
          </div>

          <div className="flex gap-4 items-start p-4 bg-slate-200 dark:bg-zinc-800/30 border border-slate-300 dark:border-zinc-700/50 rounded-xl">
            <div className="w-8 h-8 rounded bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold shrink-0">3</div>
            <div className="w-full min-w-0">
              <h4 className="font-semibold text-slate-700 dark:text-slate-200">Получите данные</h4>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 mb-2">Бот будет отправлять на ваш webhook следующий JSON-объект каждый раз, когда клиент оставляет контакт:</p>
              <pre className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-3 rounded-lg text-xs text-orange-300 overflow-x-auto font-mono">
{`{
  "source": "AI Chatbot",
  "contact": "+79991234567",
  "contact_type": "phone", 
  "message": "Краткое саммари того, что хочет клиент"
}`}
              </pre>
            </div>
          </div>

          <div className="flex gap-4 items-start p-4 bg-slate-200 dark:bg-zinc-800/30 border border-slate-300 dark:border-zinc-700/50 rounded-xl">
            <div className="w-8 h-8 rounded bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold shrink-0">4</div>
            <div className="min-w-0">
              <h4 className="font-semibold text-slate-700 dark:text-slate-200">Настройте создание сделки</h4>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Вторым модулем в Make.com выберите "AmoCRM → Create a Lead". Передайте полученный <code>contact</code> и <code>message</code> в соответствующие поля AmoCRM.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WidgetSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Установка на сайт</h2>
      <p className="text-slate-500 dark:text-zinc-400">Установить виджет на любой сайт очень просто.</p>

      <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-4">
            <LayoutTemplate size={24} />
            <h3 className="text-xl font-semibold">Tilda, WordPress, HTML</h3>
          </div>
          <p className="text-slate-500 dark:text-zinc-400 text-sm">
            Зайдите в раздел <strong>Установка виджета</strong> в настройках проекта. Скопируйте предоставленный HTML-код (тег <code>&lt;script&gt;</code>).
          </p>
          <ul className="list-disc pl-5 text-slate-500 dark:text-zinc-400 text-sm space-y-1">
            <li><strong>Tilda:</strong> Блок T123 (HTML-код).</li>
            <li><strong>WordPress:</strong> В плагине Insert Headers and Footers.</li>
            <li><strong>HTML:</strong> Перед закрывающим тегом <code>&lt;/body&gt;</code>.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function HistorySection() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">История диалогов и Лиды</h2>
      <p className="text-slate-500 dark:text-zinc-400">Следите за общением клиентов и не упускайте ни одной сделки.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">История диалогов</h3>
            <p className="text-slate-500 dark:text-zinc-400 text-sm mb-4">
              В разделе <strong>История диалогов</strong> сохраняются абсолютно все переписки бота с клиентами. 
              Вы можете зайти туда в любой момент и прочитать, о чем общался ваш ИИ-ассистент, чтобы проконтролировать качество ответов.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Сбор Лидов</h3>
            <p className="text-slate-500 dark:text-zinc-400 text-sm mb-4">
              Если клиент оставит номер телефона или email, бот автоматически распознает это и сохранит контакт в раздел <strong>Лиды</strong>.
            </p>
            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-3 rounded text-sm text-slate-700 dark:text-zinc-300">
              <strong>Совет:</strong> В настройках бота (раздел "Промпт") напишите: "В конце диалога всегда предлагай клиенту оставить номер телефона для связи с менеджером".
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AnalyticsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Аналитика</h2>
      <p className="text-slate-500 dark:text-zinc-400">Умная аналитика позволяет понять, чего хотят ваши клиенты, даже если вы не читаете все диалоги.</p>

      <div className="space-y-4">
        <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-6 space-y-2">
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <MessageCircleQuestion className="w-5 h-5" />
              Облако вопросов
            </h3>
            <p className="text-slate-500 dark:text-zinc-400 text-sm">
              Нейросеть анализирует все диалоги за месяц и визуально выделяет самые популярные вопросы. Если клиенты часто спрашивают "доставка в регионы", вы увидите это крупным шрифтом. Это отличный повод добавить информацию о доставке на ваш сайт!
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-6 space-y-2">
            <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Слабые места
            </h3>
            <p className="text-slate-500 dark:text-zinc-400 text-sm">
              Бот также собирает вопросы, на которые он <strong>не смог ответить</strong> из-за нехватки информации в Базе Знаний. 
              Раз в неделю заходите в этот раздел и добавляйте нужные ответы в Базу Знаний, чтобы закрыть эти пробелы.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TeamSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Команда</h2>
      <p className="text-slate-500 dark:text-zinc-400">Работайте над проектами вместе с коллегами.</p>

      <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm">
        <CardContent className="p-6">
          <p className="text-slate-500 dark:text-zinc-400 text-sm mb-4">
            Вам не обязательно передавать доступ к своему аккаунту. В разделе <strong>Команда</strong> вы можете пригласить менеджеров, сотрудников поддержки или маркетологов по их email.
          </p>
          <ul className="list-disc pl-4 text-sm text-slate-700 dark:text-zinc-300 space-y-2">
            <li><strong>Менеджеры</strong> смогут читать диалоги, смотреть лиды и аналитику, но не смогут удалить проект или сменить API-ключ.</li>
            <li>Приглашенный сотрудник получит ссылку и после авторизации увидит проект в своем списке.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function TokensSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">AI Генерация и Токены</h2>
      <p className="text-slate-500 dark:text-zinc-400">Как списываются токены при работе с нейросетями.</p>

      <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm border-t-4 border-t-amber-500">
        <CardContent className="p-6 space-y-4">
          <p className="text-slate-700 dark:text-zinc-300 text-sm">
            Платформа работает через RouterAI. Каждый раз, когда бот отправляет сообщение или выполняет фоновые задачи (например, аналитику), расходуются токены с вашего баланса RouterAI.
          </p>
          
          <h3 className="text-lg font-bold text-slate-900 dark:text-white pt-4">Где используются токены?</h3>
          <ul className="list-disc pl-4 text-sm text-slate-500 dark:text-zinc-400 space-y-2">
            <li><strong>Ответы в чате:</strong> Генерация каждого сообщения клиенту.</li>
            <li><strong>Анализ памяти:</strong> Фоновое обновление профиля клиента (сбор имени, бюджета) после каждого его сообщения.</li>
            <li><strong>Саммаризация Лидов:</strong> Когда создается лид, ИИ делает короткую выжимку диалога для передачи в CRM.</li>
            <li><strong>Сбор аналитики:</strong> Раз в период ИИ перечитывает логи для формирования "Слабых мест" и "Облака вопросов".</li>
          </ul>
          
          <div className="bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded p-3 text-sm text-amber-800 dark:text-amber-200 mt-4">
            В зависимости от выбранной модели в настройках (gpt-3.5, claude-3-haiku, gpt-4o), стоимость одного ответа может отличаться в десятки раз. Рекомендуем использовать быстрые и дешевые модели (например <code>gpt-4o-mini</code>) для повседневных чатов.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
