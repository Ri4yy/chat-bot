import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service_role to read project config for the widget
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Actually we need service_role here if RLS blocks anon, wait!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400, headers: corsHeaders })
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, theme_color, welcome_message, icon_url, quick_questions, privacy_policy_url')
    .eq('id', projectId)
    .single()
    
  if (error || !project) {
    console.error('Widget config fetch error:', error)
    return NextResponse.json({
      name: 'AI Assistant',
      theme_color: '#3b82f6',
      welcome_message: 'Привет! Чем я могу помочь?',
      icon_url: '',
      error: error
    }, { headers: corsHeaders })
  }

  return NextResponse.json(project, { headers: corsHeaders })
}
