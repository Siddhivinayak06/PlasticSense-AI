'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  title?: string;
  compact?: boolean;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'Component execution error' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isCompact = this.props.compact;

      return (
        <div className={`flex flex-col items-center justify-center text-center glass rounded-2xl border border-border/60 ${isCompact ? 'p-4 min-h-[160px]' : 'p-8 min-h-[300px] m-4'}`}>
          <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
            <span className="text-lg font-bold">!</span>
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">
            {this.props.title || 'Something went wrong'}
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mb-2">
            An unexpected error occurred while rendering this component.
          </p>
          {this.state.errorMessage && (
            <p className="text-[11px] font-mono text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg max-w-lg mb-3 break-all">
              {this.state.errorMessage}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => this.setState({ hasError: false, errorMessage: undefined })}
              className="inline-flex items-center justify-center rounded-xl bg-muted px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors border border-border/60"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.reload();
              }}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
