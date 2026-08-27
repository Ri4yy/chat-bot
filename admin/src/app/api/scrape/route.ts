import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    let targetUrl: URL
    try {
      targetUrl = new URL(url)
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

    // Жесткая зачистка часто встречающегося мусора (реквизиты, ИНН, ОГРН, адреса)
    text = text.replace(/Настоящий сайт является официальным сайтом.*?\d{13,15}/gi, '')
    text = text.replace(/ИНН:\s*\d+|ОГРН:\s*\d+/gi, '')
    text = text.replace(/428017, Чувашская Республика.*?\d{2}:\d{2}/gi, '')

    if (!text || text.length < 20) {
      return NextResponse.json({ error: 'No meaningful text content found on the page' }, { status: 400 })
    }

    // Add title as context if available
    if (article && article.title) {
      text = `[Название страницы: ${article.title}]\n\n${text}`
    }

    const { useLlm } = await req.json().catch(() => ({}))
    
    if (useLlm) {
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
          model: 'openai/gpt-5.6-luna',
          messages: [
            { 
              role: 'system', 
              content: 'Ты профессиональный парсер данных для базы знаний бота. Твоя задача — получить грязный текст веб-страницы и вернуть идеально структурированную и очищенную информацию в формате Markdown. \n\nСАМЫЕ ВАЖНЫЕ ПРАВИЛА (СТРОГО СОБЛЮДАТЬ!):\n1. УДАЛЯЙ ЛЮБУЮ общую юридическую информацию о компании (ИНН, ОГРН, адреса, фразы вроде "Настоящий сайт является официальным сайтом...", режим работы).\n2. УДАЛЯЙ элементы интерфейса (Размер шрифта, Цвет фона, кнопки "Заказать звонок", "Подать заявку").\n3. Если на странице есть только общая информация из подвала и нет уникального контента (статьи, описания товара/услуги), верни слово "NO_CONTENT" (без кавычек).\n4. Оставь ТОЛЬКО уникальный полезный текст: описание услуг, характеристики товаров, кейсы.\n5. НИКОГДА не дублируй общую информацию, которая есть на всех страницах сайта.' 
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
        // Проверяем, есть ли запись в таблице
        const { data: usageData } = await supabase.from('user_usage').select('tokens_used').eq('user_id', user.id).single()
        
        if (usageData) {
          await supabase.from('user_usage').update({ 
            tokens_used: usageData.tokens_used + tokensUsed,
            updated_at: new Date().toISOString()
          }).eq('user_id', user.id)
        } else {
          await supabase.from('user_usage').insert({ 
            user_id: user.id, 
            tokens_used: tokensUsed 
          })
        }
      }

      return NextResponse.json({ text: llmText, tokensUsed })
    }

    return NextResponse.json({ text })
  } catch (e: any) {
    console.error('Scraping error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
