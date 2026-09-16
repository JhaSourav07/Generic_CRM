import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-vynexa-border bg-vynexa-bg/90 backdrop-blur-md transition-all duration-150">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Wordmark */}
        <Link to="/" className="flex items-center gap-3 group focus-visible:outline-none">
          <div className="h-8 w-8 rounded-md bg-vynexa-text-primary text-vynexa-bg flex items-center justify-center font-bold text-sm shadow-subtle group-hover:bg-vynexa-white transition-colors select-none">
            V
          </div>
          <div className="flex flex-col select-none">
            <span className="text-sm font-extrabold tracking-widest text-vynexa-text-primary leading-tight font-mono">
              VYNEXA
            </span>
            <span className="text-[9px] text-vynexa-text-muted font-medium tracking-widest font-mono">
              CRM
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-vynexa-text-secondary select-none">
          <a href="#product" className="hover:text-vynexa-text-primary transition-colors">Overview</a>
          <a href="#solutions" className="hover:text-vynexa-text-primary transition-colors">Features</a>
          <a href="#workflow" className="hover:text-vynexa-text-primary transition-colors">How it works</a>
          <a href="#insights" className="hover:text-vynexa-text-primary transition-colors">Reports</a>
        </nav>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Get started
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-vynexa-text-muted hover:text-vynexa-text-primary p-1.5 focus-visible:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-vynexa-border bg-vynexa-surface p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-3 text-xs font-medium text-vynexa-text-secondary">
            <a
              href="#product"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-vynexa-text-primary transition-colors"
            >
              Overview
            </a>
            <a
              href="#solutions"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-vynexa-text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-vynexa-text-primary transition-colors"
            >
              How it works
            </a>
            <a
              href="#insights"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-vynexa-text-primary transition-colors"
            >
              Reports
            </a>
          </nav>

          <div className="pt-3 border-t border-vynexa-border flex flex-col gap-2">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" size="sm" className="w-full justify-center">Sign in</Button>
            </Link>
            <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="sm" className="w-full justify-center" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                Get started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
