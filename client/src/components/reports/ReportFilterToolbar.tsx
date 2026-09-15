import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { usersService } from '@/services/users.service';
import { ReportFilterParams, ReportType } from '@/types/reports.types';
import { Download, RefreshCw, Calendar } from 'lucide-react';

export interface ReportFilterToolbarProps {
  filters: ReportFilterParams;
  onFilterChange: (filters: ReportFilterParams) => void;
  onExport: () => Promise<void>;
  isExporting?: boolean;
  reportType?: ReportType;
}

export const ReportFilterToolbar: React.FC<ReportFilterToolbarProps> = ({
  filters,
  onFilterChange,
  onExport,
  isExporting = false
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [activePreset, setActivePreset] = useState<string>('all');

  useEffect(() => {
    usersService
      .getUsers({ limit: 100 })
      .then((res: any) => {
        setUsers(res.users || res.data || []);
      })
      .catch(() => {});
  }, []);

  const setDatePreset = (preset: string) => {
    setActivePreset(preset);
    const now = new Date();

    if (preset === 'all') {
      onFilterChange({
        ...filters,
        startDate: undefined,
        endDate: undefined
      });
      return;
    }

    let start = new Date();
    let end = new Date();

    if (preset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (preset === 'last7') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (preset === 'last30') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (preset === 'quarter') {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterMonth, 1);
    } else if (preset === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
    }

    onFilterChange({
      ...filters,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  };

  const handleCustomDate = (field: 'startDate' | 'endDate', val: string) => {
    setActivePreset('custom');
    onFilterChange({
      ...filters,
      [field]: val || undefined
    });
  };

  const handleReset = () => {
    setActivePreset('all');
    onFilterChange({});
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-vynexa-border bg-vynexa-surface p-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Date Presets & Custom Range */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-md border border-vynexa-border bg-vynexa-surface-secondary/40 p-0.5 text-xs">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'last7', label: '7D' },
            { id: 'last30', label: '30D' },
            { id: 'quarter', label: 'Quarter' },
            { id: 'year', label: 'Year' }
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setDatePreset(preset.id)}
              className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                activePreset === preset.id
                  ? 'bg-vynexa-surface text-vynexa-text-primary shadow-xs'
                  : 'text-vynexa-text-muted hover:text-vynexa-text-secondary'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-vynexa-text-muted">
          <Calendar className="h-3.5 w-3.5" />
          <Input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleCustomDate('startDate', e.target.value)}
            className="h-7 w-32 text-xs py-0 px-2"
          />
          <span>to</span>
          <Input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleCustomDate('endDate', e.target.value)}
            className="h-7 w-32 text-xs py-0 px-2"
          />
        </div>

        {/* User filter */}
        {users.length > 0 && (
          <div className="w-40">
            <Select
              value={filters.ownerId || filters.assignedToId || ''}
              onChange={(e) => {
                const val = e.target.value || undefined;
                onFilterChange({
                  ...filters,
                  ownerId: val,
                  assignedToId: val
                });
              }}
              className="h-7 text-xs py-0"
            >
              <option value="">All Team Members</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Export & Actions */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        {(filters.startDate || filters.endDate || filters.ownerId) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs px-2 text-vynexa-text-muted hover:text-vynexa-text-primary"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExporting}
          className="h-7 text-xs px-2.5 font-medium border-vynexa-border text-vynexa-text-primary hover:bg-vynexa-surface-secondary"
        >
          <Download className={`h-3.5 w-3.5 mr-1.5 ${isExporting ? 'animate-bounce' : ''}`} />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>
    </div>
  );
};
