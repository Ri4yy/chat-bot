import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/embeddings'

function splitIntoChunks(text: string, maxTokens: number = 200): string[] {
  // Simple chunking by paragraphs or sentences.
  // For production, use LangChain's RecursiveCharacterTextSplitter
  const chunks: string[] = []
  const paragraphs = text.split('\n\n')
  
  let currentChunk = ''
  for (const p of paragraphs) {
    if ((currentChunk + p).length > maxTokens * 4) { // rough approximation
      if (currentChunk) chunks.push(currentChunk.trim())
      currentChunk = p
    } else {
      currentChunk += '\n\n' + p
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim())
  
  return chunks.filter(c => c.length > 0)
}

export async function POST(req: Request) {
  try {
    const { text, projectId } = await req.json()
    
    if (!text || !projectId) {
      return NextResponse.json({ error: 'Missing text or projectId' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {} // Read-only in API routes is fine for checking auth
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership, manager permissions, or super_admin
    const [{ data: project }, { data: limitData }] = await Promise.all([
      supabase.from('projects').select('user_id, system_prompt').eq('id', projectId).single(),
      supabase.from('user_limits').select('is_super_admin').eq('user_id', user.id).single()
    ])

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const isSuperAdmin = limitData?.is_super_admin || false
    let hasPermission = false

    if (project.user_id === user.id || isSuperAdmin) {
      hasPermission = true
    } else {
      const { data: member } = await supabase
        .from('project_members')
        .select('permissions')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()
      
      if (member && member.permissions?.includes('knowledge')) {
        hasPermission = true
      }
    }

    if (!hasPermission) return NextResponse.json({ error: 'Unauthorized: missing knowledge permission' }, { status: 403 })

    let totalParseTokens = 0

    // Автогенерация system_prompt, если он пустой ИЛИ если там стоит старый шаблонный текст
    const isDefaultPrompt = project.system_prompt && (
      project.system_prompt.includes('Вы — полезный ИИ-ассистент компании. Ваша цель — вежливо и точно отвечать на вопросы') ||
      project.system_prompt.includes('основываясь ИСКЛЮЧИТЕЛЬНО на предоставленном контексте')
    )

    let finalPrompt = null

    if (!project.system_prompt || project.system_prompt.trim() === '' || isDefaultPrompt) {
      try {
        const sampleText = text.substring(0, 4000)
        const openRouterRes = await fetch('https://routerai.ru/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.ROUTERAI_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Widget ChatBot'
          },
          body: JSON.stringify({
            model: 'z-ai/glm-5.3-flash',
            messages: [
              {
                role: 'system',
                content: `Ты эксперт по созданию сценариев продаж для ИИ-ассистентов. Я дам тебе базовую информацию о компании (спарсенный текст).
Твоя задача — написать "Дополнительные инструкции для ИИ" (системный промпт), по которому бот будет общаться с клиентами.

СТРУКТУРА ТВОЕГО ОТВЕТА (ОТВЕЧАЙ СТРОГО ТАК, БЕЗ ПРИВЕТСТВИЙ):
Ты менеджер по продажам компании [Название/Тематика]. Твоя главная цель — [Цель: записать на консультацию, получить контакты для расчета, продать товар].

КЛЮЧЕВЫЕ ПРЕИМУЩЕСТВА (УТП), КОТОРЫЕ НУЖНО ПОДЧЕРКИВАТЬ:
- [УТП 1 из текста]
- [УТП 2 из текста]

ОТРАБОТКА ВОЗРАЖЕНИЙ:
- Если клиент говорит "Дорого": [Ответ на основе качества/скидок из текста]
- Если клиент сомневается: [Предложи бесплатный аудит/замер/консультацию]

СТИЛЬ ПРОДАЖ:
Задавай квалифицирующие вопросы, не выдавай все цены сразу. Мягко веди к оставлению контактов.`
              },
              { role: 'user', content: sampleText }
            ]
          })
        })

        if (openRouterRes.ok) {
          const llmData = await openRouterRes.json()
          
          if (llmData.usage?.total_tokens) {
            totalParseTokens += llmData.usage.total_tokens
          }

          const generatedPrompt = llmData.choices?.[0]?.message?.content
          if (generatedPrompt) {
            finalPrompt = generatedPrompt.trim()
            await supabase
              .from('projects')
              .update({ system_prompt: finalPrompt })
              .eq('id', projectId)
          }
        }
      } catch (err) {
        console.error('Failed to auto-generate system prompt:', err)
      }
    }

    const chunks = splitIntoChunks(text)
    
    // Process chunks and generate embeddings
    for (const chunk of chunks) {
      const { embedding, usage: embedUsage } = await generateEmbedding(chunk)
      totalParseTokens += embedUsage
      
      const { error } = await supabase.from('documents').insert({
        project_id: projectId,
        content: chunk,
        embedding: embedding,
        metadata: { source: 'manual_upload', timestamp: new Date().toISOString() }
      })

      if (error) {
        console.error('Error inserting document chunk:', error)
      }
    }

    if (totalParseTokens > 0) {
      await supabase.rpc('increment_user_usage', {
        target_user_id: user.id,
        chat_tokens: 0,
        parse_tokens: totalParseTokens
      })
      await supabase.rpc('increment_project_usage', {
        target_project_id: projectId,
        chat_tokens: 0,
        parse_tokens: totalParseTokens
      })
    }

    return NextResponse.json({ success: true, chunksProcessed: chunks.length, generatedPrompt: finalPrompt })
  } catch (e: any) {
    console.error('Knowledge API Error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
