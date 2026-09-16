import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Zap, Layers, Lock } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-20 pb-16 px-4 sm:px-6 border-b border-vynexa-border/60">
      <div className="mx-auto max-w-4xl text-center space-y-6">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-vynexa-border bg-vynexa-surface-secondary text-[11px] font-mono text-vynexa-text-secondary select-none">
          <span className="h-1.5 w-1.5 rounded-full bg-vynexa-status-success" />
          <span>VYNEXA CRM</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-vynexa-text-primary leading-[1.15]">
          Keep your sales, customers, <br />
          <span className="text-vynexa-text-secondary">tasks, and support in one place.</span>
        </h1>

        {/* Supporting Text */}
        <p className="mx-auto max-w-2xl text-xs sm:text-sm md:text-base text-vynexa-text-secondary font-normal leading-relaxed">
          Manage leads, sales, customer details, quotes, and support in one fast, simple CRM. Built for business owners and sales teams who want clarity without clutter.
        </p>

        {/* Call to Action Buttons */}
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

        {/* Architecture Assurance Bar */}
        <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          {[
            { icon: ShieldCheck, title: 'Private & Secure', desc: 'Your data stays separated and protected' },
            { icon: Zap, title: 'Fast & Focused', desc: 'Clean interface designed for quick scanning' },
            { icon: Layers, title: 'Full Sales Journey', desc: 'From new lead to signed order' },
            { icon: Lock, title: 'Team Access', desc: 'Choose what each team member can access' }
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-vynexa-border bg-vynexa-surface">
              <item.icon className="h-4 w-4 text-vynexa-text-primary mb-1.5" />
              <p className="text-xs font-semibold text-vynexa-text-primary">{item.title}</p>
              <p className="text-[11px] text-vynexa-text-muted mt-0.5 leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
