import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: (message: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...msg, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-vynexa-status-success shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-vynexa-status-warning shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-vynexa-status-danger shrink-0" />,
    info: <Info className="h-4 w-4 text-vynexa-status-info shrink-0" />
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border border-vynexa-border bg-vynexa-surface-elevated p-3 shadow-elevated transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 text-xs'
            )}
          >
            {icons[t.type || 'info']}
            <div className="flex-1 space-y-0.5">
              {t.title && <p className="font-semibold text-vynexa-text-primary">{t.title}</p>}
              <p className="text-vynexa-text-secondary">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-vynexa-text-muted hover:text-vynexa-text-primary transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
