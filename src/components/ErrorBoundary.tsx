import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Here you could send the error to your error reporting service
    // Example: Sentry.captureException(error);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4">
          <div className="bg-[#282828] p-6 rounded-lg max-w-lg w-full text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-gray-400 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="space-y-4">
              <button
                onClick={this.handleReload}
                className="bg-[#1DB954] text-black px-6 py-2 rounded-full font-semibold hover:bg-[#1ed760] transition-colors duration-200 w-full"
              >
                Reload page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-[#282828] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#3E3E3E] transition-colors duration-200 w-full border border-white/10"
              >
                Go to home page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 