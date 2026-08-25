import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
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

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json()

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership/manager
    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single()
    const { data: member } = await supabase.from('project_members').select('*').eq('project_id', projectId).eq('user_id', user.id).single()
    
    if (project?.user_id !== user.id && !member) {
      return NextResponse.json({ error: 'Unauthorized for this project' }, { status: 403 })
    }

    const openrouter = getOpenRouter(project?.openrouter_api_key)

    // Fetch recent chat sessions
    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: 'Нет данных диалогов для анализа' }, { status: 400 })
    }

    const sessionIds = sessions.map(s => s.id)

    // Fetch messages from those sessions
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: false })
      .limit(200)

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Нет сообщений для анализа' }, { status: 400 })
    }

    // Format chat log for LLM
    const chatLog = messages
      .reverse()
      .map(m => `${m.role === 'user' ? 'Клиент' : 'Бот'}: ${m.content}`)
      .join('\n')
      .substring(0, 15000) // limit context

    const systemPrompt = `Ты — аналитик данных. Твоя задача — проанализировать лог диалогов бота с клиентами и составить JSON отчет.
    
    ПРАВИЛА:
    1. Найди 5 самых популярных тем или вопросов, о которых спрашивают клиенты. (Массив строк "top_questions")
    2. Найди до 5 вопросов или запросов, на которые бот не смог нормально ответить (сказал "я не знаю", "нет информации" или дал плохой ответ). (Массив строк "unanswered_questions")
    3. Верни результат строго в виде JSON-объекта, без markdown разметки и без ничего лишнего.
    
    Пример ответа:
    {
      "top_questions": ["Сколько стоит доставка?", "Где вы находитесь?", "Как записаться?"],
      "unanswered_questions": ["Как вернуть товар?", "Есть ли у вас рассрочка?"]
    }
    
    Лог диалогов:
    ${chatLog}`

    const { text, usage } = await generateText({
      model: openrouter('stealth/ox-alpha'),
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Сгенерируй JSON-отчет по логам.' }],
      temperature: 0.3
    })

    const usedTokens = usage?.totalTokens || 0
    if (usedTokens > 0) {
      await supabase.rpc('increment_user_usage', {
        target_user_id: user.id,
        chat_tokens: 0,
        parse_tokens: usedTokens
      })
      await supabase.rpc('increment_project_usage', {
        target_project_id: projectId,
        chat_tokens: 0,
        parse_tokens: usedTokens
      })
    }

    let result = { top_questions: [], unanswered_questions: [] }
    try {
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
      result = JSON.parse(cleanedText)
    } catch (e) {
      console.error('Failed to parse LLM JSON:', text)
      throw new Error('Failed to parse AI response')
    }

    // Save to DB
    const analyticsData = {
      last_updated: new Date().toISOString(),
      top_questions: result.top_questions || [],
      unanswered_questions: result.unanswered_questions || []
    }
    
    await supabase.from('projects').update({ analytics_cache: analyticsData }).eq('id', projectId)

    return NextResponse.json(analyticsData)

  } catch (error: any) {
    console.error('Generate analytics error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Unknown error', 
    }, { status: 500 })
  }
}
