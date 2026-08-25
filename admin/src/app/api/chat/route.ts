import { streamText, generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/embeddings'
import { decrypt } from '@/lib/encryption'

function getOpenRouter(apiKey?: string | null) {
  const finalKey = (apiKey ? decrypt(apiKey) : null) || process.env.OPENROUTER_API_KEY
  return createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: finalKey,
    headers: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Chat Bot Platform',
    }
  })
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const { messages, projectId, sessionId } = await req.json()

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400, headers: corsHeaders })
    }

    // 1. Fetch project settings
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('name, system_prompt, tone, rules, user_id, openrouter_api_key, b24_webhook_url, amo_webhook_url')
      .eq('id', projectId)
      .single()

    if (projectError) {
      console.error('Project fetch error:', projectError)
      return NextResponse.json({ error: 'Project not found' }, { status: 404, headers: corsHeaders })
    }
    
    const openrouter = getOpenRouter(project.openrouter_api_key)

    const lastMessage = messages[messages.length - 1]

    // --- DIALOG PERSISTENCE & LEAD DETECTION ---
    if (sessionId) {
      // 1. Ensure session exists
      const { data: session } = await supabase.from('chat_sessions').select('id').eq('id', sessionId).single()
      if (!session) {
        await supabase.from('chat_sessions').insert({ id: sessionId, project_id: projectId }).select()
      }

      // 2. Log User Message
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        role: 'user',
        content: lastMessage.content
      })

      // 3. Detect Leads (Phone or Email)
      const phoneRegex = /(?:\+7|8)[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}/
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      const phoneMatch = lastMessage.content.match(phoneRegex)
      const emailMatch = lastMessage.content.match(emailRegex)

      if (phoneMatch || emailMatch) {
        const contactInfo = phoneMatch ? phoneMatch[0] : emailMatch![0]
        
        // Check if lead already exists for this session to avoid duplicates
        const { data: existingLead } = await supabase.from('leads').select('id').eq('session_id', sessionId).eq('contact_info', contactInfo).single()
        
        if (!existingLead) {
          // Generate a summary of the client's request based on the chat history
          const chatHistoryText = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
          let summaryMessage = lastMessage.content
          
          try {
            const summaryPrompt = `Ниже приведена история переписки клиента и бота. Клиент только что оставил свои контактные данные.
            Пожалуйста, составь краткое, структурированное резюме запроса этого клиента для менеджера по продажам.
            Выдели главное: какая услуга интересует, какие детали клиент успел сообщить, в чем его основная потребность.
            Если деталей мало, так и напиши.

            История:
            ${chatHistoryText}`

            const { text: summaryText } = await generateText({
              model: openrouter('stealth/ox-alpha'),
              prompt: summaryPrompt,
              temperature: 0.1
            })
            if (summaryText) {
              summaryMessage = summaryText.trim()
            }
          } catch (summaryErr) {
            console.error('Error generating lead summary:', summaryErr)
          }

          await supabase.from('leads').insert({
            project_id: projectId,
            session_id: sessionId,
            contact_info: contactInfo,
            message: summaryMessage
          })

          // Отправка в Bitrix24
          if (project.b24_webhook_url) {
            try {
              const isEmail = contactInfo.includes('@')
              const payload = {
                fields: {
                  TITLE: 'Лид из AI виджета',
                  COMMENTS: summaryMessage,
                  ...(isEmail 
                    ? { EMAIL: [{ VALUE: contactInfo, VALUE_TYPE: 'WORK' }] }
                    : { PHONE: [{ VALUE: contactInfo, VALUE_TYPE: 'WORK' }] }
                  )
                }
              }
              
              // Запускаем асинхронно, не дожидаясь ответа, чтобы не тормозить чат
              fetch(project.b24_webhook_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              }).catch(err => console.error('Error sending lead to B24:', err))
            } catch (err) {
              console.error('Failed to prepare B24 webhook request:', err)
            }
          }
          // Отправка в AmoCRM (через вебхук)
          if (project.amo_webhook_url) {
            try {
              const isEmail = contactInfo.includes('@')
              const payload = {
                source: "AI Chatbot",
                contact: contactInfo,
                contact_type: isEmail ? "email" : "phone",
                message: summaryMessage
              }
              
              // Запускаем асинхронно
              fetch(project.amo_webhook_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              }).catch(err => console.error('Error sending lead to AmoCRM:', err))
            } catch (err) {
              console.error('Failed to prepare AmoCRM webhook request:', err)
            }
          }
        }
      }
    }
    // -------------------------------------------
    
    // 1. Generate embedding for user query
    const embedding = await generateEmbedding(lastMessage.content)

    // 2. Search knowledge base
    const { data: documents, error: searchError } = await supabase
      .rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 5,
        filter_project_id: projectId
      })

    if (searchError) {
      console.error('Search error:', searchError)
    }

    // 3. Extract text from documents
    const contextText = documents && documents.length > 0 
      ? documents.map((doc: any) => doc.content).join('\n---\n') 
      : 'No additional context available.'

    // 4. Construct System Prompt
    const securityPrompt = `Вы — дружелюбный, проактивный и полезный ИИ-ассистент компании "${project?.name || 'этого проекта'}".
    Ваша задача - работать как квалификационный менеджер: выявлять потребности клиента, консультировать на основе базы знаний и собирать лиды.

    ВОРОНКА ДИАЛОГА (СТРОГО СОБЛЮДАЙТЕ):
    Шаг 1. Приветствие и ответ на вопрос: Сначала всегда отвечайте на вопросы клиента по базе знаний.
    Шаг 2. Квалификация (Сбор информации): Если клиент интересуется услугой (например, разработка сайта), не просите контакты сразу! Задайте 1-2 уточняющих вопроса, чтобы понять его задачу (какой тип проекта, цель, есть ли референсы и т.д.).
    Шаг 3. Запрос контактов: ТОЛЬКО когда вы собрали базовую информацию о задаче клиента и понимаете, что ему нужен детальный расчет или помощь менеджера, предложите оставить номер телефона или email для связи.

    ИНСТРУКЦИИ:
    1. Опирайтесь ТОЛЬКО на текст в секции <context>. Если цены или детали не указаны, отвечайте общими терминами, но не говорите "я не знаю".
    2. Не требуйте контакты на каждом шаге! Если человек просто спросил "какие услуги есть?", перечислите услуги и спросите "Что из этого вас интересует больше всего?".
    3. Отвечайте лаконично, естественно, как живой оператор поддержки. Разделяйте текст на абзацы.
    4. ВАЖНАЯ ФИШКА: Если ваш вопрос подразумевает выбор из нескольких логичных вариантов ответа, ОБЯЗАТЕЛЬНО добавьте эти варианты в самом конце вашего сообщения в квадратных скобках через вертикальную черту. Пример: [Лендинг | Корпоративный сайт | Интернет-магазин]
    5. Если клиент оставил контакты, вежливо поблагодарите, скажите, что менеджер скоро свяжется, и завершите сбор данных. Обращайтесь на "Вы".`
    
    const userCustomPrompt = project?.system_prompt ? `\n\nДополнительные инструкции для вашего поведения:\n${project.system_prompt}` : ''
    const toneInstruction = project?.tone ? `\n\nВаш стиль общения: ${project.tone}. Строго придерживайтесь этого стиля.` : ''
    const rulesInstruction = Array.isArray(project?.rules) && project.rules.length > 0 
      ? `\n\nПРАВИЛА ОБЩЕНИЯ:\n${project.rules.map((r: string) => `- ${r}`).join('\n')}` 
      : ''
    
    const systemPrompt = `${securityPrompt}${toneInstruction}${rulesInstruction}${userCustomPrompt}

<context>
${contextText}
</context>
`
    // 5. Call LLM with streaming
    const result = await streamText({
      model: openrouter('stealth/ox-alpha'),
      system: systemPrompt,
      messages: messages,
      temperature: 0.7, // Adjust temperature for better roleplay/rules performance
      async onFinish({ text, usage }) {
        // 6. Record Token Usage
        if (usage) {
          const totalTokens = usage?.totalTokens || 0
          if (totalTokens > 0) {
            if (project?.user_id) {
              await supabase.rpc('increment_user_usage', {
                target_user_id: project.user_id,
                chat_tokens: totalTokens,
                parse_tokens: 0
              })
            }
            if (projectId) {
              await supabase.rpc('increment_project_usage', {
                target_project_id: projectId,
                chat_tokens: totalTokens,
                parse_tokens: 0
              })
            }
          }
        }

        // --- LOG ASSISTANT RESPONSE ---
        if (sessionId) {
          await supabase.from('chat_messages').insert({
            session_id: sessionId,
            role: 'assistant',
            content: text
          })
        }
      }
    })

    return result.toTextStreamResponse({
      headers: corsHeaders
    })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  }
}
