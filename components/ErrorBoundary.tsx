import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 border border-brand-error/20 bg-brand-error/5 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 bg-brand-error/10 text-brand-error rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-black text-brand-charcoal uppercase tracking-widest">Neural Rendering Error</h3>
            <p className="text-[10px] text-brand-muted font-medium uppercase tracking-wider">The analysis component encountered an unexpected data structure.</p>
          </div>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-brand-charcoal text-white text-[10px] font-black uppercase rounded-lg tracking-widest hover:bg-brand-gold transition-colors"
          >
            Attempt Recovery
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
