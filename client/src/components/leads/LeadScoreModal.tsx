import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeadScoreBreakdown, LeadScoreCategory } from '@/types/leads.types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface LeadScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: LeadScoreBreakdown | null;
  loading?: boolean;
}

export const LeadScoreModal: React.FC<LeadScoreModalProps> = ({
  isOpen,
  onClose,
  breakdown,
  loading = false
}) => {
  if (!isOpen) return null;

  const getCategoryBadge = (category: LeadScoreCategory) => {
    switch (category) {
      case 'HOT':
        return <Badge variant="emerald">Hot (80–100)</Badge>;
      case 'WARM':
        return <Badge variant="blue">Warm (60–79)</Badge>;
      case 'COOL':
        return <Badge variant="slate" className="text-slate-300">Cool (30–59)</Badge>;
      case 'COLD':
      default:
        return <Badge variant="slate" className="text-vynexa-text-muted">Cold (0–29)</Badge>;
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Why this score?" maxWidth="md">
      <div className="space-y-6">
        <p className="text-xs text-vynexa-text-muted">
          Based on the information and activity in your CRM.
        </p>

        {loading || !breakdown ? (
          <div className="py-12 text-center text-xs text-vynexa-text-muted">
            Calculating score breakdown...
          </div>
        ) : (
          <>
            {/* Score Banner */}
            <div className="flex items-center justify-between p-4 bg-vynexa-surface-secondary rounded-lg border border-vynexa-border">
              <div>
                <span className="text-xs text-vynexa-text-muted uppercase tracking-wider font-semibold">
                  Overall Lead Score
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-bold font-mono text-vynexa-text-primary">
                    {breakdown.score}
                  </span>
                  <span className="text-sm text-vynexa-text-muted font-mono">/ 100</span>
                </div>
              </div>
              <div>{getCategoryBadge(breakdown.category)}</div>
            </div>

            {/* Point Allocation Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider">
                Scoring Factor Breakdown
              </h4>

              <div className="space-y-2.5 text-xs">
                {/* 1. Lead Fit */}
                <div className="p-2.5 bg-vynexa-surface rounded border border-vynexa-border space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-vynexa-text-primary">Lead Fit</span>
                    <span className="font-mono font-semibold text-vynexa-text-primary">
                      {breakdown.breakdown.fit} / {breakdown.breakdown.fitMax}
                    </span>
                  </div>
                  <div className="w-full bg-vynexa-surface-elevated h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-vynexa-accent h-full rounded-full transition-all"
                      style={{ width: `${(breakdown.breakdown.fit / breakdown.breakdown.fitMax) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 2. Contact Quality */}
                <div className="p-2.5 bg-vynexa-surface rounded border border-vynexa-border space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-vynexa-text-primary">Contact Quality</span>
                    <span className="font-mono font-semibold text-vynexa-text-primary">
                      {breakdown.breakdown.contactQuality} / {breakdown.breakdown.contactQualityMax}
                    </span>
                  </div>
                  <div className="w-full bg-vynexa-surface-elevated h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-400 h-full rounded-full transition-all"
                      style={{ width: `${(breakdown.breakdown.contactQuality / breakdown.breakdown.contactQualityMax) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 3. Engagement */}
                <div className="p-2.5 bg-vynexa-surface rounded border border-vynexa-border space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-vynexa-text-primary">Engagement</span>
                    <span className="font-mono font-semibold text-vynexa-text-primary">
                      {breakdown.breakdown.engagement} / {breakdown.breakdown.engagementMax}
                    </span>
                  </div>
                  <div className="w-full bg-vynexa-surface-elevated h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all"
                      style={{ width: `${(breakdown.breakdown.engagement / breakdown.breakdown.engagementMax) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 4. Opportunity Signal */}
                <div className="p-2.5 bg-vynexa-surface rounded border border-vynexa-border space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-vynexa-text-primary">Opportunity Signal</span>
                    <span className="font-mono font-semibold text-vynexa-text-primary">
                      {breakdown.breakdown.opportunity} / {breakdown.breakdown.opportunityMax}
                    </span>
                  </div>
                  <div className="w-full bg-vynexa-surface-elevated h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all"
                      style={{ width: `${(breakdown.breakdown.opportunity / breakdown.breakdown.opportunityMax) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 5. Recent Activity */}
                <div className="p-2.5 bg-vynexa-surface rounded border border-vynexa-border space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-vynexa-text-primary">Recent Activity</span>
                    <span className="font-mono font-semibold text-vynexa-text-primary">
                      {breakdown.breakdown.recency} / {breakdown.breakdown.recencyMax}
                    </span>
                  </div>
                  <div className="w-full bg-vynexa-surface-elevated h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full rounded-full transition-all"
                      style={{ width: `${(breakdown.breakdown.recency / breakdown.breakdown.recencyMax) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Negative Signals if any */}
                {breakdown.breakdown.negativeSignals > 0 && (
                  <div className="p-2.5 bg-rose-500/10 rounded border border-rose-500/30 flex justify-between items-center text-rose-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <AlertCircle className="h-3.5 w-3.5" /> Deductions / Penalties
                    </span>
                    <span className="font-mono font-semibold">
                      -{breakdown.breakdown.negativeSignals}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contributing Reasons */}
            {breakdown.reasons.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-vynexa-border">
                <h4 className="text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider">
                  Contributing Factors
                </h4>
                <ul className="space-y-1.5">
                  {breakdown.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-vynexa-text-secondary">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
