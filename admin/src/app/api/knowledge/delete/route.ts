import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function DELETE(req: Request) {
  try {
    const { id, ids, projectId } = await req.json()

    if ((!id && (!ids || ids.length === 0)) || !projectId) {
      return NextResponse.json({ error: 'Missing document id/ids or projectId' }, { status: 400 })
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
      
      if (member && member.permissions?.includes('memory_delete')) {
        hasPermission = true
      }
    }

    if (!hasPermission) return NextResponse.json({ error: 'Unauthorized: missing memory_delete permission' }, { status: 403 })

    // Delete documents
    let query = supabase.from('documents').delete().eq('project_id', projectId)
    
    if (ids && Array.isArray(ids)) {
      query = query.in('id', ids)
    } else {
      query = query.eq('id', id)
    }

    const { error } = await query

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Knowledge API Delete Error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
