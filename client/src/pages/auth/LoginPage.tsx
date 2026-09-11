import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Visual shell flow — navigate to app shell
    setTimeout(() => {
      setIsLoading(false);
      navigate('/app/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-vynexa-bg text-vynexa-text-primary">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-md bg-vynexa-text-primary text-vynexa-bg flex items-center justify-center font-bold text-sm shadow-subtle">
              V
            </div>
            <span className="text-base font-bold tracking-widest text-vynexa-text-primary font-mono">
              VYNEXA CRM
            </span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-vynexa-text-primary">
            Sign in to your workspace
          </h1>
          <p className="text-xs text-vynexa-text-secondary">
            Enter your credentials to access your organization workspace
          </p>
        </div>

        {/* Login Form Box */}
        <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-6 shadow-elevated">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="alex.vance@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-vynexa-text-secondary">Password</label>
                <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-[11px] text-vynexa-text-muted hover:text-vynexa-text-secondary transition-colors">
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-vynexa-border text-center text-xs text-vynexa-text-secondary">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-vynexa-text-primary hover:underline">
              Create account
            </Link>
          </div>
        </div>

        <div className="text-center text-[11px] font-mono text-vynexa-text-muted">
          Protected by Vynexa Enterprise Multi-Tenancy Engine
        </div>
      </div>
    </div>
  );
};
