import { Metadata } from 'next';
import Hero from '@/components/ui/Hero';
import CompanySearch from '@/components/ui/CompanySearch';

export const metadata: Metadata = {
  title: 'KYB Lite - Company Analysis & Due Diligence',
  description: 'Advanced company analysis powered by Companies House data and AI. Search companies, analyze ownership structures, and get insights for due diligence.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <CompanySearch />
    </div>
  );
}
