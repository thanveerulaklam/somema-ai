export interface InstagramCredentials {
  accessToken: string
  instagramBusinessAccountId: string
}

export interface InstagramPostContent {
  caption: string
  hashtags: string[]
  mediaUrl?: string
  mediaUrls?: string[]
  scheduledTime?: string
}

export interface InstagramPostResult {
  success: boolean
  postId?: string
  error?: string
  scheduledTime?: string
}

export interface InstagramAccount {
  id: string
  username: string
  name: string
  profilePictureUrl?: string
  followersCount?: number
  mediaCount?: number
} 