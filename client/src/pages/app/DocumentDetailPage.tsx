import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { documentsService } from '@/services/documents.service';
import { Document } from '@/types/documents.types';
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  Trash2,
  ArrowLeft,
  Edit2,
  Clock,
  User,
  Building2,
  TrendingUp,
  ShoppingBag,
  LifeBuoy
} from 'lucide-react';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDocument = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const doc = await documentsService.getDocumentById(id);
      setDocument(doc);
      setEditName(doc.name);
    } catch (err: any) {
      setError(err.message || 'Document not found.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleDownload = () => {
    if (!document) return;
    const url = documentsService.getDownloadUrl(document.id);
    window.open(url, '_blank');
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !editName.trim()) return;

    try {
      setSaving(true);
      const updated = await documentsService.updateDocument(document.id, editName.trim());
      setDocument(updated);
      setIsEditOpen(false);
      toast({
        type: 'success',
        title: 'Document Updated',
        message: 'Name updated successfully.'
      });
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Failed to update name.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    try {
      setDeleting(true);
      await documentsService.deleteDocument(document.id);
      toast({
        type: 'success',
        title: 'Document Deleted',
        message: 'File removed from repository.'
      });
      navigate('/app/documents');
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Failed to delete file.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (mime: string) => {
    if (mime.includes('pdf')) return <FileText className="h-6 w-6 text-red-400" />;
    if (mime.includes('sheet') || mime.includes('excel')) return <FileSpreadsheet className="h-6 w-6 text-emerald-400" />;
    if (mime.includes('image')) return <ImageIcon className="h-6 w-6 text-blue-400" />;
    return <FileCode className="h-6 w-6 text-vynexa-text-secondary" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-vynexa-surface-secondary" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 col-span-2 bg-vynexa-surface-secondary" />
          <Skeleton className="h-96 bg-vynexa-surface-secondary" />
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-red-400">{error || 'Document not found'}</p>
        <Button variant="outline" onClick={() => navigate('/app/documents')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={document.name}
        description={`Original file: ${document.originalName}`}
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Documents', href: '/app/documents' },
          { label: document.name }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/documents')}
              className="text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="text-xs flex items-center gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Rename</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              className="text-xs flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              className="text-xs flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details Card */}
        <Card className="md:col-span-2 bg-vynexa-surface border-vynexa-border">
          <CardHeader className="border-b border-vynexa-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-vynexa-text-primary flex items-center gap-2.5">
                {getFileIcon(document.mimeType)}
                <span>Document details</span>
              </CardTitle>
              <Badge variant="blue">{document.mimeType}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-6">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  File name
                </span>
                <span className="font-semibold text-vynexa-text-primary">{document.name}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  Original filename
                </span>
                <span className="font-mono text-vynexa-text-secondary">{document.originalName}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  File size
                </span>
                <span className="font-mono text-vynexa-text-primary font-semibold">
                  {formatFileSize(document.size)} ({document.size.toLocaleString()} bytes)
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  File ID
                </span>
                <span className="font-mono text-[11px] text-vynexa-text-muted truncate block">
                  {document.id}
                </span>
              </div>
            </div>

            <div className="border-t border-vynexa-border pt-4">
              <h4 className="text-xs font-semibold text-vynexa-text-primary mb-3">
                Linked to
              </h4>
              <div className="p-3 bg-vynexa-surface-secondary/50 rounded-lg border border-vynexa-border text-xs space-y-1">
                {document.account && (
                  <div className="flex items-center gap-2 text-vynexa-text-primary">
                    <Building2 className="h-4 w-4 text-blue-400" />
                    <span>Customer: <strong>{document.account.name}</strong></span>
                  </div>
                )}
                {document.opportunity && (
                  <div className="flex items-center gap-2 text-vynexa-text-primary">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span>Opportunity: <strong>{document.opportunity.name}</strong></span>
                  </div>
                )}
                {document.quote && (
                  <div className="flex items-center gap-2 text-vynexa-text-primary">
                    <FileText className="h-4 w-4 text-amber-400" />
                    <span>Quote: <strong>#{document.quote.quoteNumber}</strong></span>
                  </div>
                )}
                {document.order && (
                  <div className="flex items-center gap-2 text-vynexa-text-primary">
                    <ShoppingBag className="h-4 w-4 text-purple-400" />
                    <span>Order: <strong>#{document.order.orderNumber}</strong></span>
                  </div>
                )}
                {document.supportCase && (
                  <div className="flex items-center gap-2 text-vynexa-text-primary">
                    <LifeBuoy className="h-4 w-4 text-red-400" />
                    <span>Support request: <strong>{document.supportCase.subject}</strong></span>
                  </div>
                )}
                {!document.account && !document.opportunity && !document.quote && !document.order && !document.supportCase && (
                  <p className="text-vynexa-text-muted text-xs">
                    This file is not linked to any specific record.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Info Card */}
        <Card className="bg-vynexa-surface border-vynexa-border">
          <CardHeader className="border-b border-vynexa-border pb-4">
            <CardTitle className="text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider">
              Upload details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                Uploaded by
              </span>
              <div className="flex items-center gap-2 font-medium text-vynexa-text-primary">
                <User className="h-3.5 w-3.5 text-vynexa-text-muted" />
                <span>{document.uploadedBy?.name || 'Workspace User'}</span>
              </div>
              <span className="text-[10px] text-vynexa-text-muted font-mono block pl-5">
                {document.uploadedBy?.email}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                Upload date
              </span>
              <div className="flex items-center gap-2 text-vynexa-text-secondary font-mono text-[11px]">
                <Clock className="h-3.5 w-3.5 text-vynexa-text-muted" />
                <span>{new Date(document.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                Last modified
              </span>
              <span className="text-vynexa-text-muted font-mono text-[11px] block">
                {new Date(document.updatedAt).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Name Modal */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Rename document"
        maxWidth="sm"
      >
        <form onSubmit={handleUpdateName} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Document name
            </label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="text-xs"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={saving || !editName.trim()}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete document"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-vynexa-text-secondary leading-relaxed">
            Are you sure you want to delete <strong className="text-vynexa-text-primary">{document.name}</strong>?
            This will permanently delete the file.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete document'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
