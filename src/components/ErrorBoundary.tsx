import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Shown above the error so the user knows what failed. */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time errors in its subtree and shows a readable fallback
 * instead of a blank white screen. Error boundaries must be class components.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100">
          <div className="max-w-sm w-full text-center">
            <div className="text-4xl mb-4" aria-hidden="true">⚠️</div>
            <h1 className="text-lg font-bold mb-2">{this.props.label || 'Something went wrong'}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              The page hit an error and couldn't finish loading. This usually clears on a refresh.
            </p>
            <pre className="text-left text-xs bg-gray-100 dark:bg-slate-900 rounded-lg p-3 mb-5 overflow-x-auto text-red-600 dark:text-red-400">
              {this.state.error.message}
            </pre>
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
