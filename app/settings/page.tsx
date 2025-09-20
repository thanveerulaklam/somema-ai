'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { CountrySelect } from '../../components/ui/CountrySelect'
import { StateSelect } from '../../components/ui/StateSelect'
import MetaConnection from '../../components/MetaConnection'
import { findCountryByName } from '../../lib/countries'
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
  X,
  Sparkles,
  Image,
  HelpCircle
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  business_name: string
  niche: string
  tone: string
  audience: string
  city: string
  state: string
  country: string
  created_at?: string
  updated_at?: string
}

interface UsageStats {
  generationCount: number
  enhancementCredits: number
}

interface SubscriptionPlan {
  plan: string
  status: string
  startDate?: string
  endDate?: string
  billingCycle?: string
}

function SettingsPageContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [usageStats, setUsageStats] = useState<UsageStats>({ generationCount: 0, enhancementCredits: 0 })
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    loadProfile()
    loadUsageStats()
    loadSubscriptionPlan()
    handleOAuthCallback()
    
    // Check for success message in URL params
    const urlMessage = searchParams.get('message')
    if (urlMessage) {
      setSuccess(decodeURIComponent(urlMessage))
      // Clear the message from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('message')
      window.history.replaceState({}, '', newUrl.toString())
      
      // Reload subscription plan data if it's a payment success message
      if (urlMessage.includes('Subscription activated') || urlMessage.includes('Top-up credits added')) {
        loadSubscriptionPlan()
        loadUsageStats()
      }
    }
  }, [searchParams])

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
            // Update existing profile - preserve existing connections
            const { data: currentProfile } = await supabase
              .from('user_profiles')
              .select('meta_credentials')
              .eq('user_id', user.id)
              .single()

            const currentConnected = currentProfile?.meta_credentials?.connected || []
            
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({
                meta_credentials: {
                  accessToken: metaData.accessToken,
                  pages: metaData.pages,
                  connected: currentConnected // Preserve existing connections
                }
              })
              .eq('user_id', user.id)

            if (updateError) {
              console.error('Error updating Meta credentials:', updateError)
              setError('Failed to save Facebook connection')
            } else {
              setSuccess('Facebook pages discovered! You can now connect individual Instagram accounts.')
            }
          } else {
            // Create new profile - don't auto-connect any accounts
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: user.id,
                meta_credentials: {
                  accessToken: metaData.accessToken,
                  pages: metaData.pages,
                  connected: [] // Don't auto-connect any accounts
                }
              })

            if (insertError) {
              console.error('Error creating user profile:', insertError)
              setError('Failed to save Facebook connection')
            } else {
              setSuccess('Facebook pages discovered! You can now connect individual Instagram accounts.')
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
      setSuccess('Facebook pages discovered! You can now connect individual Instagram accounts.')
      
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
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      if (profileData) {
        // Map user_profiles fields to UserProfile interface
        const mappedProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          business_name: profileData.business_name || '',
          niche: profileData.industry || '',
          tone: profileData.brand_tone || '',
          audience: profileData.target_audience || '',
          city: profileData.city || '',
          state: profileData.state || '',
          country: profileData.country || '',
          created_at: profileData.created_at,
          updated_at: profileData.updated_at
        }
        setProfile(mappedProfile)
      } else {
        // If no profile exists, create a default one
        const defaultProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          business_name: '',
          niche: '',
          tone: '',
          audience: '',
          city: '',
          state: '',
          country: ''
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

  const loadUsageStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get post generation credits and enhancement credits
      const { data: userData, error: creditsError } = await supabase
        .from('user_profiles')
        .select('post_generation_credits, image_enhancement_credits, subscription_plan')
        .eq('user_id', user.id)
        .single()

      // Get default values based on plan
      const plan = userData?.subscription_plan || 'free'
      const defaultCredits = getDefaultCreditsForPlan(plan)
      const defaultGenerations = getDefaultGenerationsForPlan(plan)

      setUsageStats({
        generationCount: userData?.post_generation_credits ?? defaultGenerations,
        enhancementCredits: userData?.image_enhancement_credits ?? defaultCredits
      })
    } catch (error: any) {
      console.error('Error loading usage stats:', error)
      // Don't show error to user for usage stats
      // Set default values for free plan if error occurs
      setUsageStats({
        generationCount: getDefaultGenerationsForPlan('free'),
        enhancementCredits: getDefaultCreditsForPlan('free')
      })
    }
  }

  // Helper function to get default credits for each plan
  const getDefaultCreditsForPlan = (plan: string): number => {
    switch (plan) {
      case 'free':
        return 3
      case 'starter':
        return 30
      case 'growth':
        return 100
      case 'scale':
        return 500
      default:
        return 3 // Default to free plan credits
    }
  }

  // Helper function to get default generations for each plan
  const getDefaultGenerationsForPlan = (plan: string): number => {
    switch (plan) {
      case 'free':
        return 15
      case 'starter':
        return 100
      case 'growth':
        return 300
      case 'scale':
        return 1000
      default:
        return 15 // Default to free plan generations
    }
  }

  const loadSubscriptionPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get subscription information from user_profiles table
      const { data: userData, error } = await supabase
        .from('user_profiles')
        .select('subscription_plan, subscription_status, subscription_start_date, subscription_end_date, billing_cycle')
        .eq('user_id', user.id)
        .single()

      if (userData) {
        setSubscriptionPlan({
          plan: userData.subscription_plan || 'free',
          status: userData.subscription_status || 'active',
          startDate: userData.subscription_start_date,
          endDate: userData.subscription_end_date,
          billingCycle: userData.billing_cycle
        })
      } else {
        setSubscriptionPlan({
          plan: 'free',
          status: 'active'
        })
      }
    } catch (error: any) {
      console.error('Error loading subscription plan:', error)
      // Default to free plan if error
      setSubscriptionPlan({
        plan: 'free',
        status: 'active'
      })
    }
  }

  const handleSave = async () => {
    if (!profile) return
    
    // Validate required fields
    const requiredFields = [
      profile.business_name,
      profile.niche,
      profile.city,
      profile.country
    ];
    
    const missingFields = requiredFields.filter(field => 
      !field || typeof field !== 'string' || field.trim().length === 0
    );
    
    if (missingFields.length > 0) {
      setError('Please fill in all required fields: Business Name, Industry/Niche, City, and Country');
      return;
    }
    
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Update the user profile in the database
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      console.log('Saving profile data:', {
        user_id: user.id,
        business_name: profile.business_name,
        industry: profile.niche,
        brand_tone: profile.tone,
        target_audience: profile.audience,
        city: profile.city,
        state: profile.state,
        country: profile.country
      })

      // First check if profile exists
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
          business_name: profile.business_name,
            industry: profile.niche,
            brand_tone: profile.tone,
            target_audience: profile.audience,
            city: profile.city,
            state: profile.state,
            country: profile.country,
          updated_at: new Date().toISOString()
        })
          .eq('user_id', user.id)

      if (updateError) throw updateError
      } else {
        // Insert new profile
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            business_name: profile.business_name,
            industry: profile.niche,
            brand_tone: profile.tone,
            target_audience: profile.audience,
            city: profile.city,
            state: profile.state,
            country: profile.country
          })

        if (insertError) throw insertError
      }
      
      setSuccess('Settings saved successfully!')
      setEditing(null)
    } catch (error: any) {
      console.error('Error saving profile:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      setError(error.message || 'Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!profile) return

    setCancelling(true)
    setError('')

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profile.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel subscription')
      }

      setSuccess(result.message || 'Subscription cancelled successfully!')
      setShowCancelModal(false)
      
      // Reload subscription data
      await loadSubscriptionPlan()
      await loadUsageStats()
      
    } catch (error: any) {
      setError(error.message || 'Failed to cancel subscription')
    } finally {
      setCancelling(false)
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
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Settings className="h-6 w-6 text-gray-600 mr-2" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Settings
                </h1>
              </div>
              <Link href="/tutorial">
                <Button variant="outline" size="sm">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Tutorial
                </Button>
              </Link>
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
                  <p className="text-gray-900 text-lg font-semibold">{profile.email}</p>
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
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Fields marked with * are required to access the dashboard
                  </p>
                  {/* Profile completion status */}
                  {(() => {
                    const requiredFields = [
                      profile?.business_name,
                      profile?.niche,
                      profile?.city,
                      profile?.country
                    ];
                    const completedFields = requiredFields.filter(field => 
                      field && typeof field === 'string' && field.trim().length > 0
                    ).length;
                    const totalFields = requiredFields.length;
                    const isComplete = completedFields === totalFields;
                    
                    return (
                      <div className={`mt-3 p-3 rounded-lg border ${
                        isComplete 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${
                              isComplete ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className={`text-sm font-medium ${
                              isComplete ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {isComplete ? 'Profile Complete' : 'Profile Incomplete'}
                            </span>
                          </div>
                          <span className={`text-sm ${
                            isComplete ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {completedFields}/{totalFields} required fields completed
                          </span>
                        </div>
                        {!isComplete && (
                          <p className="text-sm text-red-700 mt-1">
                            Complete all required fields to access the dashboard
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    !profile.business_name || profile.business_name.trim().length === 0 
                      ? 'text-red-600' 
                      : 'text-gray-700'
                  }`}>
                    Business Name *
                  </label>
                  {editing === 'business' ? (
                    <Input
                      value={profile.business_name}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                      placeholder="Enter your business name"
                      required
                      className={!profile.business_name || profile.business_name.trim().length === 0 ? 'border-red-500 focus:border-red-500' : ''}
                    />
                  ) : (
                    <p className={`${
                      !profile.business_name || profile.business_name.trim().length === 0 
                        ? 'text-red-600' 
                        : 'text-gray-900'
                    } text-lg font-semibold`}>
                      {profile.business_name || 'Not set'}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">Required field</p>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    !profile.niche || profile.niche.trim().length === 0 
                      ? 'text-red-600' 
                      : 'text-gray-700'
                  }`}>
                    Industry/Niche *
                  </label>
                  {editing === 'business' ? (
                    <Input
                      value={profile.niche}
                      onChange={(e) => handleInputChange('niche', e.target.value)}
                      placeholder="e.g., Technology, Fashion, Food & Beverage"
                      required
                      className={!profile.niche || profile.niche.trim().length === 0 ? 'border-red-500 focus:border-red-500' : ''}
                    />
                  ) : (
                    <p className={`${
                      !profile.niche || profile.niche.trim().length === 0 
                        ? 'text-red-600' 
                        : 'text-gray-900'
                    } text-lg font-semibold`}>
                      {profile.niche || 'Not set'}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">Required field</p>
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
                    <p className="text-gray-900 text-lg font-semibold">{profile.tone || 'Not set'}</p>
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
                    <p className="text-gray-900 text-lg font-semibold">{profile.audience || 'Not set'}</p>
                  )}
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    !profile.city || profile.city.trim().length === 0 
                      ? 'text-red-600' 
                      : 'text-gray-700'
                  }`}>
                    City *
                  </label>
                  {editing === 'business' ? (
                    <Input
                      value={profile.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Enter your city"
                      required
                      className={!profile.city || profile.city.trim().length === 0 ? 'border-red-500 focus:border-red-500' : ''}
                    />
                  ) : (
                    <p className={`${
                      !profile.city || profile.city.trim().length === 0 
                        ? 'text-red-600' 
                        : 'text-gray-900'
                    } text-lg font-semibold`}>
                      {profile.city || 'Not set'}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">Required field</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province
                  </label>
                  {editing === 'business' ? (
                    <StateSelect
                      value={profile.state}
                      onChange={(value) => handleInputChange('state', value)}
                      countryCode={findCountryByName(profile.country)?.code || ''}
                      placeholder="Select your state/province"
                    />
                  ) : (
                    <p className="text-gray-900 text-lg font-semibold">{profile.state || 'Not set'}</p>
                  )}
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    !profile.country || profile.country.trim().length === 0 
                      ? 'text-red-600' 
                      : 'text-gray-700'
                  }`}>
                    Country *
                  </label>
                  {editing === 'business' ? (
                    <CountrySelect
                      value={profile.country}
                      onChange={(value) => handleInputChange('country', value)}
                      placeholder="Select your country"
                      required
                      className={!profile.country || profile.country.trim().length === 0 ? 'border-red-500 focus:border-red-500' : ''}
                    />
                  ) : (
                    <p className={`${
                      !profile.country || profile.country.trim().length === 0 
                        ? 'text-red-600' 
                        : 'text-gray-900'
                    } text-lg font-semibold`}>
                      {profile.country || 'Not set'}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">Required field</p>
                </div>
              </div>
            </div>

            {/* Subscription Plan */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-green-600 mr-3" />
                    <h2 className="text-lg font-medium text-gray-900">Subscription Plan</h2>
                  </div>
                  {subscriptionPlan?.plan === 'free' ? (
                    <Button 
                      size="sm" 
                      onClick={() => router.push('/pricing')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      Upgrade Plan
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push('/pricing')}
                    >
                      View Pricing
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {subscriptionPlan ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          subscriptionPlan.status === 'active' ? 'bg-green-500' : 
                          subscriptionPlan.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 capitalize">
                            {subscriptionPlan.plan && subscriptionPlan.plan.length > 20 ? 'Premium' : subscriptionPlan.plan} Plan
                          </h3>
                          <p className="text-sm text-gray-600 capitalize">
                            Status: {subscriptionPlan.status}
                          </p>
                          {subscriptionPlan.billingCycle && (
                            <p className="text-sm text-gray-600 capitalize">
                              Billing: {subscriptionPlan.billingCycle}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {subscriptionPlan.plan === 'free' ? (
                          <span className="text-2xl font-bold text-gray-900">₹0</span>
                        ) : subscriptionPlan.plan === 'starter' ? (
                          <span className="text-2xl font-bold text-gray-900">₹999</span>
                        ) : subscriptionPlan.plan === 'growth' ? (
                          <span className="text-2xl font-bold text-gray-900">₹2,499</span>
                        ) : subscriptionPlan.plan === 'scale' ? (
                          <span className="text-2xl font-bold text-gray-900">₹8,999</span>
                        ) : (
                          <span className="text-2xl font-bold text-gray-900">-</span>
                        )}
                        <p className="text-sm text-gray-600">per month</p>
                      </div>
                    </div>

                    {subscriptionPlan.plan === 'free' && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <Sparkles className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Upgrade to unlock more features!
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <ul className="list-disc list-inside space-y-1">
                                <li>More AI content generations</li>
                                <li>Downloadable AI image enhancements</li>
                                <li>Unlimited media storage</li>
                                <li>Priority support</li>
                              </ul>
                            </div>
                            <div className="mt-3">
                              <Button 
                                onClick={() => router.push('/pricing')}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              >
                                View Plans & Upgrade
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {subscriptionPlan.startDate && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Started
                          </label>
                          <p className="text-gray-900">
                            {new Date(subscriptionPlan.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        {subscriptionPlan.endDate && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Expires
                            </label>
                            <p className="text-gray-900">
                              {new Date(subscriptionPlan.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Plan Management Buttons */}
                    {subscriptionPlan && subscriptionPlan.plan !== 'free' && subscriptionPlan.status === 'active' && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Change Plan</h4>
                              <p className="text-sm text-gray-600">View all available plans and upgrade or downgrade</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => router.push('/pricing')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              View Plans
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Cancel Subscription</h4>
                              <p className="text-sm text-gray-600">You can cancel your subscription at any time</p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setShowCancelModal(true)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Cancel Plan
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Loading subscription information...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-purple-600 mr-3" />
                  <h2 className="text-lg font-medium text-gray-900">Usage Statistics</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-700">Post Generation Credits</p>
                        <p className="text-2xl font-bold text-purple-900">{usageStats.generationCount}</p>
                        <p className="text-xs text-purple-600">AI post generations remaining</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-700">Enhancement Credits</p>
                        <p className="text-2xl font-bold text-orange-900">{usageStats.enhancementCredits}</p>
                        <p className="text-xs text-orange-600">AI image enhancements remaining</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Image className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    💡 <strong>Tip:</strong> Enhancement credits are used when you enhance images with AI. 
                    You can purchase more credits or upgrade your plan to get additional credits.
                  </p>
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
      {/* Log Out Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex justify-end">
        <Button
          variant="destructive"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/login');
          }}
          className="mt-8"
        >
          Log Out
        </Button>
      </div>

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cancel Subscription</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel your subscription? This action cannot be undone.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">What happens when you cancel:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Your subscription will be cancelled immediately</li>
                  <li>• You'll be downgraded to the Free plan</li>
                  <li>• Your credits will be reset to Free plan limits</li>
                  <li>• You can resubscribe anytime</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                className="flex-1"
                disabled={cancelling}
              >
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                loading={cancelling}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  )
}