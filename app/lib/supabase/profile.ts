import { supabase } from './client'
import { User } from '@supabase/supabase-js'

export async function ensureProfile(user: User) {
  try {
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    const userMetadata = user.user_metadata || {}
    const fullName = userMetadata.full_name || userMetadata.name || ''
    const firstName = userMetadata.first_name || userMetadata.given_name || fullName.split(' ')[0] || ''
    const lastName = userMetadata.last_name || userMetadata.family_name || fullName.split(' ').slice(1).join(' ') || ''

    if (!existingProfile) {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName || `${firstName} ${lastName}`.trim(),
          avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) throw insertError
      return newProfile
    }

    return existingProfile
  } catch (error) {
    console.error('Error in ensureProfile:', error)
    throw error
  }
}