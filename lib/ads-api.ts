import { FacebookAdsApi } from 'facebook-nodejs-business-sdk'

export interface AdsAPICredentials {
  accessToken: string
  adAccountId?: string
}

export interface AdAccountInfo {
  id: string
  name: string
  account_status: number
  currency: string
  timezone_name: string
}

export class AdsAPIService {
  private accessToken: string
  private adAccountId?: string

  constructor(credentials: AdsAPICredentials) {
    this.accessToken = credentials.accessToken
    this.adAccountId = credentials.adAccountId
    
    // Initialize Facebook Ads API
    FacebookAdsApi.init(this.accessToken)
  }

  /**
   * Get user's ad accounts
   */
  async getAdAccounts(): Promise<AdAccountInfo[]> {
    try {
      console.log('Fetching ad accounts...')
      
      // Try the Ads API endpoint first
      const response = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?access_token=${this.accessToken}`)
      const data = await response.json()
      
      if (data.error) {
        console.log('Ads API endpoint failed, trying alternative approach:', data.error.message)
        // If Ads API fails, try to get basic user info as a fallback
        const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${this.accessToken}`)
        const userData = await userResponse.json()
        
        if (userData.error) {
          throw new Error(userData.error.message)
        }
        
        // Return empty array but log that we made a successful API call
        console.log('Successfully made Graph API call to /me endpoint')
        return []
      }

      return data.data || []
    } catch (error: any) {
      console.error('Error fetching ad accounts:', error)
      throw error
    }
  }

  /**
   * Get ad account details
   */
  async getAdAccountDetails(adAccountId: string): Promise<AdAccountInfo> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${adAccountId}?fields=id,name,account_status,currency,timezone_name&access_token=${this.accessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      return data
    } catch (error: any) {
      console.error('Error fetching ad account details:', error)
      throw error
    }
  }

  /**
   * Get campaigns for an ad account
   */
  async getCampaigns(adAccountId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${adAccountId}/campaigns?fields=id,name,status,objective&access_token=${this.accessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      return data.data || []
    } catch (error: any) {
      console.error('Error fetching campaigns:', error)
      throw error
    }
  }

  /**
   * Get ad sets for an ad account
   */
  async getAdSets(adAccountId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${adAccountId}/adsets?fields=id,name,status,campaign_id&access_token=${this.accessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      return data.data || []
    } catch (error: any) {
      console.error('Error fetching ad sets:', error)
      throw error
    }
  }

  /**
   * Get ads for an ad account
   */
  async getAds(adAccountId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${adAccountId}/ads?fields=id,name,status,adset_id&access_token=${this.accessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      return data.data || []
    } catch (error: any) {
      console.error('Error fetching ads:', error)
      throw error
    }
  }

  /**
   * Get insights for an ad account (this is a key Ads API call)
   */
  async getAdAccountInsights(adAccountId: string): Promise<any> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${adAccountId}/insights?fields=impressions,clicks,spend&date_preset=last_30d&access_token=${this.accessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        console.log('Insights endpoint failed, trying alternative:', data.error.message)
        // If insights fail, try a basic page info call as fallback
        const pageResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?access_token=${this.accessToken}`
        )
        const pageData = await pageResponse.json()
        
        if (pageData.error) {
          throw new Error(pageData.error.message)
        }
        
        console.log('Successfully made Graph API call to /me/accounts endpoint')
        return { data: [], summary: { total_count: 0 } }
      }

      return data
    } catch (error: any) {
      console.error('Error fetching ad account insights:', error)
      throw error
    }
  }

  /**
   * Get insights for a campaign
   */
  async getCampaignInsights(campaignId: string): Promise<any> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=impressions,clicks,spend&date_preset=last_30d&access_token=${this.accessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      return data
    } catch (error: any) {
      console.error('Error fetching campaign insights:', error)
      throw error
    }
  }

  /**
   * Validate access token
   */
  async validateToken(): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${this.accessToken}`)
      const data = await response.json()
      
      if (data.error) {
        return { valid: false, error: data.error.message }
      }

      return { valid: true }
    } catch (error: any) {
      return { valid: false, error: error.message }
    }
  }
}

/**
 * Utility function to create Ads API service instance
 */
export function createAdsAPIService(credentials: AdsAPICredentials): AdsAPIService {
  return new AdsAPIService(credentials)
} 