'use client'

import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { relativeTime } from '@/lib/helpers'

const ACTION_COLORS: Record<string, string> = {
  ADMIN_LOGIN: 'bg-blue-500/20 text-blue-300',
  PRODUCT_CREATED: 'bg-green-500/20 text-green-300',
  PRODUCT_UPDATED: 'bg-yellow-500/20 text-yellow-300',
  PRODUCT_DELETED: 'bg-red-500/20 text-red-300',
  ORDER_CREATED: 'bg-purple-500/20 text-purple-300',
  ORDER_UPDATED: 'bg-cyan-500/20 text-cyan-300',
  HOMEPAGE_UPDATED: 'bg-orange-500/20 text-orange-300',
  REVIEW_UPDATED: 'bg-pink-500/20 text-pink-300',
}

export function AdminActivity() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/activity')
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs || [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-display font-bold">Activity Log</h2>
        <p className="text-sm text-muted-foreground">Recent system activity</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 rounded-xl glass border border-gold/20 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No activity recorded.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl glass border border-gold/10">
              <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={ACTION_COLORS[log.action] || 'bg-gray-500/20 text-gray-300'}>
                    {log.action.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-sm font-medium">{log.user?.name || 'System'}</span>
                  <span className="text-xs text-muted-foreground">{relativeTime(log.createdAt)}</span>
                </div>
                {log.entity && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Entity: {log.entity} {log.entityId && `· ID: ${log.entityId.slice(-8)}`}
                  </p>
                )}
                {log.metadata && log.metadata !== '{}' && (
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    {log.metadata}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
