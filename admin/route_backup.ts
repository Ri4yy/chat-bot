import { NextResponse } from 'next/server'
// @ts-expect-error: pdf-parse types do not specify a default export
import pdfParse from 'pdf-parse'
import * as xlsx from 'xlsx'

import fs from 'fs'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    let text = ''

    const name = file.name.toLowerCase()
    
    // PDF Parsing
    if (name.endsWith('.pdf')) {
      const data = await pdfParse(buffer)
      text = data.text
    } 
    // Excel Parsing
    else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      
      // Convert to CSV string, which is great for LLM context
      text = xlsx.utils.sheet_to_csv(sheet)
    } 
    // SQL Parsing (Basic Cleanup)
    else if (name.endsWith('.sql')) {
      text = buffer.toString('utf-8')
    }
    // Markdown, TXT, CSV, etc (Fallback to raw text)
    else {
      text = buffer.toString('utf-8')
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Could not extract text from file' }, { status: 400 })
    }

    return NextResponse.json({ text: text.trim() })
  } catch (e: any) {
    console.error('File parse error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
