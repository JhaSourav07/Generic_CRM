import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected rendering error occurred'
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[CRITICAL_CLIENT_ERROR]', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/app/dashboard';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4 text-[#F5F5F5] font-sans">
          <div className="w-full max-w-md rounded-lg border border-[#292929] bg-[#141414] p-6 shadow-2xl text-center space-y-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold tracking-tight text-[#F5F5F5]">
                Something went wrong
              </h2>
              <p className="text-xs text-[#A1A1A1] leading-relaxed">
                An unexpected application error occurred. Your authentication session and data remain secure.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReload}
                className="w-full sm:w-auto text-xs"
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Reload Application
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto text-xs"
              >
                <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
