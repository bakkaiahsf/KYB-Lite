import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - KYB Lite',
  description: 'Company intelligence dashboard for due diligence and risk analysis',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No authentication required - public access
  const mockUser = null;
  const subscriptionTier = 'demo';

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <DashboardSidebar 
          user={mockUser} 
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