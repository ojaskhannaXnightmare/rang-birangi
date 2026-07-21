'use client'

import { useEffect, useState } from 'react'
import { Check, X, Star, MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/helpers'

export function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replying, setReplying] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  const load = async () => {
    try {
      const r = await fetch('/api/admin/reviews')
      const d = await r.json()
      setReviews(d.reviews || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleUpdate = async (id: string, status?: string, adminReply?: string) => {
    setUpdating(true)
    const body: any = { id }
    if (status) body.status = status
    if (adminReply !== undefined) body.adminReply = adminReply
    const res = await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast({ title: 'Review updated' })
      setReplying(null)
      setReplyText('')
      load()
    }
    setUpdating(false)
  }

  const pending = reviews.filter((r) => r.status === 'PENDING')
  const approved = reviews.filter((r) => r.status === 'APPROVED')
  const rejected = reviews.filter((r) => r.status === 'REJECTED')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-display font-bold">Reviews ({reviews.length})</h2>
        <p className="text-sm text-muted-foreground">
          {pending.length} pending · {approved.length} approved · {rejected.length} rejected
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-8 rounded-xl glass border border-gold/20 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 rounded-xl glass border border-gold/10">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-luxe-gradient flex items-center justify-center">
                    <span className="text-accent font-bold text-sm">
                      {(r.user?.name || 'A')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{r.user?.name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${s <= r.rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
                      />
                    ))}
                  </div>
                  <Badge variant="outline" className={
                    r.status === 'APPROVED' ? 'text-green-400' :
                    r.status === 'PENDING' ? 'text-yellow-400' : 'text-red-400'
                  }>
                    {r.status}
                  </Badge>
                </div>
              </div>

              {r.product && (
                <p className="text-xs text-muted-foreground mb-2">
                  On: <span className="text-foreground">{r.product.name}</span>
                </p>
              )}

              {r.title && <p className="font-medium text-sm mb-1">{r.title}</p>}
              <p className="text-sm text-muted-foreground mb-3">{r.comment}</p>

              {r.adminReply && (
                <div className="mt-2 p-2 rounded-lg bg-secondary/30 border-l-2 border-accent">
                  <p className="text-xs text-accent font-medium mb-1">Your Reply:</p>
                  <p className="text-xs text-muted-foreground">{r.adminReply}</p>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                {r.status !== 'APPROVED' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(r.id, 'APPROVED')}
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                )}
                {r.status !== 'REJECTED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdate(r.id, 'REJECTED')}
                    disabled={updating}
                    className="text-red-400 border-red-400/30"
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplying(replying === r.id ? null : r.id)
                    setReplyText(r.adminReply || '')
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1" /> Reply
                </Button>
              </div>

              {replying === r.id && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    className="bg-secondary/50"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(r.id, undefined, replyText)}
                    disabled={updating}
                    className="bg-luxe-gradient"
                  >
                    {updating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
                    Save Reply
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
