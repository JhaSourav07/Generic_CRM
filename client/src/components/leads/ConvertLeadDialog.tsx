import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { leadsService } from '@/services/leads.service';
import { Lead } from '@/types/leads.types';
import { useToast } from '@/components/ui/toast';
import { Building2, UserCheck, TrendingUp, AlertTriangle } from 'lucide-react';

interface ConvertLeadDialogProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export const ConvertLeadDialog: React.FC<ConvertLeadDialogProps> = ({ isOpen, lead, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Account State
  const [accountName, setAccountName] = useState('');
  const [accountIndustry, setAccountIndustry] = useState('');

  // Contact State
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactJobTitle, setContactJobTitle] = useState('');

  // Opportunity State
  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [opportunityName, setOpportunityName] = useState('');
  const [opportunityValue, setOpportunityValue] = useState(0);

  useEffect(() => {
    if (isOpen && lead) {
      const companyOrName = lead.company?.trim() || `${lead.firstName} ${lead.lastName} Corp`;
      setAccountName(companyOrName);
      setAccountIndustry('');

      setContactFirstName(lead.firstName);
      setContactLastName(lead.lastName);
      setContactEmail(lead.email || '');
      setContactPhone(lead.phone || '');
      setContactJobTitle(lead.jobTitle || '');

      setCreateOpportunity(true);
      setOpportunityName(`${companyOrName} Deal`);
      setOpportunityValue(5000);
    }
  }, [isOpen, lead]);

  if (!lead) return null;

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lead.status === 'CONVERTED') {
      toast({
        type: 'warning',
        title: 'Already Converted',
        message: 'This lead has already been converted.'
      });
      return;
    }

    try {
      setLoading(true);

      const result = await leadsService.convertLead(lead.id, {
        account: {
          name: accountName,
          industry: accountIndustry || undefined
        },
        contact: {
          firstName: contactFirstName,
          lastName: contactLastName,
          email: contactEmail || undefined,
          phone: contactPhone || undefined,
          jobTitle: contactJobTitle || undefined
        },
        createOpportunity,
        opportunity: createOpportunity
          ? {
              name: opportunityName,
              value: Number(opportunityValue)
            }
          : undefined
      });

      toast({
        type: 'success',
        title: 'Lead converted',
        message: `Lead converted to customer, contact${createOpportunity ? ', and deal' : ''}.`
      });

      onSuccess(result);
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Conversion failed',
        message: err.message || 'An error occurred while converting the lead.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Convert lead"
      description="Convert this lead into a customer and contact person, with an optional deal."
      maxWidth="xl"
    >
      <form onSubmit={handleConvert} className="space-y-6">
        {/* Status Alert if already converted */}
        {lead.status === 'CONVERTED' && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>This lead has already been converted and cannot be converted again.</span>
          </div>
        )}

        {/* Lead Context Header */}
        <div className="p-3 bg-vynexa-surface-secondary border border-vynexa-border rounded-md text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-vynexa-text-primary">
              Lead: {lead.firstName} {lead.lastName}
            </span>
            <Badge variant="emerald">Score: {lead.score}</Badge>
          </div>
          <p className="text-vynexa-text-muted">
            Company: {lead.company || 'N/A'} | Email: {lead.email || 'N/A'} | Phone: {lead.phone || 'N/A'}
          </p>
        </div>

        {/* 1. Customer Section */}
        <div className="space-y-3 p-4 bg-vynexa-surface rounded-lg border border-vynexa-border">
          <div className="flex items-center gap-2 text-sm font-semibold text-vynexa-text-primary">
            <Building2 className="h-4 w-4 text-emerald-400" />
            <span>1. Customer</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Company name *"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
            <Input
              label="Industry"
              placeholder="e.g. Technology, Finance"
              value={accountIndustry}
              onChange={(e) => setAccountIndustry(e.target.value)}
            />
          </div>
        </div>

        {/* 2. Contact Person Section */}
        <div className="space-y-3 p-4 bg-vynexa-surface rounded-lg border border-vynexa-border">
          <div className="flex items-center gap-2 text-sm font-semibold text-vynexa-text-primary">
            <UserCheck className="h-4 w-4 text-blue-400" />
            <span>2. Contact person</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name *"
              value={contactFirstName}
              onChange={(e) => setContactFirstName(e.target.value)}
              required
            />
            <Input
              label="Last name *"
              value={contactLastName}
              onChange={(e) => setContactLastName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <Input
              label="Phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
            <Input
              label="Job title"
              value={contactJobTitle}
              onChange={(e) => setContactJobTitle(e.target.value)}
            />
          </div>
        </div>

        {/* 3. Optional Deal Section */}
        <div className="space-y-3 p-4 bg-vynexa-surface rounded-lg border border-vynexa-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-vynexa-text-primary">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              <span>3. Deal</span>
            </div>
            <Checkbox
              label="Create a deal"
              checked={createOpportunity}
              onCheckedChange={(checked) => setCreateOpportunity(checked)}
            />
          </div>

          {createOpportunity && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-vynexa-border/60">
              <Input
                label="Deal name *"
                value={opportunityName}
                onChange={(e) => setOpportunityName(e.target.value)}
                required={createOpportunity}
              />
              <Input
                label="Estimated value ($)"
                type="number"
                min={0}
                value={opportunityValue}
                onChange={(e) => setOpportunityValue(Number(e.target.value))}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-vynexa-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            disabled={lead.status === 'CONVERTED'}
            leftIcon={<UserCheck className="h-4 w-4" />}
          >
            Convert lead
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
