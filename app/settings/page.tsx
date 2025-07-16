'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import MetaConnection from '../../components/MetaConnection'
import { 
  Settings,
  User,
  Building,
  Instagram,
  Facebook,
  Twitter,
  Bell,
  Shield,
  CreditCard,
  ArrowLeft,
  Save,
  Edit,
  Check,
  X
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  business_name: string
  niche: string
  tone: string
  audience: string
  created_at?: string
  updated_at?: string
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    loadProfile()
    handleOAuthCallback()
  }, [])

  const handleOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const metaConnected = urlParams.get('meta_connected')
    const error = urlParams.get('error')
    const data = urlParams.get('data')

    if (metaConnected === 'true' && data) {
      try {
        const metaData = JSON.parse(decodeURIComponent(data))
        console.log('Meta OAuth successful:', metaData)
        
        // Store the data in the database
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single()

          if (existingProfile) {
            // Update existing profile
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({
                meta_credentials: {
                  accessToken: metaData.accessToken,
                  pages: metaData.pages
                }
              })
              .eq('user_id', user.id)

            if (updateError) {
              console.error('Error updating Meta credentials:', updateError)
              setError('Failed to save Facebook connection')
            } else {
              setSuccess('Facebook account connected successfully!')
            }
          } else {
            // Create new profile
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: user.id,
                meta_credentials: {
                  accessToken: metaData.accessToken,
                  pages: metaData.pages
                }
              })

            if (insertError) {
              console.error('Error creating user profile:', insertError)
              setError('Failed to save Facebook connection')
            } else {
              setSuccess('Facebook account connected successfully!')
            }
          }
        }
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (error) {
        console.error('Error parsing Meta data:', error)
        setError('Failed to process Facebook connection')
      }
    } else if (metaConnected === 'true') {
      // OAuth was successful and data was stored in database
      setSuccess('Facebook account connected successfully!')
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (error) {
      console.error('Meta OAuth error:', error)
      setError(`Facebook connection failed: ${error}`)
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch actual user profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      if (profileData) {
        setProfile(profileData)
      } else {
        // If no profile exists, create a default one
        const defaultProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          business_name: '',
          niche: '',
          tone: '',
          audience: ''
        }
        setProfile(defaultProfile)
      }
    } catch (error: any) {
      console.error('Error loading profile:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Update the user profile in the database
      const { error: updateError } = await supabase
        .from('users')
        .upsert({
          id: profile.id,
          email: profile.email,
          business_name: profile.business_name,
          niche: profile.niche,
          tone: profile.tone,
          audience: profile.audience,
          updated_at: new Date().toISOString()
        })

      if (updateError) throw updateError
      
      setSuccess('Settings saved successfully!')
      setEditing(null)
    } catch (error: any) {
      console.error('Error saving profile:', error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (!profile) return
    
    setProfile({
      ...profile,
      [field]: value
    })
  }

  const startEditing = (section: string) => {
    setEditing(section)
  }

  const cancelEditing = () => {
    setEditing(null)
    loadProfile() // Reset to original values
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center">
              <Settings className="h-6 w-6 text-gray-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">
                Settings
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {profile && (
          <div className="space-y-8">
            {/* Account Information */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-600 mr-3" />
                  <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <p className="text-gray-900">{profile.email}</p>
                  <p className="text-sm text-gray-500">Email cannot be changed</p>
                </div>
              </div>
            </div>

            {/* Business Profile */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-gray-600 mr-3" />
                    <h2 className="text-lg font-medium text-gray-900">Business Profile</h2>
                  </div>
                  {editing === 'business' ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} loading={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => startEditing('business')}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  {editing === 'business' ? (
                    <Input
                      value={profile.business_name}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                      placeholder="Enter your business name"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.business_name || 'Not set'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry/Niche
                  </label>
                  {editing === 'business' ? (
                    <Input
                      value={profile.niche}
                      onChange={(e) => handleInputChange('niche', e.target.value)}
                      placeholder="e.g., Technology, Fashion, Food & Beverage"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.niche || 'Not set'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Tone
                  </label>
                  {editing === 'business' ? (
                    <Input
                      value={profile.tone}
                      onChange={(e) => handleInputChange('tone', e.target.value)}
                      placeholder="e.g., Professional & Formal, Casual & Friendly"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.tone || 'Not set'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  {editing === 'business' ? (
                    <Input
                      value={profile.audience}
                      onChange={(e) => handleInputChange('audience', e.target.value)}
                      placeholder="e.g., Young professionals aged 25-35 interested in fitness"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.audience || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Social Media Connections */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <Facebook className="h-5 w-5 text-blue-600 mr-3" />
                  <h2 className="text-lg font-medium text-gray-900">Social Media Connections</h2>
                </div>
              </div>
              
              <div className="p-6">
                <MetaConnection />
              </div>
            </div>

            {/* Profile Information */}
            {profile.created_at && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-600 mr-3" />
                    <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Created
                      </label>
                      <p className="text-gray-900">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {profile.updated_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Updated
                        </label>
                        <p className="text-gray-900">
                          {new Date(profile.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 