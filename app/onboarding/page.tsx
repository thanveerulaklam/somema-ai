'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { CountrySelect } from '../../components/ui/CountrySelect'
import { StateSelect } from '../../components/ui/StateSelect'
import { findCountryByName } from '../../lib/countries'

const NICHE_OPTIONS = [
  'Fashion & Beauty',
  'Food & Beverage',
  'Technology',
  'Health & Fitness',
  'Travel & Tourism',
  'Education',
  'Real Estate',
  'E-commerce',
  'Professional Services',
  'Entertainment',
  'Other'
]

const TONE_OPTIONS = [
  'Professional & Formal',
  'Casual & Friendly',
  'Humorous & Playful',
  'Inspirational & Motivational',
  'Educational & Informative',
  'Luxury & Premium',
  'Minimalist & Clean'
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    business_name: '',
    niche: '',
    tone: '',
    audience: '',
    city: '',
    state: '',
    country: ''
  })
  
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    }
    getUser()
  }, [router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    if (!user) return
    
    setLoading(true)
    setError('')

    try {
      // First, try to update existing profile
      const { data: existingProfile, error: selectError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        throw selectError
      }

      const profileData = {
        user_id: user.id,
        business_name: formData.business_name,
        industry: formData.niche,
        brand_tone: formData.tone,
        target_audience: formData.audience,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        post_generation_credits: 15,
        image_enhancement_credits: 3,
        media_storage_limit: 50,
        subscription_plan: 'free',
        updated_at: new Date().toISOString()
      }

      let error
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', user.id)
        error = updateError
      } else {
        // Insert new profile
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert(profileData)
        error = insertError
      }

      if (error) throw error

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Onboarding error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return typeof formData.business_name === 'string' && formData.business_name.trim().length > 0
      case 2:
        return typeof formData.niche === 'string' && formData.niche.trim().length > 0
      case 3:
        return typeof formData.tone === 'string' && formData.tone.trim().length > 0
      case 4:
        return typeof formData.audience === 'string' && formData.audience.trim().length > 0
      case 5:
        return typeof formData.city === 'string' && formData.city.trim().length > 0 &&
               typeof formData.country === 'string' && formData.country.trim().length > 0
      default:
        return false
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">What's your business name?</h3>
              <p className="text-sm text-gray-600">This will be used in your AI-generated content</p>
            </div>
            <Input
              label="Business Name"
              value={formData.business_name}
              onChange={(e) => handleInputChange('business_name', e.target.value)}
              placeholder="Enter your business name"
              required
            />
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">What industry are you in?</h3>
              <p className="text-sm text-gray-600">This helps us generate relevant content</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {NICHE_OPTIONS.map((niche) => (
                <button
                  key={niche}
                  type="button"
                  onClick={() => handleInputChange('niche', niche)}
                  className={`p-3 text-left rounded-lg border transition-colors text-gray-900 ${
                    formData.niche === niche
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">What's your brand tone?</h3>
              <p className="text-sm text-gray-600">How should your content sound?</p>
            </div>
            <div className="space-y-3">
              {TONE_OPTIONS.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => handleInputChange('tone', tone)}
                  className={`w-full p-3 text-left rounded-lg border transition-colors text-gray-900 ${
                    formData.tone === tone
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Who's your target audience?</h3>
              <p className="text-sm text-gray-600">Describe your ideal customers</p>
            </div>
            <Input
              label="Target Audience"
              value={formData.audience}
              onChange={(e) => handleInputChange('audience', e.target.value)}
              placeholder="e.g., Young professionals aged 25-35 interested in fitness"
              required
            />
          </div>
        )
      
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Where is your business located?</h3>
              <p className="text-sm text-gray-600">City and Country are required. State/Province is optional.</p>
            </div>
            <div className="space-y-4">
              <Input
                label="City *"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter your city"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province (Optional)
                </label>
                <StateSelect
                  value={formData.state}
                  onChange={(value) => handleInputChange('state', value)}
                  countryCode={findCountryByName(formData.country)?.code || ''}
                  placeholder="Select your state/province"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <CountrySelect
                  value={formData.country}
                  onChange={(value) => handleInputChange('country', value)}
                  placeholder="Select your country"
                  required
                />
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 py-8 px-2 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg sm:text-xl font-bold">S</span>
          </div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            Set up your business profile
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-600">
            Help us create personalized content for your brand
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          {renderStep()}

          {error && (
            <div className="mt-4 text-red-600 text-sm text-center">{error}</div>
          )}

          <div className="mt-8 flex justify-between">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                Back
              </Button>
            )}
            
            {step < 5 ? (
              <Button
                className="ml-auto"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed() || loading}
              >
                Next
              </Button>
            ) : (
              <Button
                className="ml-auto"
                onClick={handleSubmit}
                loading={loading}
                disabled={!canProceed()}
              >
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 