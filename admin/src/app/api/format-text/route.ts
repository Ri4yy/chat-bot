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

const MAX_TOKENS_LIMIT = 50000

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text, projectId } = await req.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    let openrouterApiKey = null
    if (projectId) {
      const { data: project } = await supabase.from('projects').select('openrouter_api_key').eq('id', projectId).single()
      if (project) {
        openrouterApiKey = project.openrouter_api_key
      }
    }
    const openrouter = getOpenRouter(openrouterApiKey)

    // Check token usage
    const { data: usageData, error: usageError } = await supabase
      .from('user_usage')
      .select('tokens_used')
      .eq('user_id', user.id)
      .single()

    let currentTokens = 0
    if (usageData) {
      currentTokens = usageData.tokens_used || 0
    }

    if (currentTokens >= MAX_TOKENS_LIMIT) {
      return NextResponse.json({ error: 'Достигнут лимит токенов на форматирование (50,000)' }, { status: 403 })
    }

    const systemPrompt = `Вы — профессиональный редактор данных. 
Ваша задача — получить сырой текст (возможно с мусором от парсинга), очистить его, красиво отформатировать, убрать лишние символы и структурировать для удобного чтения. 
Используйте Markdown, заголовки, списки, если это уместно. Оставьте только суть и сохраните все важные детали.`

    // Call LLM
    const { text: formattedText, usage } = await generateText({
      model: openrouter('stealth/ox-alpha'), // Free model requested by user
      system: systemPrompt,
      prompt: text,
      temperature: 0.2,
    })

    const usedTokens = usage?.totalTokens || 0
    const newTotal = currentTokens + usedTokens

    // Upsert token usage using RPC
    if (usedTokens > 0) {
      const { error: upsertError } = await supabase.rpc('increment_user_usage', {
        target_user_id: user.id,
        chat_tokens: 0,
        parse_tokens: usedTokens
      })

      if (upsertError) {
        console.error('Error updating token usage:', upsertError)
      }

      if (projectId) {
        await supabase.rpc('increment_project_usage', {
          target_project_id: projectId,
          chat_tokens: 0,
          parse_tokens: usedTokens
        })
      }
    }

    return NextResponse.json({ 
      formattedText, 
      tokensUsed: usedTokens,
      newTotal 
    })

  } catch (error: any) {
    console.error('Format text error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
