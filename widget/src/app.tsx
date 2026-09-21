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
  const [isAgreed, setIsAgreed] = useState(() => {
    try {
      return localStorage.getItem('cw_consent_agreed') === 'true'
    } catch {
      return false
    }
  })
  const [isHighlightingConsent, setIsHighlightingConsent] = useState(false)

  function triggerConsentHighlight() {
    setIsHighlightingConsent(true)
    setTimeout(() => {
      setIsHighlightingConsent(false)
    }, 700)
  }

  function toggleConsent(agreed: boolean) {
    setIsAgreed(agreed)
    try {
      if (agreed) {
        localStorage.setItem('cw_consent_agreed', 'true')
      } else {
        localStorage.removeItem('cw_consent_agreed')
      }
    } catch {}
  }
  
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
            const widgetEl = document.getElementById('ai-chat-widget-wrapper')
            if (widgetEl) {
              widgetEl.style.setProperty('--theme-color', data.theme_color)
            }
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

    if (!isAgreed) {
      triggerConsentHighlight()
      return
    }

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
      <div className="cw-inactive">
        <p>Widget is inactive. Please provide a valid project_id in the URL.</p>
      </div>
    )
  }

  return (
    <div>
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
          className="cw-launcher-btn"
        >
          <div className="cw-launcher-icon">
            {config.icon_url ? (
              <img src={config.icon_url} alt="Bot Icon" />
            ) : (
              <MessageCircle size={20} />
            )}
          </div>
          <span className="cw-launcher-text">Задать вопрос</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="cw-window">
          
          {/* Header */}
          <div className="cw-header">
            <div className="cw-header-info">
              <div className="cw-header-avatar">
                {config.icon_url ? (
                  <img src={config.icon_url} alt="Bot Icon" />
                ) : (
                  <Bot size={24} />
                )}
              </div>
              <div>
                <div className="cw-header-name">{config.name}</div>
                <div className="cw-header-status">
                  <div className="cw-status-dot"></div>
                  <span className="cw-status-text">online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="cw-close-btn" aria-label="Закрыть">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="cw-messages">
            {messages.map((msg, idx) => (
              <div key={msg.id} className="cw-msg-group">
                <div className={`cw-msg-row ${msg.role === 'user' ? 'cw-msg-row-user' : 'cw-msg-row-assistant'}`}>
                  {msg.role === 'assistant' && (
                    <div className="cw-msg-avatar">
                      {config.icon_url ? (
                        <img src={config.icon_url} alt="Bot Icon" />
                      ) : (
                        <Bot size={18} />
                      )}
                    </div>
                  )}
                  
                  <div className={`cw-bubble ${
                    msg.role === 'user' 
                      ? 'cw-bubble-user' 
                      : 'cw-bubble-assistant'
                  }`}>
                    <div className="cw-bubble-content">
                      {msg.content ? (
                        msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i}>{part.slice(2, -2)}</strong>;
                          }
                          return <span key={i}>{part}</span>;
                        })
                      ) : (
                        msg.role === 'assistant' && <span className="cw-typing-dots">...</span>
                      )}
                    </div>
                    <div className={`cw-timestamp ${msg.role === 'user' ? 'cw-timestamp-user' : 'cw-timestamp-assistant'}`}>
                      {new Date(parseInt(msg.id)).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Suggestions - only show on the very last message */}
                {msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1 && (
                  <div className="cw-suggestions-container">
                    {msg.suggestions.map((suggestion, sIdx) => (
                      <div 
                        key={sIdx}
                        onClick={() => !isLoading && handleSend(suggestion)}
                        className={`cw-suggestion-btn ${isLoading ? 'cw-btn-disabled' : ''}`}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions - show only if it's just the welcome message */}
          {messages.length === 1 && config.quick_questions && config.quick_questions.length > 0 && !isLoading && (
            <div className="cw-quick-container">
              <div className="cw-quick-list">
                {config.quick_questions.map((question, qIdx) => (
                  <div 
                    key={qIdx}
                    onClick={() => !isLoading && handleSend(question)}
                    className={`cw-quick-btn ${isLoading ? 'cw-btn-disabled' : ''}`}
                  >
                    {question}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="cw-input-container">
            <form onSubmit={sendMessage} className="cw-input-form">
              <input
                type="text"
                placeholder="Задайте любой вопрос"
                className="cw-input"
                value={input}
                onFocus={() => {
                  if (!isAgreed) {
                    triggerConsentHighlight()
                  }
                }}
                onInput={(e) => {
                  setInput((e.target as HTMLInputElement).value)
                  if (!isAgreed && !isHighlightingConsent) {
                    triggerConsentHighlight()
                  }
                }}
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="cw-send-btn"
                aria-label="Отправить"
              >
                <Send size={18} className="cw-send-icon" />
              </button>
            </form>
            
            {/* Compact Consent Checkbox */}
            <div className={`cw-consent-wrapper ${isHighlightingConsent ? 'cw-consent-highlight' : ''}`}>
              <label className="cw-consent-label">
                <input
                  type="checkbox"
                  checked={isAgreed}
                  onChange={(e) => toggleConsent((e.target as HTMLInputElement).checked)}
                  className="cw-consent-checkbox"
                />
                <span className={`cw-consent-custom-box ${isAgreed ? 'cw-consent-box-checked' : ''}`}>
                  {isAgreed && (
                    <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </span>
                <span className="cw-consent-text">
                  Согласен с {config.privacy_policy_url ? (
                    <a href={config.privacy_policy_url} target="_blank" rel="noopener noreferrer" className="cw-privacy-link" onClick={(e) => e.stopPropagation()}>
                      политикой обработки данных
                    </a>
                  ) : (
                    <span>политикой обработки данных</span>
                  )}
                </span>
              </label>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}
