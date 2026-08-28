import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as xlsx from 'xlsx'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null

    if (!file || !projectId) {
      return NextResponse.json({ error: 'File and projectId are required' }, { status: 400 })
    }

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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Parse Excel/CSV
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const workbook = xlsx.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Parse to JSON. Expecting headers like: Name, Description, Price, URL, Category, Image
    const data: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: null })

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Файл пуст или имеет неверный формат' }, { status: 400 })
    }

    // Map to db schema
    const productsToInsert = data.map(row => {
      // Пытаемся найти подходящие столбцы, даже если они названы по-разному (case-insensitive)
      const getVal = (keys: string[]) => {
        for (const key of keys) {
          const found = Object.keys(row).find(k => k.toLowerCase().includes(key.toLowerCase()))
          if (found && row[found] !== null && row[found] !== undefined) return String(row[found]).trim()
        }
        return null
      }

      const name = getVal(['name', 'название', 'наименование', 'товар', 'title'])
      const description = getVal(['desc', 'описание', 'характеристик'])
      let priceStr = getVal(['price', 'цена', 'стоимость'])
      let price = null
      if (priceStr) {
        // Очищаем от нецифровых символов (оставляем только цифры и точку)
        priceStr = priceStr.replace(/[^0-9.,]/g, '').replace(',', '.')
        if (!isNaN(parseFloat(priceStr))) price = parseFloat(priceStr)
      }

      return {
        project_id: projectId,
        name: name || 'Без названия',
        description: description,
        price: price,
        category: getVal(['cat', 'категория', 'раздел']),
        url: getVal(['url', 'link', 'ссылка']),
        image_url: getVal(['image', 'img', 'фото', 'картинка'])
      }
    })

    // Batch insert
    const { error } = await supabase
      .from('products')
      .insert(productsToInsert)

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: 'Failed to insert products' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      count: productsToInsert.length 
    })

  } catch (error: any) {
    console.error('File parsing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
