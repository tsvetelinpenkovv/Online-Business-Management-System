import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AppErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = () => {
    sessionStorage.removeItem('boot_recovery');
    window.location.reload();
  };

  handleSafeMode = () => {
    sessionStorage.removeItem('boot_recovery');
    const url = new URL(window.location.href);
    url.searchParams.set('safe', '1');
    window.location.href = url.toString();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '2rem',
          textAlign: 'center',
          background: '#f8f9fa',
          color: '#1a1a2e',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Възникна грешка при зареждане
          </h1>
          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: '400px' }}>
            {this.state.error?.message || 'Неочаквана грешка'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '0.375rem',
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Презареди
            </button>
            <button
              onClick={this.handleSafeMode}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                background: '#fff',
                color: '#374151',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Safe Mode
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
