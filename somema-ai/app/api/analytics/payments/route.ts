import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    console.log('📊 Fetching payment analytics...');

    // Get date range from query params (default to last 30 days)
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log(`📅 Analytics period: Last ${days} days (from ${startDate.toISOString()})`);

    // Get payment analytics
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        currency,
        status,
        created_at,
        payment_orders!inner(
          plan_id,
          billing_cycle,
          user_id,
          user_profiles!inner(
            full_name,
            business_name
          )
        )
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('❌ Error fetching payments:', paymentsError);
      return NextResponse.json({ error: 'Failed to fetch payment data' }, { status: 500 });
    }

    // Get order analytics
    const { data: orders, error: ordersError } = await supabase
      .from('payment_orders')
      .select(`
        order_id,
        plan_id,
        amount,
        total_amount,
        currency,
        status,
        billing_cycle,
        created_at,
        user_id,
        user_profiles!inner(
          full_name,
          business_name
        )
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch order data' }, { status: 500 });
    }

    // Calculate analytics
    const analytics = {
      summary: {
        totalRevenue: 0,
        totalOrders: orders.length,
        successfulPayments: payments.filter(p => p.status === 'captured').length,
        failedPayments: payments.filter(p => p.status === 'failed').length,
        totalCustomers: new Set(orders.map(o => o.user_id)).size,
        averageOrderValue: 0,
        conversionRate: 0
      },
      revenue: {
        byPlan: {} as Record<string, number>,
        byCurrency: {} as Record<string, number>,
        byBillingCycle: {} as Record<string, number>,
        daily: [] as Array<{ date: string; revenue: number; orders: number }>
      },
      plans: {
        starter: { orders: 0, revenue: 0, customers: 0 },
        growth: { orders: 0, revenue: 0, customers: 0 },
        scale: { orders: 0, revenue: 0, customers: 0 }
      },
      recentPayments: payments.slice(0, 10).map(payment => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        plan: payment.payment_orders?.[0]?.plan_id || 'unknown',
        customer: payment.payment_orders?.[0]?.user_profiles?.[0]?.business_name || payment.payment_orders?.[0]?.user_profiles?.[0]?.full_name || 'Unknown',
        date: payment.created_at
      }))
    };

    // Calculate revenue metrics
    const successfulPayments = payments.filter(p => p.status === 'captured');
    
    analytics.summary.totalRevenue = successfulPayments.reduce((sum, p) => {
      const amount = p.currency === 'INR' ? p.amount / 100 : p.amount; // Convert paise to rupees
      return sum + amount;
    }, 0);

    analytics.summary.averageOrderValue = analytics.summary.totalOrders > 0 
      ? analytics.summary.totalRevenue / analytics.summary.totalOrders 
      : 0;

    analytics.summary.conversionRate = analytics.summary.totalOrders > 0 
      ? (analytics.summary.successfulPayments / analytics.summary.totalOrders) * 100 
      : 0;

    // Calculate revenue by plan
    successfulPayments.forEach(payment => {
      const plan = payment.payment_orders?.[0]?.plan_id || 'unknown';
      const amount = payment.currency === 'INR' ? payment.amount / 100 : payment.amount;
      
      if (!analytics.revenue.byPlan[plan]) {
        analytics.revenue.byPlan[plan] = 0;
      }
      analytics.revenue.byPlan[plan] += amount;

      // Update plan analytics
      if (analytics.plans[plan as keyof typeof analytics.plans]) {
        analytics.plans[plan as keyof typeof analytics.plans].revenue += amount;
        analytics.plans[plan as keyof typeof analytics.plans].orders += 1;
      }
    });

    // Calculate revenue by currency
    successfulPayments.forEach(payment => {
      const amount = payment.currency === 'INR' ? payment.amount / 100 : payment.amount;
      if (!analytics.revenue.byCurrency[payment.currency]) {
        analytics.revenue.byCurrency[payment.currency] = 0;
      }
      analytics.revenue.byCurrency[payment.currency] += amount;
    });

    // Calculate revenue by billing cycle
    successfulPayments.forEach(payment => {
      const amount = payment.currency === 'INR' ? payment.amount / 100 : payment.amount;
      const cycle = payment.payment_orders?.[0]?.billing_cycle || 'unknown';
      if (!analytics.revenue.byBillingCycle[cycle]) {
        analytics.revenue.byBillingCycle[cycle] = 0;
      }
      analytics.revenue.byBillingCycle[cycle] += amount;
    });

    // Calculate daily revenue
    const dailyRevenue: Record<string, { revenue: number; orders: number }> = {};
    successfulPayments.forEach(payment => {
      const date = payment.created_at.split('T')[0];
      const amount = payment.currency === 'INR' ? payment.amount / 100 : payment.amount;
      
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = { revenue: 0, orders: 0 };
      }
      dailyRevenue[date].revenue += amount;
      dailyRevenue[date].orders += 1;
    });

    analytics.revenue.daily = Object.entries(dailyRevenue)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate unique customers per plan
    const planCustomers: Record<string, Set<string>> = {};
    orders.forEach(order => {
      if (!planCustomers[order.plan_id]) {
        planCustomers[order.plan_id] = new Set();
      }
      planCustomers[order.plan_id].add(order.user_id);
    });

    Object.entries(planCustomers).forEach(([plan, customers]) => {
      if (analytics.plans[plan as keyof typeof analytics.plans]) {
        analytics.plans[plan as keyof typeof analytics.plans].customers = customers.size;
      }
    });

    console.log('✅ Payment analytics calculated successfully');
    console.log('📊 Summary:', analytics.summary);

    return NextResponse.json({
      success: true,
      analytics,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Payment analytics error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch payment analytics',
      details: error.message 
    }, { status: 500 });
  }
}
