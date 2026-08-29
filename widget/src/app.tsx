import { useState, useEffect, useRef } from 'preact/hooks'
import { MessageCircle, X, Send, Bot } from 'lucide-preact'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggestions?: string[]
}

export function App({ projectId, apiUrl = 'http://localhost:3000' }: { projectId: string | null, apiUrl?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState({
    name: 'Менеджер',
    theme_color: '#3b82f6',
    welcome_message: 'Привет! Чем я могу помочь?',
    icon_url: '',
    quick_questions: [] as string[],
    privacy_policy_url: ''
  })
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Generate a unique session ID for this chat window
  const [sessionId] = useState(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    // Fallback simple UUID v4 generator
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (projectId) {
      // Fetch widget config from Admin API
      fetch(`${apiUrl}/api/widget/config?project_id=${projectId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setConfig(data)
            document.documentElement.style.setProperty('--theme-color', data.theme_color)
            setMessages([
              { id: '1', role: 'assistant', content: data.welcome_message }
            ])
          }
        })
        .catch(console.error)
    }
  }, [projectId])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function handleSend(textToSend: string) {
    if (!textToSend.trim() || !projectId) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // Add empty assistant message for streaming
    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

    let typeWriterInterval: ReturnType<typeof setInterval> | null = null

    try {
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          sessionId,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
        })
      })
      
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to fetch chat')
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let displayedLength = 0
      let isReading = true

      if (reader) {
        setIsLoading(false) // Hide the typing indicator as soon as we start receiving data
        
        // Typewriter effect loop
        typeWriterInterval = setInterval(() => {
          if (displayedLength < fullText.length) {
            // Read 1-2 chars at a time depending on how far behind we are
            const charsToAdd = Math.max(1, Math.floor((fullText.length - displayedLength) / 5))
            displayedLength += charsToAdd
            
            const currentDisplayed = fullText.substring(0, displayedLength)
            setMessages(prev => prev.map(m => 
              m.id === assistantId ? { ...m, content: currentDisplayed.replace(/\[([^\]]*)$/, '').replace(/\[([^\]]+)\][\s.!?]*$/, '').trim() } : m
            ))
          } else if (!isReading) {
            if (typeWriterInterval) clearInterval(typeWriterInterval)
            
            // Final parse when completely done
            let suggestions: string[] | undefined = undefined
            let finalText = fullText
            const match = finalText.match(/\[([^\]]+)\][\s.!?]*$/)
            if (match) {
              finalText = finalText.replace(/\[([^\]]+)\][\s.!?]*$/, '').trim()
              suggestions = match[1].split('|').map(s => s.trim())
            }

            setMessages(prev => prev.map(m => 
              m.id === assistantId ? { ...m, content: finalText, suggestions } : m
            ))
          }
        }, 20) // 20ms per tick

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            isReading = false
            break
          }
          fullText += decoder.decode(value, { stream: true })
        }
      } else {
        fullText = await res.text()
        
        let suggestions: string[] | undefined = undefined
        const match = fullText.match(/\[([^\]]+)\][\s.!?]*$/)
        if (match) {
          fullText = fullText.replace(/\[([^\]]+)\][\s.!?]*$/, '').trim()
          suggestions = match[1].split('|').map(s => s.trim())
        }

        setMessages(prev => prev.map(m => 
          m.id === assistantId ? { ...m, content: fullText, suggestions } : m
        ))
      }
      
    } catch (error) {
      console.error('Error fetching chat:', error)
      if (typeWriterInterval) {
        clearInterval(typeWriterInterval)
      }
      setMessages(prev => prev.map(m => 
        m.id === assistantId ? { ...m, content: 'Sorry, I encountered an error. Please try again later.' } : m
      ))
    } finally {
      setIsLoading(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Additional cleanup if needed (handled locally in handleSend)
    }
  }, [])

  function sendMessage(e: Event) {
    e.preventDefault()
    handleSend(input)
  }

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-500 font-sans">
        <p>Widget is inactive. Please provide a valid project_id in the URL.</p>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      
      {/* Floating Chat Button */}
      {!isOpen && (
        <button 
          onClick={() => {
            setIsOpen(true)
            if (projectId) {
              fetch(`${apiUrl}/api/widget/track-open`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
              }).catch(console.error)
            }
          }}
          className="rounded-full bg-white/90 backdrop-blur-md shadow-xl flex items-center gap-3 pr-5 pl-2 py-2 hover:scale-105 transition-transform duration-200 border border-slate-100 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--theme-color)] text-white shadow-sm flex items-center justify-center overflow-hidden">
            {config.icon_url ? (
              <img src={config.icon_url} alt="Bot Icon" className="w-full h-full object-cover" />
            ) : (
              <MessageCircle size={20} />
            )}
          </div>
          <span className="font-semibold text-slate-700 text-sm">Задать вопрос</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[380px] h-[650px] max-h-[85vh] bg-gradient-to-br from-blue-50/95 via-white/95 to-purple-50/95 backdrop-blur-xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-white/50 animate-message">
          
          {/* Header */}
          <div className="p-5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[var(--theme-color)] shrink-0 overflow-hidden">
                {config.icon_url ? (
                  <img src={config.icon_url} alt="Bot Icon" className="w-full h-full object-cover" />
                ) : (
                  <Bot size={24} />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 text-base leading-tight">{config.name}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-green-500 font-medium leading-none">online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100/50 cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4 chat-scroll">
            {messages.map((msg, idx) => (
              <div key={msg.id} className="flex flex-col gap-2">
                <div className={`flex gap-2 items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[var(--theme-color)] shrink-0 mb-1 overflow-hidden">
                      {config.icon_url ? (
                        <img src={config.icon_url} alt="Bot Icon" className="w-full h-full object-cover" />
                      ) : (
                        <Bot size={18} />
                      )}
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm shadow-sm relative ${
                    msg.role === 'user' 
                      ? 'bg-[var(--theme-color)] text-white rounded-br-sm' 
                      : 'bg-white/90 backdrop-blur-sm text-slate-800 rounded-bl-sm border border-white/50'
                  }`}>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content ? (
                        msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
                          }
                          return <span key={i}>{part}</span>;
                        })
                      ) : (
                        msg.role === 'assistant' && <span className="animate-pulse">...</span>
                      )}
                    </div>
                    <div className={`text-[10px] text-right mt-1.5 ${msg.role === 'user' ? 'text-white/70' : 'text-slate-400'}`}>
                      {new Date(parseInt(msg.id)).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Suggestions - only show on the very last message */}
                {msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1 && (
                  <div className="flex flex-wrap gap-2 ml-10">
                    {msg.suggestions.map((suggestion, sIdx) => (
                      <button 
                        key={sIdx}
                        disabled={isLoading}
                        onClick={() => handleSend(suggestion)}
                        className="bg-white/90 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-medium hover:bg-[var(--theme-color)] hover:text-white hover:border-[var(--theme-color)] transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions - show only if it's just the welcome message */}
          {messages.length === 1 && config.quick_questions && config.quick_questions.length > 0 && !isLoading && (
            <div className="px-5 pb-2">
              <div className="flex flex-wrap gap-2 justify-end">
                {config.quick_questions.map((question, qIdx) => (
                  <button 
                    key={qIdx}
                    disabled={isLoading}
                    onClick={() => handleSend(question)}
                    className="bg-white border border-[var(--theme-color)]/30 text-slate-700 px-3 py-1.5 rounded-2xl text-[13px] font-medium hover:bg-[var(--theme-color)] hover:text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-5 shrink-0 pb-6">
            <form onSubmit={sendMessage} className="relative flex items-center bg-white/90 backdrop-blur-md rounded-full shadow-md p-1 border border-white/60">
              <input
                type="text"
                placeholder="Задайте любой вопрос"
                className="w-full bg-transparent border-none py-3 pl-4 pr-12 text-sm focus:outline-none text-slate-800 placeholder:text-slate-400"
                value={input}
                onInput={(e) => setInput((e.target as HTMLInputElement).value)}
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 w-10 h-10 rounded-full bg-[var(--theme-color)] text-white flex items-center justify-center disabled:opacity-50 transition-transform active:scale-95 shadow-sm hover:shadow-md cursor-pointer"
              >
                <Send size={18} className="ml-0.5" />
              </button>
            </form>
            {config.privacy_policy_url && (
              <div className="text-center mt-3 text-[10px] text-slate-400 font-medium">
                При отправке данных вы соглашаетесь с <a href={config.privacy_policy_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-500 transition-colors">политикой обработки персональных данных</a>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  )
}
