import React, { useState, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { documentsService } from '@/services/documents.service';
import { UploadCloud, File, X, AlertCircle } from 'lucide-react';

export interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  leadId?: string;
  accountId?: string;
  contactId?: string;
  opportunityId?: string;
  quoteId?: string;
  orderId?: string;
  supportCaseId?: string;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  leadId,
  accountId,
  contactId,
  opportunityId,
  quoteId,
  orderId,
  supportCaseId
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError('Selected file exceeds maximum allowed size of 10MB.');
        return;
      }
      setSelectedFile(file);
      if (!documentName) {
        // Default name without extension
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setDocumentName(nameWithoutExt);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError('Selected file exceeds maximum allowed size of 10MB.');
        return;
      }
      setSelectedFile(file);
      if (!documentName) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setDocumentName(nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please choose a file to upload.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      if (documentName.trim()) {
        formData.append('name', documentName.trim());
      }
      if (leadId) formData.append('leadId', leadId);
      if (accountId) formData.append('accountId', accountId);
      if (contactId) formData.append('contactId', contactId);
      if (opportunityId) formData.append('opportunityId', opportunityId);
      if (quoteId) formData.append('quoteId', quoteId);
      if (orderId) formData.append('orderId', orderId);
      if (supportCaseId) formData.append('supportCaseId', supportCaseId);

      await documentsService.uploadDocument(formData);

      toast({
        type: 'success',
        title: 'Document Uploaded',
        message: `Successfully stored ${selectedFile.name}`
      });

      setSelectedFile(null);
      setDocumentName('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Business Document"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dropzone Area */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-vynexa-border hover:border-vynexa-text-secondary/50 rounded-lg p-6 text-center cursor-pointer transition-colors bg-vynexa-surface-secondary/40 flex flex-col items-center justify-center space-y-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp"
          />

          <div className="p-3 rounded-full bg-vynexa-surface border border-vynexa-border text-vynexa-text-secondary">
            <UploadCloud className="h-6 w-6" />
          </div>

          <div className="text-xs">
            <span className="font-semibold text-vynexa-text-primary">Click to select</span> or drag and drop file here
          </div>
          <p className="text-[11px] text-vynexa-text-muted">
            PDF, Word, Excel, CSV, Text, or standard images (Max 10MB)
          </p>
        </div>

        {/* Selected file preview */}
        {selectedFile && (
          <div className="p-3 rounded-md bg-vynexa-surface-secondary border border-vynexa-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <File className="h-4 w-4 text-vynexa-text-secondary shrink-0" />
              <div className="truncate">
                <span className="font-medium text-vynexa-text-primary block truncate">
                  {selectedFile.name}
                </span>
                <span className="text-[10px] text-vynexa-text-muted font-mono">
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              className="text-vynexa-text-muted hover:text-vynexa-text-primary p-1 rounded hover:bg-vynexa-elevated transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Custom Document Name */}
        <div>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
            Display Document Name (Optional)
          </label>
          <Input
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            placeholder="e.g. Master Services Agreement 2026"
            className="text-xs"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-vynexa-border">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={!selectedFile || loading}>
            {loading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
