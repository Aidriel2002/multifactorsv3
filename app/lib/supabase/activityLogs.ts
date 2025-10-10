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

// ============================================
// QUOTATION ACTIVITY LOG HELPERS
// ============================================

/**
 * Log when a quotation is created
 */
export async function logQuotationCreated(quotationData: {
  refNo: string
  clientName: string
  subject?: string
  grandTotal: string
  projectRef?: string
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('No authenticated user for quotation log')
      return null
    }

    const detailsParts = [
      quotationData.clientName,
      quotationData.subject,
      `Total: ₱${quotationData.grandTotal}`,
      quotationData.projectRef ? `Project: ${quotationData.projectRef}` : null
    ].filter(Boolean)

    const details = `${quotationData.refNo} - ${detailsParts.join(' | ')}`

    const log = await createActivityLog({
      userId: user.id,
      action: 'Created Quotation',
      details,
      metadata: {
        quotation_ref: quotationData.refNo,
        client_name: quotationData.clientName,
        grand_total: quotationData.grandTotal,
        project_ref: quotationData.projectRef || null
      }
    })

    return log
  } catch (error) {
    console.error('Error logging quotation creation:', error)
    return null
  }
}

/**
 * Log when a quotation is updated
 */
export async function logQuotationUpdated(quotationData: {
  refNo: string
  clientName: string
  changes?: string
  grandTotal?: string
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('No authenticated user for quotation log')
      return null
    }

    const detailsParts = [
      quotationData.clientName,
      quotationData.changes,
      quotationData.grandTotal ? `Total: ₱${quotationData.grandTotal}` : null
    ].filter(Boolean)

    const details = `${quotationData.refNo} - ${detailsParts.join(' | ')}`

    const log = await createActivityLog({
      userId: user.id,
      action: 'Updated Quotation',
      details,
      metadata: {
        quotation_ref: quotationData.refNo,
        client_name: quotationData.clientName,
        changes: quotationData.changes || null
      }
    })

    return log
  } catch (error) {
    console.error('Error logging quotation update:', error)
    return null
  }
}

/**
 * Log when a quotation is deleted
 */
export async function logQuotationDeleted(quotationData: {
  refNo: string
  clientName: string
  grandTotal?: string
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('No authenticated user for quotation log')
      return null
    }

    const detailsParts = [
      quotationData.clientName,
      quotationData.grandTotal ? `Total: ₱${quotationData.grandTotal}` : null
    ].filter(Boolean)

    const details = `${quotationData.refNo} - ${detailsParts.join(' | ')}`

    const log = await createActivityLog({
      userId: user.id,
      action: 'Deleted Quotation',
      details,
      metadata: {
        quotation_ref: quotationData.refNo,
        client_name: quotationData.clientName
      }
    })

    return log
  } catch (error) {
    console.error('Error logging quotation deletion:', error)
    return null
  }
}

/**
 * Log when a quotation is viewed/downloaded
 */
export async function logQuotationViewed(quotationData: {
  refNo: string
  clientName: string
  action: 'Viewed' | 'Downloaded' | 'Printed'
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('No authenticated user for quotation log')
      return null
    }

    const details = `${quotationData.refNo} - ${quotationData.clientName}`

    const log = await createActivityLog({
      userId: user.id,
      action: `${quotationData.action} Quotation`,
      details,
      metadata: {
        quotation_ref: quotationData.refNo,
        client_name: quotationData.clientName,
        view_action: quotationData.action
      }
    })

    return log
  } catch (error) {
    console.error('Error logging quotation view:', error)
    return null
  }
}

/**
 * Log when quotation status changes
 */
export async function logQuotationStatusChange(quotationData: {
  refNo: string
  clientName: string
  oldStatus?: string
  newStatus: string
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('No authenticated user for quotation log')
      return null
    }

    const statusChange = quotationData.oldStatus 
      ? `${quotationData.oldStatus} → ${quotationData.newStatus}`
      : quotationData.newStatus

    const details = `${quotationData.refNo} - ${quotationData.clientName} | Status: ${statusChange}`

    const log = await createActivityLog({
      userId: user.id,
      action: 'Changed Quotation Status',
      details,
      metadata: {
        quotation_ref: quotationData.refNo,
        client_name: quotationData.clientName,
        old_status: quotationData.oldStatus || null,
        new_status: quotationData.newStatus
      }
    })

    return log
  } catch (error) {
    console.error('Error logging quotation status change:', error)
    return null
  }
}