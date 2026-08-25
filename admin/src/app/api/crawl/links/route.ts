import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let targetUrl: URL
    try {
      targetUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${response.statusText}` }, { status: response.status })
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const links = new Set<string>()

    // Add the root URL itself
    links.add(targetUrl.toString())

    $('a').each((_, element) => {
      const href = $(element).attr('href')
      if (!href) return

      try {
        // Resolve absolute URL
        const resolvedUrl = new URL(href, targetUrl.origin)
        
        // Only include internal links (same origin) and exclude anchors/assets
        if (
          resolvedUrl.origin === targetUrl.origin && 
          !resolvedUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|pdf|zip|mp4)$/i)
        ) {
          // Normalize URL by removing hash
          resolvedUrl.hash = ''
          links.add(resolvedUrl.toString())
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    })

    const uniqueLinks = Array.from(links).slice(0, 50) // Limit to 50 for safety

    return NextResponse.json({ links: uniqueLinks })
  } catch (e: any) {
    console.error('Crawl error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
