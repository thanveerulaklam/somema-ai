# Admin Analytics Dashboard Setup

This guide will help you set up and use the comprehensive admin analytics dashboard for your Somema AI application.

## 🚀 Quick Start

### 1. Access the Admin Dashboard

Navigate to `/admin` in your application. You'll need admin privileges to access this area.

### 2. Admin Access Requirements

Currently, admin access is granted to users whose business name contains either:
- `admin` 
- `somema`

**To grant admin access to a user:**
1. Go to your Supabase dashboard
2. Navigate to the `user_profiles` table
3. Update the `business_name` field to include "admin" or "somema"

**Example:**
```sql
UPDATE user_profiles 
SET business_name = 'Admin User' 
WHERE user_id = 'your-user-id';
```

## 📊 Dashboard Features

### Main Analytics Dashboard (`/admin`)

#### Key Metrics
- **Total Users**: Complete user count
- **Paid Users**: Users with paid subscriptions
- **Monthly Revenue**: Current monthly recurring revenue (MRR)
- **Active Subscriptions**: Number of active paid subscriptions

#### User Growth Analytics
- New users today, this week, this month
- User growth trends and patterns
- Conversion rates from free to paid

#### Plan Distribution
- Breakdown of users by subscription plan
- Free vs. paid user ratios
- Plan upgrade/downgrade patterns

#### Credit Usage Analytics
- Total credits consumed across all users
- Average credits per user
- Top credit-consuming users
- Credit usage patterns by plan

#### User Activity Metrics
- Posts created today/this week/this month
- Images enhanced today/this week/this month
- Active user engagement rates

#### Revenue Metrics
- **MRR**: Monthly Recurring Revenue
- **ARR**: Annual Recurring Revenue (MRR × 12)
- Total revenue calculations
- Conversion rates and trends

### User Management (`/admin/users`)

#### User List View
- Complete user database with pagination
- Search and filter capabilities
- Sort by various fields (name, date, plan, etc.)

#### User Management Actions
- **Edit User**: Modify subscription plans, credits, status
- **Delete User**: Remove users from the system
- **View Details**: See user activity and usage patterns

#### Advanced Filtering
- Filter by subscription plan (free, starter, growth, scale)
- Filter by subscription status (active, cancelled, paused, expired)
- Search by business name or industry

## 🔧 API Endpoints

### Admin Analytics API
```
GET /api/admin/analytics
```

**Query Parameters:**
- `range`: Date range (7d, 30d, 90d)
- `details`: Include detailed analytics (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 150,
      "paidUsers": 45,
      "freeUsers": 105,
      "newUsersToday": 3,
      "newUsersThisWeek": 12,
      "newUsersThisMonth": 45,
      "totalRevenue": 3567,
      "mrr": 3567,
      "arr": 42804,
      "conversionRate": 30.0,
      "freeToPaidRate": 42.9,
      "retentionRate": 78.5
    },
    "planDistribution": {
      "free": 105,
      "starter": 25,
      "growth": 15,
      "scale": 5
    },
    "creditUsage": {
      "totalCreditsUsed": 1250,
      "averageCreditsPerUser": 8.3,
      "topCreditUsers": [...]
    },
    "userActivity": {
      "postsCreatedToday": 23,
      "imagesEnhancedToday": 45,
      "activeUsers": 118
    }
  }
}
```

### User Management API
```
GET /api/admin/users - List users with pagination
PUT /api/admin/users - Update user details
DELETE /api/admin/users - Delete user
```

**Query Parameters for GET:**
- `page`: Page number (default: 1)
- `limit`: Users per page (default: 50)
- `search`: Search term for business name/industry
- `plan`: Filter by subscription plan
- `status`: Filter by subscription status
- `sortBy`: Sort field (created_at, business_name, etc.)
- `sortOrder`: Sort direction (asc, desc)

## 📈 Key Business Metrics

### User Acquisition
- **Daily Signups**: New users per day
- **Weekly Growth**: Week-over-week user growth
- **Monthly Growth**: Month-over-month user growth
- **Conversion Funnel**: Signup → Onboarding → First Post → Paid Plan

### Revenue Metrics
- **MRR Growth**: Month-over-month recurring revenue growth
- **Plan Distribution**: Revenue breakdown by subscription tier
- **Churn Rate**: Monthly subscription cancellations
- **LTV**: Customer Lifetime Value calculations

### User Engagement
- **Active Users**: Daily/weekly/monthly active users
- **Feature Usage**: Posts created, images enhanced
- **Credit Consumption**: How users are using their allocated credits
- **Retention**: User retention rates by cohort

### Credit Analytics
- **Credit Consumption Patterns**: How users spend their credits
- **Credit Efficiency**: Credits used per post/image
- **Top Users**: Most active users by credit consumption
- **Plan Utilization**: How well each plan's credit allocation is used

## 🎯 Actionable Insights

### High-Value Users
- Users with high credit consumption
- Users who upgrade plans
- Users with high engagement rates

### Growth Opportunities
- Users approaching credit limits (potential upgrades)
- Inactive users (re-engagement campaigns)
- Free users with high engagement (conversion targets)

### Revenue Optimization
- Plan pricing analysis
- Credit allocation optimization
- Churn prevention strategies

## 🔒 Security Considerations

### Admin Access Control
- Business name-based access control
- Session-based authentication
- API endpoint protection

### Data Privacy
- No PII (Personally Identifiable Information) exposed
- User data anonymization where possible
- Secure API endpoints with proper authentication

## 🚀 Future Enhancements

### Planned Features
- **Real-time Analytics**: Live user activity monitoring
- **Advanced Reporting**: Custom date ranges and comparisons
- **Export Options**: CSV, PDF, and API exports
- **Alert System**: Notifications for key metrics
- **User Behavior Tracking**: Detailed user journey analytics
- **A/B Testing**: Feature and pricing experiment tracking

### Integration Opportunities
- **Google Analytics**: Enhanced web analytics
- **Stripe Analytics**: Payment and subscription insights
- **Email Marketing**: User engagement and conversion tracking
- **Customer Support**: Ticket and support analytics

## 📋 Setup Checklist

- [ ] Verify admin access for your user account
- [ ] Test admin dashboard access at `/admin`
- [ ] Review user management at `/admin/users`
- [ ] Test API endpoints with proper authentication
- [ ] Configure date ranges and filters
- [ ] Export sample data for verification
- [ ] Set up regular monitoring schedule

## 🆘 Troubleshooting

### Common Issues

**Access Denied Error**
- Verify your business name contains "admin" or "somema"
- Check user authentication status
- Ensure proper session cookies

**No Data Displayed**
- Check database connectivity
- Verify table permissions
- Review API endpoint responses

**Performance Issues**
- Implement pagination for large datasets
- Use date range filters to limit data
- Consider caching for frequently accessed metrics

### Support
For technical issues or feature requests, check the application logs or contact the development team.

## 📚 Additional Resources

- [Supabase Dashboard](https://supabase.com/dashboard) - Database management
- [Vercel Analytics](https://vercel.com/analytics) - Web analytics integration
- [Stripe Dashboard](https://dashboard.stripe.com) - Payment analytics (if using Stripe)

---

**Note**: This admin dashboard provides comprehensive insights into your application's performance and user behavior. Regular monitoring of these metrics will help you make data-driven decisions to grow your business.
