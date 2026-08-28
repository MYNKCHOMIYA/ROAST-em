'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Updates the authenticated user's password.
 */
export async function updatePassword(newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters long.' }
  }

  const supabase = await createClient()

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized. Please log in.' }
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

/**
 * Updates the user's email.
 */
export async function updateEmail(newEmail: string) {
  if (!newEmail || !newEmail.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized.' }
  }

  const { error } = await supabase.auth.updateUser({
    email: newEmail.trim()
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/profile/settings')
  return { success: true }
}
