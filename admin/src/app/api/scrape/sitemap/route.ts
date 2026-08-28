import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(req: Request) {
  try {
    const { url, exclusions = [] } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'Sitemap URL is required' }, { status: 400 })
    }

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

    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch sitemap: ${response.statusText}` }, { status: response.status })
    }

    const xml = await response.text()
    // Parse XML using cheerio
    const $ = cheerio.load(xml, { xmlMode: true })
    const links = new Set<string>()

    // Функция проверки на исключения
    const isExcluded = (checkUrl: string) => {
      return exclusions.some((exclusion: string) => {
        if (!exclusion) return false
        if (exclusion.startsWith('/')) {
           return new URL(checkUrl).pathname.startsWith(exclusion)
        }
        return checkUrl.includes(exclusion)
      })
    }

    $('loc').each((_, element) => {
      const href = $(element).text()
      if (!href) return

      try {
        const resolvedUrl = new URL(href)
        
        // Normalize URL by removing hash
        resolvedUrl.hash = ''
        const finalStr = resolvedUrl.toString()
        
        if (!isExcluded(finalStr)) {
          links.add(finalStr)
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    })

    return NextResponse.json({ links: Array.from(links) })
  } catch (error: any) {
    console.error('Sitemap parse error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
