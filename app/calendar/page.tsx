'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { 
  Calendar as CalendarIcon,
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Instagram,
  Facebook,
  Twitter,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

interface Post {
  id: string
  caption: string
  hashtags: string[]
  platform: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduled_for: string
  created_at: string
  media_url?: string
}

export default function CalendarPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [error, setError] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true })

      if (error) throw error

      setPosts(data || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduled_for)
      return postDate.toDateString() === date.toDateString()
    })
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return Instagram
      case 'facebook': return Facebook
      case 'twitter': return Twitter
      default: return Instagram
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-red-100 text-red-800'
      case 'published': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
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
              <CalendarIcon className="h-6 w-6 text-purple-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">
                Content Calendar
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'month' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Link href="/ai/generate">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <h2 className="text-2xl font-semibold text-gray-900">
                {currentDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
              
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <Button
              onClick={() => setCurrentDate(new Date())}
              variant="outline"
              size="sm"
            >
              Today
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-50 p-3 text-center">
                <span className="text-sm font-medium text-gray-700">{day}</span>
              </div>
            ))}

            {/* Calendar days */}
            {getDaysInMonth(currentDate).map((date, index) => {
              const dayPosts = date ? getPostsForDate(date) : []
              const isToday = date ? date.toDateString() === new Date().toDateString() : false
              const isSelected = selectedDate && date ? date.toDateString() === selectedDate.toDateString() : false
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] bg-white p-2 ${
                    isToday ? 'bg-blue-50' : ''
                  } ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {date && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${
                          isToday ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </span>
                        {dayPosts.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {dayPosts.length}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {dayPosts.slice(0, 2).map(post => {
                          const PlatformIcon = getPlatformIcon(post.platform)
                          return (
                            <div
                              key={post.id}
                              className={`flex items-center gap-1 p-1 rounded text-xs cursor-pointer hover:bg-gray-100 ${getStatusColor(post.status)}`}
                              onClick={() => handleDateClick(date)}
                            >
                              <PlatformIcon className="h-3 w-3" />
                              <span className="truncate">{post.caption.substring(0, 15)}...</span>
                            </div>
                          )
                        })}
                        {dayPosts.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayPosts.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Date Posts */}
        {selectedDate && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Posts for {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <Link href="/ai/generate">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Post
                </Button>
              </Link>
            </div>

            {getPostsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No posts scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getPostsForDate(selectedDate).map(post => {
                  const PlatformIcon = getPlatformIcon(post.platform)
                  return (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <PlatformIcon className="h-5 w-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {post.platform}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatTime(post.scheduled_for)}
                          </span>
                        </div>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                          {post.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
} 