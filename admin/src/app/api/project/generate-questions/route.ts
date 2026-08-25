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

    // Fetch documents
    const { data: documents } = await supabase.from('documents').select('content').eq('project_id', projectId)
    
    const contextText = documents && documents.length > 0 
      ? documents.map((doc) => doc.content).join('\n---\n').substring(0, 8000) // limit to avoid massive context
      : ''

    if (!contextText) {
      return NextResponse.json({ questions: ['Здравствуйте!', 'Чем могу помочь?', 'Расскажите о ваших услугах'] })
    }

    const systemPrompt = `Ты — полезный AI ассистент. Твоя задача: проанализировать базу знаний бизнеса и придумать ровно 3 коротких, частых вопроса, которые клиенты могли бы задать боту на старте.
    
    ПРАВИЛА:
    1. Напиши ровно 3 вопроса.
    2. Каждый вопрос должен быть коротким (максимум 5-6 слов).
    3. Вопросы должны звучать от лица клиента (например: "Сколько стоит доставка?", "Где вы находитесь?", "Как записаться?").
    4. Опирайся на услуги/товары из базы знаний.
    5. Верни результат строго в виде JSON-массива строк, без markdown разметки и без ничего лишнего. Пример: ["Вопрос 1", "Вопрос 2", "Вопрос 3"]
    
    База знаний:
    ${contextText}`

    const { text, usage } = await generateText({
      model: openrouter('stealth/ox-alpha'),
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Сгенерируй JSON-массив из 3 вопросов.' }],
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

    let questions: string[] = []
    try {
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
      questions = JSON.parse(cleanedText)
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Not an array')
      }
      questions = questions.slice(0, 3)
    } catch (e) {
      console.error('Failed to parse LLM JSON:', text)
      questions = ['Здравствуйте!', 'Какие у вас есть услуги?', 'Как с вами связаться?']
    }

    // Save to DB
    await supabase.from('projects').update({ quick_questions: questions }).eq('id', projectId)

    return NextResponse.json({ questions })

  } catch (error: any) {
    console.error('Generate questions error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Unknown error', 
      stack: error?.stack 
    }, { status: 500 })
  }
}
