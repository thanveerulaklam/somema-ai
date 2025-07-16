declare module 'facebook-nodejs-business-sdk' {
  export class FacebookAdsApi {
    static init(accessToken: string): void
  }

  export class AdAccount {
    constructor(id: string)
  }

  export class Page {
    constructor(id: string)
    createFeed(data: any): Promise<{ id: string }>
  }
} 