
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Download, RefreshCw, User, Bot, AlertTriangle, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ChatLogEntry {
  id?: number
  userId: number
  sessionId?: string
  messageType: 'user' | 'assistant' | 'system'
  content: string
  metadata?: any
  timestamp: string
}

export default function ChatLogsPage() {
  const [logs, setLogs] = useState<ChatLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'fallback' | 'errors'>('all')
  const { toast } = useToast()

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/chat-logs?limit=200')
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch chat logs',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const exportLogs = async () => {
    try {
      const response = await fetch('/api/chat-logs/export')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-logs-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: 'Success',
        description: 'Chat logs exported successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export chat logs',
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(log => {
    if (filter === 'fallback') return log.metadata?.fallbackUsed
    if (filter === 'errors') return log.metadata?.errorRecovered
    return true
  })

  const getMessageIcon = (type: string, metadata?: any) => {
    if (type === 'user') return <User className="w-4 h-4" />
    if (metadata?.fallbackUsed) return <AlertTriangle className="w-4 h-4 text-orange-500" />
    if (metadata?.errorRecovered) return <AlertTriangle className="w-4 h-4 text-red-500" />
    return <Bot className="w-4 h-4 text-blue-500" />
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Chat Logs</h1>
          <p className="text-muted-foreground">
            Review AI personality training conversations for improvements
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchLogs}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
        >
          All ({logs.length})
        </Button>
        <Button
          onClick={() => setFilter('fallback')}
          variant={filter === 'fallback' ? 'default' : 'outline'}
          size="sm"
        >
          Fallbacks ({logs.filter(l => l.metadata?.fallbackUsed).length})
        </Button>
        <Button
          onClick={() => setFilter('errors')}
          variant={filter === 'errors' ? 'default' : 'outline'}
          size="sm"
        >
          Errors ({logs.filter(l => l.metadata?.errorRecovered).length})
        </Button>
      </div>

      <div className="space-y-4">
        {filteredLogs.map((entry, index) => (
          <Card key={index} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getMessageIcon(entry.messageType, entry.metadata)}
                  <CardTitle className="text-sm font-medium">
                    {entry.messageType === 'user' ? 'User' : 'AI Assistant'}
                  </CardTitle>
                  {entry.metadata?.personaMode && (
                    <Badge variant="secondary" className="text-xs">
                      {entry.metadata.personaMode}
                    </Badge>
                  )}
                  {entry.metadata?.fallbackUsed && (
                    <Badge variant="destructive" className="text-xs">
                      Fallback
                    </Badge>
                  )}
                  {entry.metadata?.errorRecovered && (
                    <Badge variant="destructive" className="text-xs">
                      Error Recovered
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                value={entry.content}
                readOnly
                className="min-h-[60px] mb-3 bg-muted/50"
              />
              
              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Metadata ({Object.keys(entry.metadata).length} fields)
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {JSON.stringify(entry.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && !loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No chat logs found</h3>
              <p className="text-muted-foreground">
                Start a personality training session to see logs here
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
