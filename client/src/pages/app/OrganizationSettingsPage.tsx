import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Globe,
  DollarSign,
  Clock,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Users
} from 'lucide-react';
import { organizationService } from '@/services/organization.service';
import { OrganizationDetails } from '@/types/organization.types';

export const OrganizationSettingsPage: React.FC = () => {
  const [org, setOrg] = useState<OrganizationDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    currency: 'USD',
    timezone: 'UTC'
  });

  const fetchOrganization = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationService.getCurrentOrganization();
      setOrg(data);
      setFormData({
        name: data.name,
        slug: data.slug,
        currency: data.currency || 'USD',
        timezone: data.timezone || 'UTC'
      });
    } catch (_err: any) {
      setError(_err.message || 'Failed to fetch active organization settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formData.name.trim() || !formData.slug.trim()) {
      setError('Organization name and URL slug are required.');
      return;
    }

    setSaving(true);
    try {
      const updated = await organizationService.updateOrganization({
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase(),
        currency: formData.currency,
        timezone: formData.timezone
      });
      setOrg(updated);
      setSuccessMsg('Settings saved successfully.');
    } catch (_err: any) {
      setError(_err.message || 'Failed to update organization details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Settings"
        description="Update your organization details, currency, and timezone."
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Settings' }
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={fetchOrganization} isLoading={loading} className="h-8">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        }
      />

      {error && (
        <Card className="bg-vynexa-surface border-vynexa-status-danger/40">
          <CardContent className="p-4 flex items-center gap-3 text-vynexa-status-danger text-xs">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>{error}</div>
          </CardContent>
        </Card>
      )}

      {successMsg && (
        <Card className="bg-vynexa-surface border-vynexa-status-success/40">
          <CardContent className="p-4 flex items-center gap-3 text-vynexa-status-success text-xs">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>{successMsg}</div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ORGANIZATION SUMMARY CARD */}
        <Card className="bg-vynexa-surface border-vynexa-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-vynexa-text flex items-center gap-2">
              <Building2 className="h-4 w-4 text-vynexa-primary" />
              Organization details
            </CardTitle>
            <CardDescription className="text-xs text-vynexa-muted">
              Your organization identifier and summary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-mono">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : org ? (
              <>
                <div className="p-3 bg-vynexa-bg border border-vynexa-border rounded-md space-y-2">
                  <div className="text-[11px] text-vynexa-muted uppercase tracking-wider">Organization ID</div>
                  <div className="text-vynexa-primary truncate select-all">{org.id}</div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-vynexa-border">
                  <span className="text-vynexa-muted">Slug</span>
                  <Badge variant="outline" className="font-mono text-vynexa-text">
                    {org.slug}
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-vynexa-border">
                  <span className="text-vynexa-muted">Team members</span>
                  <span className="text-vynexa-text font-bold flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-vynexa-muted" />
                    {org._count?.users ?? 1}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-vynexa-muted">Date created</span>
                  <span className="text-vynexa-text">{new Date(org.createdAt).toLocaleDateString()}</span>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* EDIT ORGANIZATION FORM */}
        <Card className="bg-vynexa-surface border-vynexa-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-vynexa-text flex items-center gap-2">
              <Globe className="h-4 w-4 text-vynexa-primary" />
              Preferences
            </CardTitle>
            <CardDescription className="text-xs text-vynexa-muted">
              Manage your company profile and regional preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-vynexa-muted mb-1 font-medium">Organization name *</label>
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-vynexa-bg border-vynexa-border h-9"
                    placeholder="e.g. Acme Corporation"
                  />
                </div>

                <div>
                  <label className="block text-vynexa-muted mb-1 font-medium">Organization slug *</label>
                  <Input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                    className="bg-vynexa-bg border-vynexa-border h-9 font-mono"
                    placeholder="e.g. acme-corp"
                  />
                  <p className="text-[11px] text-vynexa-muted mt-1">
                    Used in your account URL. Use only lowercase letters, numbers, and hyphens.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-vynexa-muted mb-1 font-medium flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-vynexa-primary" />
                      Currency *
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full h-9 bg-vynexa-bg border border-vynexa-border rounded-md px-3 text-vynexa-text focus:outline-none focus:border-vynexa-primary font-mono"
                    >
                      <option value="USD">USD ($) — US Dollar</option>
                      <option value="EUR">EUR (€) — Euro</option>
                      <option value="GBP">GBP (£) — British Pound</option>
                      <option value="INR">INR (₹) — Indian Rupee</option>
                      <option value="AUD">AUD ($) — Australian Dollar</option>
                      <option value="CAD">CAD ($) — Canadian Dollar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-vynexa-muted mb-1 font-medium flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-vynexa-primary" />
                      Timezone *
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full h-9 bg-vynexa-bg border border-vynexa-border rounded-md px-3 text-vynexa-text focus:outline-none focus:border-vynexa-primary font-mono"
                    >
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">America/New_York (EST/EDT)</option>
                      <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-vynexa-border flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={saving}
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save changes
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
