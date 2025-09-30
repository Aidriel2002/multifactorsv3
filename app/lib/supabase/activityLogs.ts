import { supabase } from './client'

export type ActivityLog = {
  id: string
  user_id: string
  action: string
  details?: string | null
  created_at: string
  metadata?: Record<string, unknown> | null
  user_email?: string | null
  user_full_name?: string | null
  user_avatar_url?: string | null
}

export type CreateActivityInput = {
  userId: string
  action: string
  details?: string
  metadata?: Record<string, unknown>
  userEmail?: string
  userFullName?: string
  userAvatarUrl?: string
}

export async function createActivityLog(input: CreateActivityInput) {
  const { userId, action, details, metadata } = input

  let userEmail = input.userEmail ?? null
  let userFullName = input.userFullName ?? null
  let userAvatarUrl = input.userAvatarUrl ?? null

  if (!userEmail || !userFullName || !userAvatarUrl) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, avatar_url')
      .eq('id', userId)
      .maybeSingle()
    if (profile) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p: any = profile
      userEmail = userEmail ?? p.email ?? null
      userFullName = userFullName ?? p.full_name ?? null
      userAvatarUrl = userAvatarUrl ?? p.avatar_url ?? null
    }
  }

  const payload = {
    user_id: userId,
    action,
    details: details ?? null,
    metadata: metadata ?? null,
    created_at: new Date().toISOString(),
    user_email: userEmail,
    user_full_name: userFullName,
    user_avatar_url: userAvatarUrl,
  }

  const { data, error } = await supabase
    .from('activity_logs')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data as ActivityLog
}

export async function listUserActivityLogs(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as ActivityLog[]
}

export async function listAllActivityLogs(limit = 200) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as ActivityLog[]
}


