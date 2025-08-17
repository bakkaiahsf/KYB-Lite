import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Nexus AI',
  description: 'Company intelligence dashboard for due diligence and risk analysis',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/signin');
  }

  // Get user subscription information
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const subscriptionTier = subscription?.status === 'active' 
    ? subscription.price_id?.includes('pro') ? 'pro'
    : subscription.price_id?.includes('enterprise') ? 'enterprise' 
    : subscription.price_id?.includes('basic') ? 'basic'
    : 'free'
    : 'free';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <DashboardSidebar 
          user={user} 
          subscriptionTier={subscriptionTier}
        />
        
        {/* Main content */}
        <div className="flex-1 lg:ml-64">
          <main className="min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}