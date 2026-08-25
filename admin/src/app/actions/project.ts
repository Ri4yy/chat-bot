'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { encrypt } from '@/lib/encryption'

export async function createProject(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  if (!name) throw new Error('Name is required')

  // Check limits
  const [{ data: userLimit }, { count: projectsCount }] = await Promise.all([
    supabase.from('user_limits').select('max_projects').eq('user_id', user.id).single(),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  ])

  const maxProjects = userLimit?.max_projects || 0
  const currentCount = projectsCount || 0

  if (currentCount >= maxProjects) {
    throw new Error(`Вы достигли лимита проектов (${maxProjects}). Свяжитесь с администратором.`)
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name,
      user_id: user.id,
      theme_color: '#0f172a',
      welcome_message: 'Hi there! How can I help you today?',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating project:', error)
    throw new Error('Failed to create project')
  }

  revalidatePath('/')
  return data
}

export async function updateProjectSettings(projectId: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const theme_color = formData.get('theme_color') as string
  const welcome_message = formData.get('welcome_message') as string
  const system_prompt = formData.get('system_prompt') as string
  const tone = formData.get('tone') as string
  const rules = formData.getAll('rules') as string[]
  const openrouter_api_key = formData.get('openrouter_api_key') as string | null
  const icon = formData.get('icon') as File | null

  let icon_url = undefined

  if (icon && icon.size > 0) {
    const fileExt = icon.name.split('.').pop()
    const fileName = `${projectId}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('icons')
      .upload(fileName, icon, { upsert: true })

    if (uploadError) {
      console.error('Error uploading icon:', uploadError)
      throw new Error('Failed to upload icon')
    }

    const { data: publicUrlData } = supabase.storage
      .from('icons')
      .getPublicUrl(fileName)

    icon_url = publicUrlData.publicUrl
  }

  const updateData: any = { name, theme_color, welcome_message, system_prompt, tone, rules }
  if (icon_url !== undefined) {
    updateData.icon_url = icon_url
  }
  if (openrouter_api_key !== null && openrouter_api_key !== '********') {
    updateData.openrouter_api_key = openrouter_api_key.trim() ? encrypt(openrouter_api_key.trim()) : null
  }

  const { error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)

  if (error) {
    console.error('Update settings error:', error)
    throw new Error('Failed to update settings')
  }

  revalidatePath(`/project/${projectId}`)
}
