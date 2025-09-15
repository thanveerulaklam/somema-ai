import { NextRequest, NextResponse } from 'next/server';
import { getHealthCheckData } from '../../../lib/monitoring';

/**
 * Health check endpoint for monitoring and load balancers
 */
export async function GET(request: NextRequest) {
  try {
    const healthData = getHealthCheckData();
    
    // Set appropriate status code based on health status
    const statusCode = healthData.status === 'healthy' ? 200 : 
                      healthData.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(healthData, { status: statusCode });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 503 });
  }
}
