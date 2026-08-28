import { createClient } from '@/lib/supabase/server'
import ProfileDropdown from '@/components/ui/profile-dropdown'

import { ThemeToggle } from '@/components/theme-toggle'

export async function HeaderProfile() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: limitData } = await supabase
    .from('user_limits')
    .select('is_super_admin')
    .eq('user_id', user.id)
    .single()

  const isSuperAdmin = limitData?.is_super_admin || false
  const email = user.email || ''
  
  // Extract name from email if no metadata
  const name = user.user_metadata?.full_name || email.split('@')[0] || 'Пользователь'
  
  // Use a modern clean avatar placeholder with initials if no real avatar is present
  const avatar = user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=27272a&textColor=f4f4f5`

  const profileData = {
    name,
    email,
    avatar
  }

  return (
    <div className="flex items-center gap-4">
      <ThemeToggle />
      <ProfileDropdown data={profileData} isSuperAdmin={isSuperAdmin} />
    </div>
  )
}
