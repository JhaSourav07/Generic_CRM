import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Lock, Mail, User, Building } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-vynexa-bg text-vynexa-text-primary">
      <div className="w-full max-w-md space-y-6">
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
            Create your organization workspace
          </h1>
          <p className="text-xs text-vynexa-text-secondary">
            Set up a multi-tenant enterprise CRM workspace for your company
          </p>
        </div>

        {/* Signup Form Box */}
        <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-6 shadow-elevated">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Alex Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="h-4 w-4" />}
              required
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="alex.vance@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />

            <Input
              label="Organization Name"
              type="text"
              placeholder="Acme Global Inc."
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              leftIcon={<Building className="h-4 w-4" />}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              Create Account
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-vynexa-border text-center text-xs text-vynexa-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-vynexa-text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        <div className="text-center text-[11px] font-mono text-vynexa-text-muted">
          Enterprise Tenant Boundaries &amp; RBAC Protocols Applied Automatically
        </div>
      </div>
    </div>
  );
};
