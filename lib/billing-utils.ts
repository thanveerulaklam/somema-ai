/**
 * Billing utility functions for subscription management
 */

/**
 * Calculate the end date for a subscription based on billing cycle
 * @param startDate - The subscription start date
 * @param billingCycle - 'monthly' or 'yearly'
 * @returns ISO string of the end date
 */
export function calculateSubscriptionEndDate(startDate: Date, billingCycle: 'monthly' | 'yearly'): string {
  const endDate = new Date(startDate);
  
  if (billingCycle === 'monthly') {
    // Add one month to the start date
    endDate.setMonth(endDate.getMonth() + 1);
    
    // Handle edge cases where the day doesn't exist in the next month
    // e.g., Jan 31 -> Feb 28/29, Mar 31 -> Apr 30
    if (endDate.getDate() !== startDate.getDate()) {
      // Set to the last day of the previous month
      endDate.setDate(0);
    }
  } else if (billingCycle === 'yearly') {
    // Add one year to the start date
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    // Handle leap year edge cases
    if (endDate.getDate() !== startDate.getDate()) {
      // Set to the last day of the previous month
      endDate.setDate(0);
    }
  }
  
  return endDate.toISOString();
}

/**
 * Calculate the next billing date for a subscription
 * @param currentEndDate - The current subscription end date
 * @param billingCycle - 'monthly' or 'yearly'
 * @returns ISO string of the next billing date
 */
export function calculateNextBillingDate(currentEndDate: Date, billingCycle: 'monthly' | 'yearly'): string {
  const nextDate = new Date(currentEndDate);
  
  if (billingCycle === 'monthly') {
    // Add one month to the current end date
    nextDate.setMonth(nextDate.getMonth() + 1);
    
    // Handle edge cases where the day doesn't exist in the next month
    if (nextDate.getDate() !== currentEndDate.getDate()) {
      nextDate.setDate(0);
    }
  } else if (billingCycle === 'yearly') {
    // Add one year to the current end date
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    
    // Handle leap year edge cases
    if (nextDate.getDate() !== currentEndDate.getDate()) {
      nextDate.setDate(0);
    }
  }
  
  return nextDate.toISOString();
}

/**
 * Get the number of days remaining in the current billing period
 * @param endDate - The subscription end date
 * @returns Number of days remaining
 */
export function getDaysRemaining(endDate: Date): number {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Check if a subscription is active (not expired)
 * @param endDate - The subscription end date
 * @returns True if subscription is active
 */
export function isSubscriptionActive(endDate: Date): boolean {
  return new Date() < new Date(endDate);
}
