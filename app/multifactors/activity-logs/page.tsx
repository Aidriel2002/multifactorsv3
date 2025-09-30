'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase/client'
import { listAllActivityLogs, ActivityLog } from '@/app/lib/supabase/activityLogs'

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('You must be signed in to view activity logs.')
          setLogs([])
          return
        }
        setUserId(user.id)
        const data = await listAllActivityLogs(200)
        if (isMounted) setLogs(data)
      } catch (e: any) {
        if (isMounted) setError(e?.message || 'Failed to load activity logs')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()

    // Live updates via realtime on table
    const channel = supabase
      .channel('activity-logs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, (payload) => {
        if (payload.new) {
          setLogs((prev) => {
            const next = [payload.new as ActivityLog, ...prev]
            return next.slice(0, 200)
          })
          setCurrentPage(1)
        }
      })
      .subscribe()

    return () => {
      isMounted = false
      channel.unsubscribe()
    }
  }, [userId])

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const pageLogs = logs.slice(startIndex, endIndex)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1)
  }, [logs, currentPage, totalPages])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Activity Logs</h1>

      {loading && <div className="text-sm text-gray-500">Loading...</div>}
      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Time</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">User</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Action</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-gray-500" colSpan={3}>No activity yet.</td>
                </tr>
              )}
              {pageLogs.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {log.user_avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={log.user_avatar_url} alt="" className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-gray-900">{log.user_full_name || '—'}</span>
                        <span className="text-gray-500 text-xs">{log.user_email || ''}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="px-4 py-3 text-gray-600">{log.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && logs.length > pageSize && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {startIndex + 1}-{Math.min(endIndex, logs.length)} of {logs.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map((p) => (
                <button
                  key={p}
                  className={`px-3 py-1 border rounded ${p === currentPage ? 'bg-gray-100 font-medium' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              {totalPages > 7 && <span className="px-2">…</span>}
            </div>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


