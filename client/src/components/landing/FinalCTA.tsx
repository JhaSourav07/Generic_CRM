import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const FinalCTA: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 border-b border-vynexa-border bg-vynexa-surface/40">
      <div className="mx-auto max-w-4xl rounded-xl border border-vynexa-border bg-vynexa-surface p-8 sm:p-12 text-center space-y-6 shadow-elevated">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-vynexa-border bg-vynexa-surface-secondary text-[11px] font-mono text-vynexa-text-secondary select-none">
          <span>READY FOR DEPLOYMENT</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-vynexa-text-primary leading-tight">
          Bring your customer operations <br />
          into one connected system.
        </h2>

        <p className="mx-auto max-w-xl text-xs sm:text-sm text-vynexa-text-secondary leading-relaxed">
          Start building a clearer, more connected CRM workflow with Vynexa. Manage leads, opportunities, quotes, and support in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/signup" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Get started
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
