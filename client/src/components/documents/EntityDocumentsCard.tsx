import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { documentsService } from '@/services/documents.service';
import { Document } from '@/types/documents.types';
import { UploadDocumentModal } from './UploadDocumentModal';
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  Trash2,
  Plus,
  Clock,
  User
} from 'lucide-react';

export interface EntityDocumentsCardProps {
  title?: string;
  leadId?: string;
  accountId?: string;
  contactId?: string;
  opportunityId?: string;
  quoteId?: string;
  orderId?: string;
  supportCaseId?: string;
}

export const EntityDocumentsCard: React.FC<EntityDocumentsCardProps> = ({
  title = 'Attached Documents',
  leadId,
  accountId,
  contactId,
  opportunityId,
  quoteId,
  orderId,
  supportCaseId
}) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await documentsService.getDocuments({
        leadId,
        accountId,
        contactId,
        opportunityId,
        quoteId,
        orderId,
        supportCaseId,
        limit: 50
      });
      setDocuments(res.documents);
    } catch (_err) {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [leadId, accountId, contactId, opportunityId, quoteId, orderId, supportCaseId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async () => {
    if (!selectedForDelete) return;
    try {
      setDeleting(true);
      await documentsService.deleteDocument(selectedForDelete.id);
      toast({
        type: 'success',
        title: 'Document Deleted',
        message: 'File removed successfully from entity.'
      });
      setSelectedForDelete(null);
      fetchDocuments();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Failed to remove document.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const getFileIcon = (mimeType: string, filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (mimeType.includes('pdf') || ext === 'pdf') {
      return <FileText className="h-4 w-4 text-red-400 shrink-0" />;
    }
    if (mimeType.includes('sheet') || mimeType.includes('excel') || ext === 'xlsx' || ext === 'csv') {
      return <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />;
    }
    if (mimeType.includes('image') || ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
      return <ImageIcon className="h-4 w-4 text-blue-400 shrink-0" />;
    }
    return <FileCode className="h-4 w-4 text-vynexa-text-secondary shrink-0" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = (doc: Document) => {
    const url = documentsService.getDownloadUrl(doc.id);
    window.open(url, '_blank');
  };

  return (
    <Card className="bg-vynexa-surface border-vynexa-border">
      <CardHeader className="border-b border-vynexa-border pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-vynexa-text-primary flex items-center gap-2">
          <FileText className="h-4 w-4 text-vynexa-text-muted" />
          <span>{title}</span>
          <span className="text-xs font-mono font-normal text-vynexa-text-muted">
            ({documents.length})
          </span>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsUploadOpen(true)}
          className="text-xs flex items-center gap-1.5 h-8"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Attach File</span>
        </Button>
      </CardHeader>

      <CardContent className="pt-3">
        {loading ? (
          <div className="py-6 text-center text-xs text-vynexa-text-muted font-mono">
            Loading document repository...
          </div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <FileCode className="h-8 w-8 text-vynexa-text-muted mx-auto opacity-40" />
            <p className="text-xs text-vynexa-text-secondary">No files attached to this record.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              className="text-xs mx-auto"
            >
              Upload First Document
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-vynexa-border/60">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-vynexa-surface-secondary/40 px-2 rounded transition-colors"
              >
                <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                  {getFileIcon(doc.mimeType, doc.originalName)}
                  <div className="truncate">
                    <span className="font-medium text-vynexa-text-primary block truncate">
                      {doc.name}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-vynexa-text-muted font-mono mt-0.5">
                      <span>{doc.originalName}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.size)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="h-2.5 w-2.5" />
                        {doc.uploadedBy?.name || 'User'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    title="Download file"
                    className="h-7 w-7 p-0 text-vynexa-text-muted hover:text-vynexa-text-primary"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedForDelete(doc)}
                    title="Delete document"
                    className="h-7 w-7 p-0 text-vynexa-text-muted hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchDocuments}
        leadId={leadId}
        accountId={accountId}
        contactId={contactId}
        opportunityId={opportunityId}
        quoteId={quoteId}
        orderId={orderId}
        supportCaseId={supportCaseId}
      />

      {/* Delete Confirmation */}
      <Dialog
        isOpen={!!selectedForDelete}
        onClose={() => setSelectedForDelete(null)}
        title="Remove Document"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-vynexa-text-secondary leading-relaxed">
            Are you sure you want to delete{' '}
            <strong className="text-vynexa-text-primary">{selectedForDelete?.name}</strong>?
            This will permanently remove the underlying physical file and soft-delete the metadata.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedForDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Removing...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  );
};
