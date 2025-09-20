'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { 
  Facebook, 
  Instagram, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Calendar,
  Image as ImageIcon
} from 'lucide-react'

interface MetaPage {
  id: string
  name: string
  access_token: string
  instagram_accounts: Array<{
    id: string
    username: string
    name: string
  }>
}

interface MetaPostingProps {
  caption: string
  hashtags: string[]
  mediaUrl?: string
  mediaUrls?: string[]
  postId?: string
  onPosted?: (result: any) => void
}

export default function MetaPosting({ 
  caption, 
  hashtags, 
  mediaUrl, 
  mediaUrls, 
  postId, 
  onPosted 
}: MetaPostingProps) {
  const [pages, setPages] = useState<MetaPage[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'instagram' | 'both'>('instagram')
  const [selectedPage, setSelectedPage] = useState<string>('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadMetaPages()
  }, [])

  const loadMetaPages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/meta/connect', {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // The API returns 'available' array, not 'pages'
        const availablePages = data.available || []
        setPages(availablePages)
        
        // Auto-select first page if available
        if (availablePages.length > 0) {
          setSelectedPage(availablePages[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading Meta pages:', error)
    }
  }

  const handlePost = async () => {
    if (!selectedPage) {
      setError('Please select a Facebook page')
      return
    }

    if (!caption.trim()) {
      setError('Please enter a caption')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const response = await fetch('/api/meta/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({
          caption,
          hashtags,
          mediaUrl,
          mediaUrls,
          scheduledTime: scheduledTime || undefined,
          platform: selectedPlatform,
          postId,
          selectedPageId: selectedPage
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post to Meta platforms')
      }

      setSuccess(
        selectedPlatform === 'both' 
          ? 'Content posted to Instagram and Facebook!'
          : 'Content posted to Instagram!'
      )
      
      onPosted?.(data.result)
      
      // Reset form
      setScheduledTime('')
    } catch (error: any) {
      setError(error.message || 'Failed to post to Meta platforms')
    } finally {
      setLoading(false)
    }
  }

  const getDefaultScheduledTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 30) // Schedule 30 minutes from now
    return now.toISOString().slice(0, 16) // Format for datetime-local input
  }

  if (pages.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <p className="text-yellow-800 text-sm">
            No Instagram accounts connected. Please connect your Instagram business account first.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center space-x-2 mb-4">
          <Instagram className="h-5 w-5 text-pink-600" />
          <h3 className="text-lg font-medium text-gray-900">Post to Instagram</h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platform
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'instagram', name: 'Instagram Only', icon: Instagram, color: 'text-pink-600', description: 'Primary platform for Indian businesses' },
              { id: 'both', name: 'Instagram + Facebook', icon: Send, color: 'text-purple-600', description: 'Post to both platforms' }
            ].map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id as any)}
                className={`p-4 border-2 rounded-lg transition-colors text-left ${
                  selectedPlatform === platform.id
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center mb-2">
                  <platform.icon className={`h-5 w-5 mr-2 ${platform.color}`} />
                  <p className="text-sm font-medium">{platform.name}</p>
                </div>
                <p className="text-xs text-gray-600">{platform.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Page Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instagram Business Account
          </label>
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select your Instagram business account</option>
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.instagram_accounts.length > 0 ? `📸 ${page.name} (@${page.instagram_accounts[0]?.username || 'business'})` : `❌ ${page.name} (No Instagram connected)`}
              </option>
            ))}
          </select>
        </div>

        {/* Scheduling */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Schedule Post (Optional)
          </label>
          <div className="flex items-center space-x-2">
            <Input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              min={getDefaultScheduledTime()}
              className="flex-1"
            />
            <Button
              onClick={() => setScheduledTime(getDefaultScheduledTime())}
              variant="outline"
              size="sm"
            >
              <Clock className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to post immediately
          </p>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
          <div className="space-y-2">
            <p className="text-sm text-gray-700">{caption}</p>
            <div className="flex flex-wrap gap-1">
              {hashtags.map((tag, index) => (
                <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  #{tag}
                </span>
              ))}
            </div>
            {mediaUrl && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ImageIcon className="h-4 w-4" />
                <span>Media attached</span>
              </div>
            )}
          </div>
        </div>

        {/* Post Button */}
        <Button
          onClick={handlePost}
          disabled={loading || !selectedPage || !caption.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {scheduledTime ? 'Scheduling...' : 'Posting...'}
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {scheduledTime ? 'Schedule Post' : 'Post Now'}
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 