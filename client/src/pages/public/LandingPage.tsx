import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { CRMCapabilities } from '@/components/landing/CRMCapabilities';
import { CustomerLifecycle } from '@/components/landing/CustomerLifecycle';
import { PipelineShowcase } from '@/components/landing/PipelineShowcase';
import { TeamWorkspace } from '@/components/landing/TeamWorkspace';
import { InsightsShowcase } from '@/components/landing/InsightsShowcase';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-vynexa-bg text-vynexa-text-primary font-sans antialiased selection:bg-vynexa-border selection:text-vynexa-text-primary">
      {/* 1. Header Navigation */}
      <Navbar />

      <main>
        {/* 2. Hero Section */}
        <Hero />

        {/* 3. High-Density Product Viewport Simulation */}
        <ProductPreview />

        {/* 4. CRM Capabilities Grid */}
        <CRMCapabilities />

        {/* 5. Connected Customer Lifecycle Sequence */}
        <CustomerLifecycle />

        {/* 6. Sales Pipeline Showcase */}
        <PipelineShowcase />

        {/* 7. Team Workspace & Agenda */}
        <TeamWorkspace />

        {/* 8. Reporting & Business Intelligence */}
        <InsightsShowcase />

        {/* 9. Security & Enterprise Multi-Tenancy */}
        <SecuritySection />

        {/* 10. Final Call To Action */}
        <FinalCTA />
      </main>

      {/* 11. Footer */}
      <Footer />
    </div>
  );
};
