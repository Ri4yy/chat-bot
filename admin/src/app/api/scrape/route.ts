import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(req: Request) {
  try {
    const { url, projectId } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    let targetUrl: URL
    try {
      let finalUrl = url.trim()
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl
      }
      targetUrl = new URL(finalUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Fetch HTML
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${response.statusText}` }, { status: response.status })
    }

    const html = await response.text()
    
    // Предварительная агрессивная очистка через Cheerio
    const $ = require('cheerio').load(html)
    $('script, style, noscript, iframe, img, svg, nav, footer, header, aside, form, .menu, .sidebar, .header, .footer, .nav, .bvi-panel, .bvi-body, [role="navigation"], [role="banner"], [role="contentinfo"], .footer-wrapper, .header-wrapper, #footer, #header').remove()
    const cleanedHtml = $.html()

    // Parse with JSDOM
    const { JSDOM } = require('jsdom')
    const { Readability } = require('@mozilla/readability')

    const doc = new JSDOM(cleanedHtml, { url: url })
    
    // Create a new Readability object and parse the document
    const reader = new Readability(doc.window.document)
    const article = reader.parse()

    let text = ''
    
    if (article && article.textContent) {
      text = article.textContent.replace(/\s+/g, ' ').trim()
    } else {
      // Fallback: if Readability fails to find an article, just use body text
      text = $('body').text().replace(/\s+/g, ' ').trim()
    }

    if (!text || text.length < 20) {
      return NextResponse.json({ error: 'No meaningful text content found on the page' }, { status: 400 })
    }

    // Add title as context if available
    if (article && article.title) {
      text = `[Название страницы: ${article.title}]\n\n${text}`
    }

    // Включаем ИИ-обработку принудительно
    // Инициализируем Supabase, чтобы списать токены
    const { createServerClient } = require('@supabase/ssr')
    const { cookies } = require('next/headers')
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {}
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized to use AI parsing' }, { status: 401 })
    }

    // Отправляем в OpenRouter
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
            content: `Ты эксперт по извлечению и структурированию данных для векторной базы знаний (RAG) ИИ-ассистента. 
Твоя задача — получить сырой грязный текст веб-страницы и вернуть ИДЕАЛЬНО структурированную выжимку фактов в Markdown.

ПРАВИЛА ОЧИСТКИ (КРИТИЧНО!):
1. УДАЛЯЙ весь мусор интерфейса: кнопки, меню, футеры, "оставить заявку", "политика конфиденциальности", юридические данные (ИНН, ОГРН, адреса, если это не страница контактов).
2. Оставь ТОЛЬКО смысловое ядро: описания услуг, цены, характеристики товаров, инструкции, ответы на вопросы, кейсы.
3. Если на странице нет ничего, кроме базовых фраз (пустая страница), верни ровно одно слово "NO_CONTENT".

ПРАВИЛА ФОРМАТИРОВАНИЯ:
1. Выдавай результат в виде связного текста, разбитого на четкие логические блоки с заголовками H2/H3.
2. Формулируй утвердительно и емко. (Например: "Компания занимается..." вместо "Мы занимаемся...").
3. Не пиши в начале "Вот структурированные данные..." — сразу выдавай полезный текст.` 
          },
          { role: 'user', content: text }
        ]
      })
    })

    if (!openRouterRes.ok) {
      console.error('LLM parsing failed:', await openRouterRes.text())
      // Возвращаем обычный текст, если ИИ упал
      return NextResponse.json({ text, warning: 'AI parsing failed, used raw text.' })
    }

    const llmData = await openRouterRes.json()
    let llmText = llmData.choices?.[0]?.message?.content || text
    const tokensUsed = llmData.usage?.total_tokens || 0

    // Если ИИ решил, что на странице нет контента
    if (llmText.includes('NO_CONTENT')) {
      return NextResponse.json({ error: 'Page has no meaningful unique content' }, { status: 400 })
    }

    // Списываем токены
    if (tokensUsed > 0) {
      await supabase.rpc('increment_user_usage', {
        target_user_id: user.id,
        chat_tokens: 0,
        parse_tokens: tokensUsed
      })

      if (projectId) {
        await supabase.rpc('increment_project_usage', {
          target_project_id: projectId,
          chat_tokens: 0,
          parse_tokens: tokensUsed
        })
      }
    }

    return NextResponse.json({ text: llmText, tokensUsed })
  } catch (e: any) {
    console.error('Scraping error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
