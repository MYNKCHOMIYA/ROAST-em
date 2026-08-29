'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: { handle?: string; bio?: string; avatar_url?: string }) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized. Please log in.' }
  }

  // Check if handle is unique (only if handle is being updated)
  if (data.handle) {
    if (data.handle.length < 3) {
      return { error: 'Handle must be at least 3 characters long.' }
    }
    if (!/^[a-zA-Z0-9_]+$/.test(data.handle)) {
      return { error: 'Handle can only contain letters, numbers, and underscores.' }
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', data.handle)
      .single()

    if (existingProfile && existingProfile.id !== user.id) {
      return { error: 'This handle is already taken.' }
    }
  }

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      ...(data.handle && { handle: data.handle }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.avatar_url && { avatar_url: data.avatar_url }),
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/profile')
  revalidatePath('/feed')
  
  return { success: true }
}

export async function scheduleAccountDeletion() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized.' }
  }

  // Use DB function: soft delete (15-day grace period)
  const { error } = await supabase.rpc('soft_delete_account')
  if (error) return { error: error.message }

  await supabase.auth.signOut()
  return { success: true }
}

export async function hardDeleteAccount() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized.' }
  }

  const { error } = await supabase.rpc('hard_delete_account')
  if (error) return { error: error.message }

  // Delete auth user session
  await supabase.auth.signOut()
  return { success: true }
}

export async function restoreAccount() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized.' }
  }

  const { error } = await supabase.rpc('restore_account')
  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}
