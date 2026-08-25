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
      supabase.from('projects').select('user_id').eq('id', projectId).single(),
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

    const chunks = splitIntoChunks(text)
    
    // Process chunks and generate embeddings
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk)
      
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

    return NextResponse.json({ success: true, chunksProcessed: chunks.length })
  } catch (e: any) {
    console.error('Knowledge API Error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
