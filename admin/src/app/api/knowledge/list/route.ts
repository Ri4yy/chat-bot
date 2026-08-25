import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
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
      
      if (member && (member.permissions?.includes('knowledge') || member.permissions?.includes('memory_view') || member.permissions?.includes('memory_delete'))) {
        hasPermission = true
      }
    }

    if (!hasPermission) return NextResponse.json({ error: 'Unauthorized: missing permissions' }, { status: 403 })

    // Fetch documents (without the heavy embedding column)
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, content, metadata, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ documents })
  } catch (e: any) {
    console.error('Knowledge API List Error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
