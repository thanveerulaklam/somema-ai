'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

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
    audience: ''
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
      // Insert or update user profile
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          business_name: formData.business_name,
          niche: formData.niche,
          tone: formData.tone,
          audience: formData.audience,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.business_name.trim().length > 0
      case 2:
        return formData.niche.trim().length > 0
      case 3:
        return formData.tone.trim().length > 0
      case 4:
        return formData.audience.trim().length > 0
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
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    formData.niche === niche
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
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
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    formData.tone === tone
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
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
      
      default:
        return null
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">S</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set up your business profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Help us create personalized content for your brand
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
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
            
            {step < 4 ? (
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