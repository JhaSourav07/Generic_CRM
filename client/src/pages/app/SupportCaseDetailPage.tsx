import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { supportCasesService } from '@/services/support.service';
import { usersService } from '@/services/users.service';
import { SupportCase, SupportCasePriority, SupportCaseStatus } from '@/types/support.types';
import { EntityDocumentsCard } from '@/components/documents/EntityDocumentsCard';
import {
  LifeBuoy,
  Building2,
  User,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  Trash2,
  ChevronLeft,
  Calendar,
  ShieldAlert,
  FileText,
  UserCheck
} from 'lucide-react';

export const SupportCaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [supportCase, setSupportCase] = useState<SupportCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  // Action modals
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [resolving, setResolving] = useState(false);

  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');
  const [closing, setClosing] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [assigning, setAssigning] = useState(false);

  const fetchCase = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await supportCasesService.getCaseById(id);
      setSupportCase(data);
    } catch (_err) {
      toast({
        type: 'error',
        title: 'Error loading support case',
        message: 'Case not found or could not be loaded.'
      });
      navigate('/app/support');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await usersService.getUsers({ limit: 100 });
      setUsers(res.users || []);
    } catch (_err) {}
  }, []);

  useEffect(() => {
    fetchCase();
    fetchUsers();
  }, [fetchCase, fetchUsers]);

  const handleStartInvestigation = async () => {
    if (!id) return;
    try {
      const updated = await supportCasesService.changeStatus(id, 'IN_PROGRESS');
      setSupportCase(updated);
      toast({
        type: 'success',
        title: 'Status Updated',
        message: 'Case marked as In Progress.'
      });
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to update status.'
      });
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !resolutionText.trim()) return;
    try {
      setResolving(true);
      const updated = await supportCasesService.resolveCase(id, resolutionText.trim());
      setSupportCase(updated);
      setIsResolveOpen(false);
      setResolutionText('');
      toast({
        type: 'success',
        title: 'Case Resolved',
        message: 'Resolution details saved successfully.'
      });
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Resolution Failed',
        message: err.message || 'Could not resolve support case.'
      });
    } finally {
      setResolving(false);
    }
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setClosing(true);
      const updated = await supportCasesService.closeCase(id, closeNotes.trim() || undefined);
      setSupportCase(updated);
      setIsCloseOpen(false);
      setCloseNotes('');
      toast({
        type: 'success',
        title: 'Case Closed',
        message: 'Support case closed.'
      });
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to close case.'
      });
    } finally {
      setClosing(false);
    }
  };

  const handleReopen = async () => {
    if (!id) return;
    try {
      const updated = await supportCasesService.reopenCase(id);
      setSupportCase(updated);
      toast({
        type: 'success',
        title: 'Case Reopened',
        message: 'Support case reopened for review.'
      });
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to reopen case.'
      });
    }
  };

  const handleAssign = async (newAssigneeId: string) => {
    if (!id) return;
    try {
      setAssigning(true);
      const updated = await supportCasesService.assignCase(id, newAssigneeId || null);
      setSupportCase(updated);
      toast({
        type: 'success',
        title: 'Case Assigned',
        message: 'Ticket assignee updated successfully.'
      });
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Assignment Failed',
        message: err.message || 'Could not assign case.'
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      setDeleting(true);
      await supportCasesService.deleteCase(id);
      toast({
        type: 'success',
        title: 'Case Deleted',
        message: 'Support case removed.'
      });
      navigate('/app/support');
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Failed to delete case.'
      });
      setDeleting(false);
    }
  };

  const getPriorityBadge = (p: SupportCasePriority) => {
    switch (p) {
      case 'URGENT':
        return <Badge variant="red">URGENT</Badge>;
      case 'HIGH':
        return <Badge variant="amber">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge variant="blue">MEDIUM</Badge>;
      case 'LOW':
      default:
        return <Badge variant="slate">LOW</Badge>;
    }
  };

  const getStatusBadge = (s: SupportCaseStatus) => {
    switch (s) {
      case 'OPEN':
        return <Badge variant="blue">OPEN</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="amber">IN PROGRESS</Badge>;
      case 'RESOLVED':
        return <Badge variant="emerald">RESOLVED</Badge>;
      case 'CLOSED':
        return <Badge variant="slate">CLOSED</Badge>;
      default:
        return <Badge variant="slate">{s}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-6 w-32 bg-vynexa-surface-elevated animate-pulse rounded" />
        <div className="h-32 bg-vynexa-surface-elevated/40 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!supportCase) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Back Navigation Link */}
      <div className="flex items-center gap-2">
        <Link
          to="/app/support"
          className="text-xs text-vynexa-text-secondary hover:text-vynexa-text-primary flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to support
        </Link>
      </div>

      {/* Page Header */}
      <PageHeader
        title={`${supportCase.caseNumber} • ${supportCase.subject}`}
        description={`Support request created on ${new Date(supportCase.createdAt).toLocaleDateString()}`}
        actions={
          <div className="flex items-center gap-2">
            {getStatusBadge(supportCase.status)}
            {getPriorityBadge(supportCase.priority)}
            {supportCase.status === 'OPEN' && (
              <Button size="sm" variant="secondary" onClick={handleStartInvestigation}>
                <Clock className="h-3.5 w-3.5 mr-1 text-amber-400" />
                Mark in progress
              </Button>
            )}

            {(supportCase.status === 'OPEN' || supportCase.status === 'IN_PROGRESS') && (
              <Button size="sm" onClick={() => setIsResolveOpen(true)}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                Resolve request
              </Button>
            )}

            {supportCase.status === 'RESOLVED' && (
              <>
                <Button size="sm" variant="outline" onClick={handleReopen}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reopen
                </Button>
                <Button size="sm" onClick={() => setIsCloseOpen(true)}>
                  <Check className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  Close request
                </Button>
              </>
            )}

            {supportCase.status === 'CLOSED' && (
              <Button size="sm" variant="outline" onClick={handleReopen}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reopen
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDeleteOpen(true)}
              className="text-vynexa-text-muted hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      />

      {/* Grid Layout: Left Details, Right Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Case Card */}
          <Card className="p-5 bg-vynexa-surface border-vynexa-border space-y-4">
            <h3 className="text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider">
              Description
            </h3>

            <div className="text-sm text-vynexa-text-primary leading-relaxed bg-vynexa-surface-secondary/40 p-4 rounded-md border border-vynexa-border/60 whitespace-pre-wrap">
              {supportCase.description || (
                <span className="text-vynexa-text-muted italic">No description provided.</span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-vynexa-text-muted pt-2 border-t border-vynexa-border">
              <div className="flex items-center gap-1.5 font-mono">
                <Clock className="h-3.5 w-3.5" />
                Last updated: {new Date(supportCase.updatedAt).toLocaleString()}
              </div>
              {supportCase.createdBy && (
                <div className="flex items-center gap-1.5 font-mono">
                  <User className="h-3.5 w-3.5" />
                  Created by: {supportCase.createdBy.name}
                </div>
              )}
            </div>
          </Card>

          {/* Resolution Card (if resolved or closed with resolution) */}
          {supportCase.resolution && (
            <Card className="p-5 bg-vynexa-surface border-emerald-500/30 space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Resolution
                </h3>
                {supportCase.resolvedAt && (
                  <span className="text-[11px] font-mono text-emerald-400/80 ml-auto">
                    {new Date(supportCase.resolvedAt).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="text-xs text-vynexa-text-primary leading-relaxed bg-emerald-500/[0.04] p-4 rounded-md border border-emerald-500/20 whitespace-pre-wrap">
                {supportCase.resolution}
              </div>
            </Card>
          )}

          {/* Activity / Audit Timeline */}
          {supportCase.timeline && (
            <Card className="p-5 bg-vynexa-surface border-vynexa-border space-y-4">
              <h3 className="text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider">
                History and activity
              </h3>

              {supportCase.timeline.auditLogs?.length === 0 &&
              supportCase.timeline.activities?.length === 0 ? (
                <p className="text-xs text-vynexa-text-muted italic py-2">
                  No activity recorded yet.
                </p>
              ) : (
                <div className="space-y-3 divide-y divide-vynexa-border/40">
                  {supportCase.timeline.auditLogs?.map((log: any) => (
                    <div key={log.id} className="pt-2.5 first:pt-0 flex items-start justify-between text-xs">
                      <div>
                        <span className="font-semibold text-vynexa-text-primary capitalize">
                          {log.action.toLowerCase().replace(/_/g, ' ')}
                        </span>
                        <span className="text-vynexa-text-muted ml-2">by {log.user?.name || 'System'}</span>
                      </div>
                      <span className="text-[11px] font-mono text-vynexa-text-muted">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Sidebar (1 Col) */}
        <div className="space-y-6">
          {/* Assignee Card */}
          <Card className="p-4 bg-vynexa-surface border-vynexa-border space-y-3">
            <h3 className="text-[11px] font-semibold text-vynexa-text-secondary uppercase tracking-wider">
              Assigned to
            </h3>

            <div className="space-y-2">
              <Select
                value={supportCase.assignedToId || ''}
                disabled={assigning}
                onChange={(e) => handleAssign(e.target.value)}
                className="text-xs h-9"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role?.name || 'Staff'})
                  </option>
                ))}
              </Select>
              {supportCase.assignedTo && (
                <div className="flex items-center gap-2 pt-1 text-xs text-vynexa-text-secondary">
                  <Mail className="h-3.5 w-3.5 text-vynexa-text-muted" />
                  <span className="truncate">{supportCase.assignedTo.email}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Customer Account Card */}
          <Card className="p-4 bg-vynexa-surface border-vynexa-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-vynexa-text-secondary uppercase tracking-wider">
                Customer
              </h3>
              {supportCase.account && (
                <Link
                  to={`/app/customers/${supportCase.account.id}`}
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  View customer
                </Link>
              )}
            </div>

            {supportCase.account ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 font-medium text-vynexa-text-primary">
                  <Building2 className="h-4 w-4 text-vynexa-text-muted" />
                  <span>{supportCase.account.name}</span>
                </div>
                {supportCase.account.email && (
                  <div className="flex items-center gap-2 text-vynexa-text-secondary">
                    <Mail className="h-3.5 w-3.5 text-vynexa-text-muted" />
                    <span>{supportCase.account.email}</span>
                  </div>
                )}
                {supportCase.account.phone && (
                  <div className="flex items-center gap-2 text-vynexa-text-secondary">
                    <Phone className="h-3.5 w-3.5 text-vynexa-text-muted" />
                    <span>{supportCase.account.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-vynexa-text-muted italic">No customer linked.</p>
            )}
          </Card>

          {/* Contact Person Card */}
          <Card className="p-4 bg-vynexa-surface border-vynexa-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-vynexa-text-secondary uppercase tracking-wider">
                Contact person
              </h3>
              {supportCase.contact && (
                <Link
                  to={`/app/contacts/${supportCase.contact.id}`}
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  View contact
                </Link>
              )}
            </div>

            {supportCase.contact ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 font-medium text-vynexa-text-primary">
                  <User className="h-4 w-4 text-vynexa-text-muted" />
                  <span>
                    {supportCase.contact.firstName} {supportCase.contact.lastName}
                  </span>
                </div>
                {supportCase.contact.jobTitle && (
                  <div className="text-[11px] text-vynexa-text-muted ml-6">
                    {supportCase.contact.jobTitle}
                  </div>
                )}
                {supportCase.contact.email && (
                  <div className="flex items-center gap-2 text-vynexa-text-secondary">
                    <Mail className="h-3.5 w-3.5 text-vynexa-text-muted" />
                    <span>{supportCase.contact.email}</span>
                  </div>
                )}
                {supportCase.contact.phone && (
                  <div className="flex items-center gap-2 text-vynexa-text-secondary">
                    <Phone className="h-3.5 w-3.5 text-vynexa-text-muted" />
                    <span>{supportCase.contact.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-vynexa-text-muted italic">No contact person linked.</p>
            )}
          </Card>

          {/* Attached Documents */}
          {id && <EntityDocumentsCard supportCaseId={id} />}
        </div>
      </div>

      {/* Resolve Case Modal */}
      <Dialog
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        title="Resolve support request"
        maxWidth="md"
      >
        <form onSubmit={handleResolve} className="space-y-4">
          <p className="text-xs text-vynexa-text-secondary">
            Describe how the customer's issue was resolved.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-vynexa-text-secondary">
              Resolution details <span className="text-rose-400">*</span>
            </label>
            <Textarea
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="Explain how the issue was resolved..."
              rows={4}
              required
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-vynexa-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={resolving}
              onClick={() => setIsResolveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={resolving || !resolutionText.trim()}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-400" />
              {resolving ? 'Submitting...' : 'Resolve request'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Close Case Modal */}
      <Dialog
        isOpen={isCloseOpen}
        onClose={() => setIsCloseOpen(false)}
        title="Close support request"
        maxWidth="sm"
      >
        <form onSubmit={handleClose} className="space-y-4">
          <p className="text-xs text-vynexa-text-secondary">
            Are you sure you want to close this support request? You can reopen it at any time.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-vynexa-text-secondary">
              Notes (optional)
            </label>
            <Textarea
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="Add any final notes..."
              rows={3}
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-vynexa-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={closing}
              onClick={() => setIsCloseOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={closing}
            >
              {closing ? 'Closing...' : 'Close request'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete support request"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-vynexa-text-secondary">
            Are you sure you want to delete request <span className="font-mono font-bold text-vynexa-text-primary">{supportCase.caseNumber}</span>? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-vynexa-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? 'Deleting...' : 'Delete request'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
