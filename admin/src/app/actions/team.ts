'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addTeamMember(projectId: string, emailOrId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check if owner
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== user.id) {
    throw new Error('Only the project owner can add team members')
  }

  let targetUserId = emailOrId

  // Check if it's an email
  if (emailOrId.includes('@')) {
    const { data: idData, error: idError } = await supabase
      .rpc('get_user_id_by_email', { email_to_search: emailOrId })
    
    if (idError || !idData) {
      throw new Error('Пользователь с таким email не найден')
    }
    targetUserId = idData
  }

  if (targetUserId === user.id) {
    throw new Error('Вы не можете добавить самого себя')
  }

  // Insert into project_members
  const { error } = await supabase
    .from('project_members')
    .insert({
      project_id: projectId,
      user_id: targetUserId,
      role: 'manager'
    })

  if (error) {
    if (error.code === '23505') {
      throw new Error('Пользователь уже добавлен в проект')
    }
    throw new Error('Ошибка добавления пользователя')
  }

  revalidatePath(`/project/${projectId}`)
  return { success: true }
}

export async function removeTeamMember(projectId: string, userId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check if owner
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== user.id) {
    throw new Error('Only the project owner can remove team members')
  }

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) {
    throw new Error('Ошибка удаления пользователя')
  }

  revalidatePath(`/project/${projectId}`)
  return { success: true }
}

export async function updateTeamMemberPermissions(projectId: string, userId: string, permissions: string[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check if owner
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== user.id) {
    throw new Error('Only the project owner can update permissions')
  }

  const { error } = await supabase
    .from('project_members')
    .update({ permissions })
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) {
    throw new Error('Ошибка обновления прав')
  }

  revalidatePath(`/project/${projectId}`)
  return { success: true }
}
