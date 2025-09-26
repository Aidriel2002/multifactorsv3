// utils/performance-helpers.ts
import { supabase } from '@/app/lib/supabase/client'

// Performance monitoring utility
export const measurePerformance = (label: string) => {
  const start = performance.now()
  console.log(`🚀 Starting ${label}`)
  
  return {
    end: () => {
      const duration = performance.now() - start
      console.log(`✅ ${label} completed in ${duration.toFixed(2)}ms`)
      
      if (duration > 1000) {
        console.warn(`⚠️ Slow operation detected: ${label} took ${duration.toFixed(2)}ms`)
      }
      
      return duration
    }
  }
}

export const fetchUsersOptimized = async (options: {
  page?: number
  limit?: number
  searchTerm?: string
  role?: string
  status?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
} = {}) => {
  const perf = measurePerformance('fetchUsersOptimized')
  
  try {
    const {
      page = 1,
      limit = 50,
      searchTerm = '',
      role = 'all',
      status = 'all',
      sortField = 'created_at',
      sortDirection = 'desc'
    } = options

    // Build query with specific columns only
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        status,
        created_at,
        last_active
      `, { count: 'exact' }) // Get total count for pagination

    // Apply filters
    if (role !== 'all') {
      query = query.eq('role', role)
    }
    
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply search with indexed columns
    if (searchTerm) {
      query = query.or(`
        email.ilike.%${searchTerm}%,
        first_name.ilike.%${searchTerm}%,
        last_name.ilike.%${searchTerm}%
      `)
    }

    // Apply sorting
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const result = await query

    if (result.error) {
      throw result.error
    }

    perf.end()
    
    return {
      data: result.data || [],
      count: result.count || 0,
      page,
      totalPages: Math.ceil((result.count || 0) / limit)
    }
  } catch (error) {
    perf.end()
    console.error('Error fetching users:', error)
    throw error
  }
}

// Database health check
export const checkDatabaseHealth = async () => {
  const checks = []
  
  try {
    // Test basic connection
    const connTest = measurePerformance('Database Connection Test')
    const { data, error } = await supabase.from('profiles').select('id').limit(1)
    connTest.end()
    
    checks.push({
      name: 'Database Connection',
      status: error ? 'FAILED' : 'PASSED',
      error: error?.message
    })

    const queryTest = measurePerformance('Query Performance Test')
    const { data: profiles, error: queryError } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .limit(10)
    queryTest.end()
    
    checks.push({
      name: 'Query Performance',
      status: queryError ? 'FAILED' : 'PASSED',
      error: queryError?.message,
      recordCount: profiles?.length || 0
    })

  } catch (error) {
    checks.push({
      name: 'General Database Health',
      status: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return checks
}

export const checkNetworkHealth = async () => {
  const start = performance.now()
  
  try {
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      cache: 'no-cache'
    })
    
    const duration = performance.now() - start
    
    return {
      status: response.ok ? 'HEALTHY' : 'SLOW',
      latency: duration,
      message: duration > 2000 ? 'High network latency detected' : 'Network is healthy'
    }
  } catch (error) {
    return {
      status: 'FAILED',
      latency: performance.now() - start,
      message: 'Network connectivity issues detected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}