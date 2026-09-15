import React from 'react';

export interface DistributionSegment {
  label: string;
  count: number;
  percentage?: number;
  colorClass?: string;
  valueSecondary?: string;
}

export interface DistributionBarProps {
  title?: string;
  segments: DistributionSegment[];
  totalCount?: number;
  emptyMessage?: string;
}

const DEFAULT_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-zinc-500',
  'bg-indigo-500'
];

export const DistributionBar: React.FC<DistributionBarProps> = ({
  title,
  segments,
  totalCount,
  emptyMessage = 'No data available'
}) => {
  const calculatedTotal =
    totalCount !== undefined
      ? totalCount
      : segments.reduce((sum, s) => sum + s.count, 0);

  if (calculatedTotal === 0 || segments.length === 0) {
    return (
      <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
        {title && (
          <h4 className="text-xs font-semibold text-vynexa-text-primary mb-3">
            {title}
          </h4>
        )}
        <div className="py-6 text-center text-xs text-vynexa-text-muted">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-vynexa-text-primary">
            {title}
          </h4>
          <span className="font-mono text-xs text-vynexa-text-secondary">
            Total: {calculatedTotal.toLocaleString()}
          </span>
        </div>
      )}

      {/* Progress Bar Container */}
      <div className="h-2.5 w-full rounded-full bg-vynexa-surface-secondary overflow-hidden flex">
        {segments.map((segment, index) => {
          const pct =
            segment.percentage !== undefined
              ? segment.percentage
              : (segment.count / calculatedTotal) * 100;

          if (pct <= 0) return null;

          const color = segment.colorClass || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

          return (
            <div
              key={segment.label}
              style={{ width: `${pct}%` }}
              className={`h-full ${color} transition-all duration-300 relative group`}
              title={`${segment.label}: ${segment.count.toLocaleString()} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Segments Legend Grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
        {segments.map((segment, index) => {
          const pct =
            segment.percentage !== undefined
              ? segment.percentage
              : (segment.count / calculatedTotal) * 100;

          const color = segment.colorClass || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

          return (
            <div
              key={segment.label}
              className="flex items-center justify-between p-1.5 rounded bg-vynexa-surface-secondary/40 border border-vynexa-border/30"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`h-2 w-2 rounded-full shrink-0 ${color}`} />
                <span className="text-vynexa-text-secondary truncate text-[11px]">
                  {segment.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2 font-mono text-[11px]">
                <span className="text-vynexa-text-primary font-medium">
                  {segment.count.toLocaleString()}
                </span>
                <span className="text-vynexa-text-muted">
                  ({pct.toFixed(1)}%)
                </span>
                {segment.valueSecondary && (
                  <span className="text-vynexa-text-secondary ml-1">
                    {segment.valueSecondary}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
