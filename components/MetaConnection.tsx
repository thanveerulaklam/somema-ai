'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { 
  Facebook, 
  Instagram, 
  Link, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Settings
} from 'lucide-react'

interface MetaPage {
  id: string
  name: string
  access_token?: string
  instagram_accounts: Array<{
    id: string
    username: string
    name?: string
  }>
}

interface ConnectedAccount {
  pageId: string
  instagramId: string
}

interface MetaConnectionProps {
  onConnected?: (pages: MetaPage[]) => void
}

export default function MetaConnection({ onConnected }: MetaConnectionProps) {
  const [available, setAvailable] = useState<MetaPage[]>([])
  const [connected, setConnected] = useState<ConnectedAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [debug, setDebug] = useState<any>(null)

  useEffect(() => {
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      console.log('Fetching Meta connections for user:', user.id)
      
      const response = await fetch('/api/meta/connect', {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch Meta connections')
      }
      
      const data = await response.json()
      console.log('Meta connections data:', data)
      
      setAvailable(data.available || [])
      setConnected(data.connected || [])
      setDebug(data.debug || null)
      
      console.log('Available pages:', data.available?.length || 0)
      console.log('Connected accounts:', data.connected?.length || 0)
    } catch (err: any) {
      console.error('Error fetching Meta connections:', err)
      setError(err.message || 'Failed to fetch Meta connections')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (pageId: string, instagramId: string) => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      const response = await fetch('/api/meta/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({ pageId, instagramId })
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to connect')
      }
      setSuccess('Connected successfully!')
      fetchConnections()
    } catch (err: any) {
      setError(err.message || 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async (pageId: string, instagramId: string) => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      const response = await fetch('/api/meta/connect', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({ pageId, instagramId })
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to disconnect')
      }
      setSuccess('Disconnected successfully!')
      fetchConnections()
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnectAll = async () => {
    if (!window.confirm('Are you sure you want to disconnect all accounts?')) return;
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      // Clear all connections in DB
      const { error } = await supabase
        .from('user_profiles')
        .update({ meta_credentials: { ...{} } })
        .eq('user_id', user.id)
      if (error) throw error
      setConnected([])
      setSuccess('All accounts disconnected!')
      fetchConnections()
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect all')
    } finally {
      setLoading(false)
    }
  }

  const handleReconnectMeta = () => {
    window.location.href = '/api/meta/oauth'
  }

  const isConnected = (pageId: string, instagramId: string) => {
    return connected.some(
      (c) => c.pageId === pageId && c.instagramId === instagramId
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnectAll}
          disabled={loading || connected.length === 0}
        >
          Disconnect All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReconnectMeta}
          disabled={loading}
        >
          Reconnect Meta
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchConnections}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-green-800 text-sm">{success}</div>
      )}
      {loading && (
        <div className="mb-2 flex items-center text-gray-500"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...</div>
      )}
      
      {/* Connection Summary */}
      {!loading && available.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              <strong>Connection Summary:</strong> {connected.length} of {available.reduce((total, page) => total + (page.instagram_accounts?.length || 0), 0)} Instagram accounts connected
            </div>
            <div className="text-xs text-blue-600">
              {available.length} Facebook Pages found
            </div>
          </div>
        </div>
      )}
      <div className="space-y-6">
        {available.length === 0 && (
          <div className="text-gray-500">No Facebook Pages or Instagram accounts found.</div>
        )}
        {available.map((page) => (
          <div key={page.id} className="border rounded p-4 mb-2 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Facebook className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">{page.name}</span>
                <span className="text-sm text-gray-500">(ID: {page.id})</span>
              </div>
            </div>
            <div className="ml-7 mt-2 space-y-2">
              {page.instagram_accounts && page.instagram_accounts.length > 0 ? (
                page.instagram_accounts.map((insta) => (
                  <div key={insta.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Instagram className="h-4 w-4 text-pink-500" />
                      <span className="text-gray-800">{insta.username}</span>
                      <span className="text-sm text-gray-500">(ID: {insta.id})</span>
                    </div>
                    {isConnected(page.id, insta.id) ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Connected</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDisconnect(page.id, insta.id)}
                          disabled={loading}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(page.id, insta.id)}
                        disabled={loading}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1 text-yellow-500" />
                  No Instagram business account linked to this page.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {debug && (
        <details className="mt-4 bg-gray-100 rounded p-2 text-xs">
          <summary className="cursor-pointer font-semibold">Show Raw Meta API Debug Output</summary>
          <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(debug, null, 2)}</pre>
        </details>
      )}
    </div>
  )
} 