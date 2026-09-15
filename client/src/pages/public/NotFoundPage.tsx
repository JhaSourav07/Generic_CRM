import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-vynexa-bg flex flex-col justify-center items-center px-4 text-vynexa-text-primary select-none">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Brand Logo */}
        <div className="inline-flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-vynexa-text-primary text-vynexa-bg flex items-center justify-center font-bold text-sm shadow-subtle font-mono">
            V
          </div>
          <span className="text-base font-bold tracking-widest text-vynexa-text-primary font-mono">
            VYNEXA
          </span>
        </div>

        {/* 404 Visual Indicator */}
        <div className="space-y-2">
          <div className="text-5xl font-mono font-bold tracking-tight text-vynexa-text-muted/60">
            404
          </div>
          <h1 className="text-xl font-bold tracking-tight text-vynexa-text-primary">
            Page not found
          </h1>
          <p className="text-xs text-vynexa-text-secondary max-w-xs mx-auto leading-relaxed">
            The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto text-xs"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Go Back
          </Button>
          <Link to="/app/dashboard" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              className="w-full sm:w-auto text-xs"
            >
              <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
