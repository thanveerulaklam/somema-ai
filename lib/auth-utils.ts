import { supabase } from './supabase'

export async function handleAuthError(error: any) {
  console.error('Auth error:', error)
  
  // Check if it's a refresh token error
  if (error.message?.includes('Invalid Refresh Token') || 
      error.message?.includes('Refresh Token Not Found') ||
      error.message?.includes('JWT expired')) {
    
    console.log('Refresh token error detected, clearing session...')
    
    // Clear the session
    await supabase.auth.signOut()
    
    // Clear any stored tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.removeItem('supabase.auth.token')
    }
    
    // Redirect to login
    window.location.href = '/login?error=session_expired'
    return
  }
  
  // For other auth errors, just throw them
  throw error
}

export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      await handleAuthError(error)
      return null
    }
    
    return data.session
  } catch (error) {
    await handleAuthError(error)
    return null
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      await handleAuthError(error)
      return null
    }
    
    return user
  } catch (error) {
    await handleAuthError(error)
    return null
  }
}

export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      await handleAuthError(error)
      return null
    }
    
    return session
  } catch (error) {
    await handleAuthError(error)
    return null
  }
}
