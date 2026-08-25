'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserLimits(userId: string, data: { max_projects: number, is_super_admin: boolean, is_active: boolean }) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('Unauthorized')

  // Using the RPC function we created
  const { error } = await supabase.rpc('update_user_limit', {
    target_id: userId,
    max_p: data.max_projects,
    super_a: data.is_super_admin,
    active: data.is_active
  })

  if (error) {
    console.error('Update limits error:', error)
    throw new Error('Failed to update user limits')
  }

  revalidatePath('/superadmin/users/[id]', 'page')
  revalidatePath('/superadmin/users', 'page')
  revalidatePath('/superadmin', 'page')
}
