import { NextResponse } from 'next/server';

/**
 * Test endpoint to validate environment variables
 * This endpoint helps debug authentication issues by checking if required env vars are present
 */
export async function GET() {
  try {
    const envCheck = {
      // Check if critical environment variables are present (without exposing values)
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nextauth_secret: !!process.env.NEXTAUTH_SECRET,
      nextauth_url: !!process.env.NEXTAUTH_URL,
      companies_house_key: !!process.env.COMPANIES_HOUSE_API_KEY,
      google_client_id: !!process.env.GOOGLE_CLIENT_ID,
      google_client_secret: !!process.env.GOOGLE_CLIENT_SECRET,
      stripe_public: !!process.env.STRIPE_PUBLIC_KEY,
      stripe_secret: !!process.env.STRIPE_SECRET_KEY,
      
      // Show partial values for verification (safe parts only)
      supabase_url_partial: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 20) + '...',
      nextauth_url_partial: process.env.NEXTAUTH_URL?.slice(0, 30) + '...',
      
      // Environment info
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV,
      
      // Timestamp
      timestamp: new Date().toISOString(),
    };

    // Count how many critical variables are set
    const criticalVars = [
      'supabase_url',
      'supabase_anon_key', 
      'supabase_service_role',
      'nextauth_secret',
      'nextauth_url'
    ];
    
    const setCriticalVars = criticalVars.filter(key => envCheck[key as keyof typeof envCheck]).length;
    
    return NextResponse.json({
      status: 'success',
      message: 'Environment variables check completed',
      critical_vars_set: `${setCriticalVars}/${criticalVars.length}`,
      all_critical_set: setCriticalVars === criticalVars.length,
      environment_check: envCheck,
      recommendation: setCriticalVars < criticalVars.length 
        ? 'Set missing critical environment variables in Vercel dashboard'
        : 'All critical environment variables are configured'
    }, { status: 200 });

  } catch (error) {
    console.error('Environment check error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check environment variables',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}