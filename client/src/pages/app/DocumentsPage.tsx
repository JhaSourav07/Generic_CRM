import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { documentsService } from '@/services/documents.service';
import { Document } from '@/types/documents.types';
import { UploadDocumentModal } from '@/components/documents/UploadDocumentModal';
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  ExternalLink
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await documentsService.getDocuments({
        page,
        limit: 15,
        search: search.trim() || undefined,
        mimeType: mimeType || undefined
      });
      setDocuments(res.documents);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (_err) {
      toast({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch documents.'
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, mimeType, toast]);

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
        message: 'File removed successfully.'
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

  const getFileIcon = (mime: string, filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (mime.includes('pdf') || ext === 'pdf') {
      return <FileText className="h-5 w-5 text-red-400 shrink-0" />;
    }
    if (mime.includes('sheet') || mime.includes('excel') || ext === 'xlsx' || ext === 'csv') {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-400 shrink-0" />;
    }
    if (mime.includes('image') || ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
      return <ImageIcon className="h-5 w-5 text-blue-400 shrink-0" />;
    }
    return <FileCode className="h-5 w-5 text-vynexa-text-secondary shrink-0" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    const url = documentsService.getDownloadUrl(doc.id);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Store and manage contracts, proposals, receipts, and other files in one place."
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Documents' }
        ]}
        actions={
          <Button
            variant="primary"
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Upload document</span>
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <Card className="p-4 bg-vynexa-surface border-vynexa-border">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-wrap flex-1 items-center gap-3 w-full">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-vynexa-text-muted" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Select
              value={mimeType}
              onChange={(e) => {
                setMimeType(e.target.value);
                setPage(1);
              }}
              options={[
                { label: 'All file types', value: '' },
                { label: 'PDF files', value: 'application/pdf' },
                { label: 'Spreadsheets (Excel, CSV)', value: 'application/vnd' },
                { label: 'Images (PNG, JPEG)', value: 'image/' },
                { label: 'Text files', value: 'text/' }
              ]}
              className="w-48 shrink-0 h-9 text-xs"
            />
          </div>

          <span className="text-xs font-mono text-vynexa-text-muted shrink-0 self-end md:self-auto">
            Total files: {totalCount}
          </span>
        </div>
      </Card>

      {/* Documents Table */}
      <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-vynexa-surface-secondary/60 text-vynexa-text-secondary uppercase tracking-wider font-mono text-[10px] border-b border-vynexa-border">
              <tr>
                <th className="py-3 px-4 font-semibold">Document</th>
                <th className="py-3 px-4 font-semibold">Related to</th>
                <th className="py-3 px-4 font-semibold">Size</th>
                <th className="py-3 px-4 font-semibold">Uploaded by</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vynexa-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-vynexa-text-muted font-mono">
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center space-y-2">
                    <FileCode className="h-8 w-8 text-vynexa-text-muted mx-auto opacity-40" />
                    <p className="text-xs text-vynexa-text-secondary">No documents found.</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/app/documents/${doc.id}`)}
                    className="hover:bg-vynexa-surface-secondary/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.mimeType, doc.originalName)}
                        <div className="truncate max-w-xs">
                          <span className="font-semibold text-vynexa-text-primary block truncate">
                            {doc.name}
                          </span>
                          <span className="text-[10px] text-vynexa-text-muted font-mono truncate block">
                            {doc.originalName}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-vynexa-text-secondary">
                      {doc.account && (
                        <span className="font-mono text-[11px] text-blue-400 block truncate">
                          Customer: {doc.account.name}
                        </span>
                      )}
                      {doc.opportunity && (
                        <span className="font-mono text-[11px] text-emerald-400 block truncate">
                          Opportunity: {doc.opportunity.name}
                        </span>
                      )}
                      {doc.quote && (
                        <span className="font-mono text-[11px] text-amber-400 block truncate">
                          Quote: #{doc.quote.quoteNumber}
                        </span>
                      )}
                      {doc.order && (
                        <span className="font-mono text-[11px] text-purple-400 block truncate">
                          Order: #{doc.order.orderNumber}
                        </span>
                      )}
                      {doc.supportCase && (
                        <span className="font-mono text-[11px] text-red-400 block truncate">
                          Support: {doc.supportCase.subject}
                        </span>
                      )}
                      {!doc.account && !doc.opportunity && !doc.quote && !doc.order && !doc.supportCase && (
                        <span className="text-vynexa-text-muted font-mono text-[10px]">
                          General
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-vynexa-text-secondary">
                      {formatFileSize(doc.size)}
                    </td>

                    <td className="py-3 px-4 text-vynexa-text-secondary">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-vynexa-text-muted" />
                        {doc.uploadedBy?.name || 'User'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-vynexa-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDownload(e, doc)}
                          title="Download"
                          className="h-7 w-7 p-0 text-vynexa-text-muted hover:text-vynexa-text-primary"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedForDelete(doc);
                          }}
                          title="Delete"
                          className="h-7 w-7 p-0 text-vynexa-text-muted hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3.5 border-t border-vynexa-border flex items-center justify-between text-xs text-vynexa-text-muted bg-vynexa-surface-secondary/30">
          <span>
            Showing Page <strong className="text-vynexa-text-primary font-mono">{page}</strong> of{' '}
            <strong className="text-vynexa-text-primary font-mono">{totalPages || 1}</strong>
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="h-7 text-xs flex items-center gap-1"
            >
              <ChevronLeft className="h-3 w-3" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="h-7 text-xs flex items-center gap-1"
            >
              Next <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>

      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchDocuments}
      />

      {/* Delete Confirmation */}
      <Dialog
        isOpen={!!selectedForDelete}
        onClose={() => setSelectedForDelete(null)}
        title="Delete document"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-vynexa-text-secondary leading-relaxed">
            Are you sure you want to delete{' '}
            <strong className="text-vynexa-text-primary">{selectedForDelete?.name}</strong>?
            This file will be permanently removed.
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
              {deleting ? 'Deleting...' : 'Delete document'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
